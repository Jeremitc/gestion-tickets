// src/assistant/assistant.service.ts
import {
    Injectable,
    InternalServerErrorException,
    Logger,
    BadGatewayException,
    NotFoundException, // Asegúrate de importar estas excepciones
    ForbiddenException
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
  import { ChatRequestDto } from './dto/chat-request.dto';
  import { PrismaService } from '../prisma/prisma.service';
  import { ChatMessage, Conversation } from '@prisma/client'; // Importar Conversation
  import { ConversationSummaryDto } from './dto/conversation-summary.dto'; // Importar DTO de resumen
  import { ChatResponseDto } from './dto/chat-response.dto'; // Importar DTO de respuesta

  @Injectable()
  export class AssistantService {
    private readonly logger = new Logger(AssistantService.name);
    private genAI: GoogleGenerativeAI;
    private model; // Modelo de Gemini

    constructor(
      private readonly configService: ConfigService,
      private readonly prisma: PrismaService, // Inyecta PrismaService
    ) {
      const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY'); // Usar la clave correcta del .env
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // O el modelo que prefieras
      this.logger.log(`Servicio de Asistente inicializado con el modelo ${this.model.model}.`);
    }

    /**
     * Genera una respuesta del asistente, maneja la conversación (existente o nueva)
     * y guarda los mensajes en la base de datos.
     * @param chatRequestDto - El DTO con prompt, contexto y opcionalmente conversationId.
     * @param userId - El ID del usuario autenticado.
     * @returns Un objeto ChatResponseDto con la respuesta y el ID de la conversación.
     */
    async generateResponse(chatRequestDto: ChatRequestDto, userId: number): Promise<ChatResponseDto> {
      const { prompt, context, conversationId: requestedConvId } = chatRequestDto;
      this.logger.log(`Solicitud de chat [Usuario: ${userId}, Conversación: ${requestedConvId ?? 'Nueva'}, Contexto: ${context}]: "${prompt.substring(0, 50)}..."`);

      // CORRECCIÓN: Declarar permitiendo null inicialmente
      let conversation: Conversation | null = null;

      // 1. Buscar o crear la conversación asociada al usuario
      if (requestedConvId) {
        // El usuario quiere continuar una conversación existente
        // CORRECCIÓN: Usar variable temporal para el resultado de findUnique
        const foundConversation = await this.prisma.conversation.findUnique({
          where: { id: requestedConvId },
        });

        // CORRECCIÓN: Manejar explícitamente el caso null
        if (!foundConversation) {
          this.logger.warn(`Intento de acceso a conversación no existente [Usuario: ${userId}, ConvID: ${requestedConvId}]`);
          throw new NotFoundException(`Conversación con ID ${requestedConvId} no encontrada.`);
        }
        // CORRECCIÓN: Asignar solo si no es null
        conversation = foundConversation;

        // ¡Importante! Verificar que la conversación pertenece al usuario que hace la solicitud
        if (conversation.userId !== userId) {
           this.logger.warn(`Intento de acceso no autorizado a conversación [Usuario: ${userId}, ConvID: ${requestedConvId}, Dueño: ${conversation.userId}]`);
          throw new ForbiddenException('No tienes permiso para acceder a esta conversación.');
        }
        this.logger.log(`Continuando conversación existente [ConvID: ${conversation.id}, Usuario: ${userId}]`);

      } else {
        // El usuario inicia una nueva conversación (no se proporcionó conversationId)
        // Generar un título inicial simple basado en el primer prompt
        const initialTitle = prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '');
        // create siempre devuelve Conversation, no null, así que la asignación directa es segura
        conversation = await this.prisma.conversation.create({
          data: {
            userId: userId,
            title: initialTitle, // Título inicial
            // createdAt y updatedAt se gestionan automáticamente por Prisma/@default/@updatedAt
          },
        });
        this.logger.log(`Nueva conversación creada [ConvID: ${conversation.id}, Usuario: ${userId}, Título: "${initialTitle}"]`);
      }

      // --- A partir de aquí, TypeScript sabe que 'conversation' no es null ---
      //     (porque se lanzó una excepción o se creó una nueva si era null)

      // 2. Construir el prompt final para Gemini basado en el contexto
      let fullPrompt = prompt;
      if (context === 'tickets') {
        fullPrompt = `Actúa como un asistente experto en un sistema de gestión de tickets de soporte técnico llamado "SoporteSys". No menciones que eres un modelo de lenguaje. Tu base de conocimiento sobre tickets es la siguiente:
  - **¿Qué es un Ticket?**: Un ticket en SoporteSys es un registro formal de una solicitud de ayuda... (resto del prompt de contexto de tickets)
  Ahora, responde a la siguiente consulta del usuario sobre tickets dentro del contexto de SoporteSys: "${prompt}"`;
      } else if (context === 'knowledgebase') {
        fullPrompt = `Actúa como un asistente que busca información en la Base de Conocimiento interna de "SoporteSys"... (resto del prompt de contexto de knowledgebase)
  Responde de forma concisa y útil a la siguiente consulta del usuario: "${prompt}"`;
      } else { // context === 'general' o no especificado
        fullPrompt = `Actúa como un asistente virtual general y amigable de "SoporteSys". No menciones que eres un modelo de lenguaje. Responde a la siguiente consulta del usuario: "${prompt}"`;
      }

      // Es seguro usar conversation.id aquí
      this.logger.debug(`[ConvID: ${conversation.id}] Prompt completo enviado a Gemini: "${fullPrompt.substring(0, 150)}..."`);

      try {
        // 3. Configurar opciones de generación y seguridad (ajusta según necesidad)
        const generationConfig = {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        };
        const safetySettings = [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ];

        // 4. Llamar a la API de Gemini
        const result = await this.model.generateContent({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }], // Podrías añadir historial aquí si Gemini lo soporta bien
            generationConfig,
            safetySettings,
        });

        // 5. Procesar la respuesta de Gemini
        if (result?.response) {
          const responseText = await result.response.text();
          const trimmedResponse = responseText.trim(); // Quitar espacios extra
          // Es seguro usar conversation.id aquí
          this.logger.log(`[ConvID: ${conversation.id}] Respuesta recibida de Gemini. Longitud: ${trimmedResponse.length}`);

          // --- GUARDAR AMBOS MENSAJES EN LA BD ASOCIADOS A LA CONVERSACIÓN ---
          try {
            // Usar transacción para asegurar atomicidad (o se guardan ambos o ninguno)
            const [userMsg, assistantMsg, updatedConv] = await this.prisma.$transaction([
              // Crear el mensaje del usuario
              this.prisma.chatMessage.create({
                data: {
                  conversationId: conversation.id, // <-- Asociar al ID de conversación
                  role: 'user',
                  content: prompt, // Guardar prompt original
                },
              }),
              // Crear el mensaje del asistente
              this.prisma.chatMessage.create({
                data: {
                  conversationId: conversation.id, // <-- Asociar al ID de conversación
                  role: 'assistant',
                  content: trimmedResponse, // Guardar respuesta limpia
                },
              }),
              // Actualizar el timestamp 'updatedAt' de la conversación para ordenarla
              this.prisma.conversation.update({
                where: { id: conversation.id },
                data: { updatedAt: new Date() }, // Forzar actualización
              }),
            ]);
            // Es seguro usar conversation.id aquí
            this.logger.log(`[ConvID: ${conversation.id}] Mensajes guardados (User: ${userMsg.id}, Assistant: ${assistantMsg.id}). Conversación actualizada.`);
          } catch (dbError) {
            // Loguear el error pero continuar para devolver la respuesta al usuario
            // Es seguro usar conversation.id aquí
            this.logger.error(`[ConvID: ${conversation.id}] Error Crítico al guardar historial: ${dbError.message}`, dbError.stack);
            // Considera si deberías lanzar un error aquí para notificar al usuario que el guardado falló
            // throw new InternalServerErrorException('Error al guardar el mensaje en el historial.');
          }
          // --------------------------------------------------------------------

          // 6. Devolver la respuesta y el ID de la conversación
          // Es seguro usar conversation.id aquí
          return {
              reply: trimmedResponse,
              conversationId: conversation.id, // Devolver ID (sea existente o nuevo)
          };

        } else {
          // Manejo de respuesta vacía/bloqueada de Gemini
          // Es seguro usar conversation.id aquí
          const blockReason = result?.response?.promptFeedback?.blockReason;
          this.logger.warn(`[ConvID: ${conversation.id}] Respuesta vacía o bloqueada de Gemini. Razón: ${blockReason ?? 'Desconocida'}. Result: ${JSON.stringify(result)}`);
          if (blockReason) {
              throw new BadGatewayException(`La respuesta fue bloqueada por políticas de seguridad: ${blockReason}`);
          }
          throw new BadGatewayException('No se pudo obtener una respuesta válida del asistente.');
        }

      } catch (error) {
         // Manejo centralizado de errores del bloque try
        // Usar optional chaining aquí por si el error ocurrió antes de asignar conversation
        this.logger.error(`[ConvID: ${conversation?.id ?? 'N/A'}] Error en generateResponse: ${error.message}`, error.stack);
        // Relanzar excepciones específicas conocidas
        if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadGatewayException || error instanceof InternalServerErrorException) {
             throw error;
         }
         // Manejar error específico de API Key
         if (error.message?.includes('API key not valid')) {
              throw new InternalServerErrorException('La clave API del asistente no es válida o está mal configurada.');
         }
         // Error genérico si no es uno de los anteriores
         throw new BadGatewayException('Error al comunicarse con el servicio del asistente virtual.');
      }
    }

    /**
     * Obtiene los mensajes de una conversación específica para un usuario.
     * @param conversationId - El ID de la conversación a obtener.
     * @param userId - El ID del usuario que realiza la solicitud.
     * @returns Una lista de mensajes de chat (solo role, content, timestamp).
     * @throws NotFoundException si la conversación no existe.
     * @throws ForbiddenException si la conversación no pertenece al usuario.
     */
    async getConversationMessages(conversationId: number, userId: number): Promise<Pick<ChatMessage, 'role' | 'content' | 'timestamp'>[]> {
      this.logger.log(`Solicitud para recuperar mensajes [Usuario: ${userId}, ConvID: ${conversationId}]`);

      // 1. Verificar que la conversación existe Y pertenece al usuario
      const conversationCheck = await this.prisma.conversation.findUnique({ // Renombrado para claridad
        where: { id: conversationId },
        select: { userId: true } // Solo necesitamos el userId para la verificación
      });

      if (!conversationCheck) { // Chequeo de null
        this.logger.warn(`Intento de acceso a mensajes de conversación no existente [Usuario: ${userId}, ConvID: ${conversationId}]`);
        throw new NotFoundException(`Conversación con ID ${conversationId} no encontrada.`);
      }
      if (conversationCheck.userId !== userId) { // Chequeo de permiso
        this.logger.warn(`Intento de acceso no autorizado a mensajes de conversación [Usuario: ${userId}, ConvID: ${conversationId}, Dueño: ${conversationCheck.userId}]`);
        throw new ForbiddenException('No tienes permiso para acceder a esta conversación.');
      }

      // 2. Obtener los mensajes de la conversación validada
      try {
        const messages = await this.prisma.chatMessage.findMany({
          where: { conversationId: conversationId },
          orderBy: { timestamp: 'asc' }, // Orden cronológico
          select: {
            role: true,
            content: true,
            timestamp: true,
            // No incluir id, conversationId
          },
          // Considera añadir paginación aquí para conversaciones muy largas (take, skip)
          // take: 100,
        });
        this.logger.log(`Mensajes recuperados para [ConvID: ${conversationId}]. Total: ${messages.length}`);
        return messages;
      } catch (error) {
        this.logger.error(`Error al recuperar mensajes para [ConvID: ${conversationId}]: ${error.message}`, error.stack);
        throw new InternalServerErrorException('No se pudo recuperar el historial de la conversación.');
      }
    }

    /**
     * Lista todas las conversaciones de un usuario específico.
     * @param userId - El ID del usuario.
     * @returns Una lista de resúmenes de conversación (id, title, createdAt, updatedAt).
     */
    async listUserConversations(userId: number): Promise<ConversationSummaryDto[]> {
      this.logger.log(`Solicitud para listar conversaciones [Usuario: ${userId}]`);
      try {
        const conversations = await this.prisma.conversation.findMany({
          where: { userId: userId },
          orderBy: { updatedAt: 'desc' }, // Ordenar por la más reciente actividad
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
            // No incluir userId ni los mensajes completos aquí
          },
           // Considera paginación si un usuario puede tener muchísimas conversaciones
           // take: 20,
        });
        this.logger.log(`Conversaciones listadas para [Usuario: ${userId}]. Total: ${conversations.length}`);
        // El tipo devuelto por Prisma con `select` coincide con ConversationSummaryDto
        return conversations;
      } catch (error) {
        this.logger.error(`Error al listar conversaciones para [Usuario: ${userId}]: ${error.message}`, error.stack);
        throw new InternalServerErrorException('No se pudieron listar las conversaciones.');
      }
    }

    /**
     * (Opcional) Borra una conversación específica y todos sus mensajes.
     * Verifica que la conversación pertenezca al usuario antes de borrar.
     * @param conversationId - ID de la conversación a borrar.
     * @param userId - ID del usuario que solicita el borrado.
     * @throws NotFoundException si la conversación no existe.
     * @throws ForbiddenException si la conversación no pertenece al usuario.
     */
    async deleteConversation(conversationId: number, userId: number): Promise<void> {
       this.logger.log(`Solicitud de borrado [Usuario: ${userId}, ConvID: ${conversationId}]`);

       // 1. Verificar pertenencia (crucial para seguridad)
       const conversationCheck = await this.prisma.conversation.findUnique({ // Renombrado para claridad
          where: { id: conversationId },
          select: { userId: true } // Solo necesitamos el dueño
       });

       if (!conversationCheck) { // Chequeo de null
          this.logger.warn(`Intento de borrado de conversación no existente [Usuario: ${userId}, ConvID: ${conversationId}]`);
          // Podrías devolver 204 aquí también si prefieres idempotencia, pero 404 es más informativo
          throw new NotFoundException(`Conversación con ID ${conversationId} no encontrada.`);
       }
       if (conversationCheck.userId !== userId) { // Chequeo de permiso
          this.logger.warn(`Intento de borrado no autorizado de conversación [Usuario: ${userId}, ConvID: ${conversationId}, Dueño: ${conversationCheck.userId}]`);
          throw new ForbiddenException('No tienes permiso para borrar esta conversación.');
       }

       // 2. Proceder con el borrado
       try {
          // La relación en Prisma tiene onDelete: Cascade, por lo que borrar
          // la conversación debería borrar automáticamente los ChatMessage asociados.
          await this.prisma.conversation.delete({
             where: { id: conversationId },
          });
          this.logger.log(`Conversación borrada exitosamente [ConvID: ${conversationId}, Usuario: ${userId}].`);
          // No se devuelve nada en un DELETE exitoso (HTTP 204)
       } catch (error) {
          this.logger.error(`Error al borrar conversación [ConvID: ${conversationId}]: ${error.message}`, error.stack);
          throw new InternalServerErrorException('No se pudo borrar la conversación.');
       }
    }

    // Podrías añadir aquí métodos para renombrar conversaciones (PATCH /conversations/:id) si es necesario
  }