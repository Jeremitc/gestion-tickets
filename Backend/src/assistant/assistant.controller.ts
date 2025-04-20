// src/assistant/assistant.controller.ts
import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
    Get,
    Param,
    ParseIntPipe, // Para validar IDs numéricos de la URL
    Delete,       // Para el método de borrado
    NotFoundException,
    ForbiddenException,
    Query // Importado, aunque no se usa directamente aquí todavía (podría ser para paginación futura)
  } from '@nestjs/common';
  import { AssistantService } from './assistant.service';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Asegura que la ruta es correcta
  import { ChatRequestDto } from './dto/chat-request.dto';
  import { ChatResponseDto } from './dto/chat-response.dto';
  import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiResponse,
    ApiBody,
    ApiParam, // Para documentar parámetros de ruta como :id
    ApiQuery // Podría usarse para documentar query params de paginación
  } from '@nestjs/swagger';
  import { ChatHistoryMessageDto } from './dto/chat-history-message.dto'; // DTO para un mensaje del historial
  import { ConversationSummaryDto } from './dto/conversation-summary.dto'; // DTO para resumen de conversación
  
  @ApiTags('Assistant') // Agrupación en Swagger
  @Controller('assistant') // Ruta base: /assistant
  @UseGuards(JwtAuthGuard) // Proteger TODOS los endpoints de este controlador con autenticación JWT
  @ApiBearerAuth('access-token') // Indicar en Swagger que se requiere JWT para todos los endpoints aquí
  export class AssistantController {
    constructor(private readonly assistantService: AssistantService) {} // Inyectar el servicio
  
    // --- Endpoint para enviar mensaje (POST /assistant/chat) ---
    @Post('chat') // Define la ruta POST específica
    @HttpCode(HttpStatus.OK) // Establece el código de estado HTTP para éxito (200 OK)
    @ApiOperation({ // Describe la operación en Swagger
      summary: 'Enviar mensaje al asistente',
      description: 'Envía un prompt y contexto. Puede continuar una conversación existente (enviando `conversationId`) o iniciar una nueva (omitiendo `conversationId`). Devuelve la respuesta del asistente y el ID de la conversación.',
    })
    @ApiBody({ type: ChatRequestDto }) // Describe el cuerpo esperado en Swagger
    // Documenta las posibles respuestas en Swagger
    @ApiResponse({ status: 200, description: 'Respuesta generada exitosamente.', type: ChatResponseDto })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos (DTO validation).' })
    @ApiResponse({ status: 401, description: 'No autorizado (Token JWT inválido o ausente).' })
    @ApiResponse({ status: 403, description: 'Acceso prohibido (Intento de acceder a conversación ajena).' })
    @ApiResponse({ status: 404, description: 'Conversación no encontrada (si se proporcionó un ID inválido).' })
    @ApiResponse({ status: 500, description: 'Error interno del servidor (p.ej., error DB).' })
    @ApiResponse({ status: 502, description: 'Error al comunicarse con la API de Gemini.' })
    async handleChat(
      @Body() chatRequestDto: ChatRequestDto, // Extrae y valida el cuerpo de la solicitud usando el DTO
      @Req() req, // Accede al objeto de solicitud (Request) para obtener datos del usuario adjuntos por el Guard
    ): Promise<ChatResponseDto> { // El tipo de retorno es una Promesa que resuelve a ChatResponseDto
      const userId = req.user?.id; // Obtiene el ID del usuario del payload del token (validado por JwtAuthGuard)
      // Delega la lógica principal al servicio, pasando los datos necesarios
      return this.assistantService.generateResponse(chatRequestDto, userId);
    }
  
    // --- Endpoint para listar conversaciones (GET /assistant/conversations) ---
    @Get('conversations') // Define la ruta GET específica
    @ApiOperation({ // Describe la operación en Swagger
      summary: 'Listar mis conversaciones',
      description: 'Obtiene una lista resumida de todas las conversaciones iniciadas por el usuario autenticado, ordenadas por la más reciente actividad.',
    })
    // Documenta las posibles respuestas en Swagger
    @ApiResponse({ status: 200, description: 'Lista de resúmenes de conversaciones.', type: [ConversationSummaryDto] }) // Indica que devuelve un array del DTO
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 500, description: 'Error al obtener la lista de conversaciones.' })
    async listConversations(
        @Req() req // Accede al objeto Request para obtener el usuario
        // @Query() paginationDto: PaginationDto // Ejemplo futuro: Añadir DTO para query params de paginación
    ): Promise<ConversationSummaryDto[]> { // Devuelve una Promesa de array de DTOs
       const userId = req.user?.id; // Obtiene el ID del usuario autenticado
       // Llama al método correspondiente en el servicio
       return this.assistantService.listUserConversations(userId);
       // Futuro con paginación: return this.assistantService.listUserConversations(userId, paginationDto);
    }
  
    // --- Endpoint para obtener mensajes de una conversación (GET /assistant/conversations/:id/messages) ---
    @Get('conversations/:id/messages') // Ruta incluye el ID de la conversación como parámetro
    @ApiOperation({ // Describe la operación en Swagger
      summary: 'Obtener mensajes de una conversación',
      description: 'Recupera todos los mensajes (historial) de una conversación específica perteneciente al usuario autenticado.',
    })
    @ApiParam({ name: 'id', description: 'El ID numérico de la conversación', type: Number, required: true }) // Documentar el parámetro de ruta ':id'
    // Documenta las posibles respuestas en Swagger
    @ApiResponse({ status: 200, description: 'Lista de mensajes de la conversación.', type: [ChatHistoryMessageDto] }) // Devuelve array de mensajes
    @ApiResponse({ status: 400, description: 'ID de conversación inválido (no es un número).' }) // Error de ParseIntPipe
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    @ApiResponse({ status: 403, description: 'Acceso prohibido a esta conversación.' }) // Error lanzado por el servicio
    @ApiResponse({ status: 404, description: 'Conversación no encontrada.' }) // Error lanzado por el servicio
    @ApiResponse({ status: 500, description: 'Error al recuperar los mensajes.' })
    async getConversationMessages(
      @Param('id', ParseIntPipe) conversationId: number, // Extrae 'id' de la URL, valida y convierte a número
      @Req() req, // Para obtener el usuario
      // @Query() paginationDto: PaginationDto // Ejemplo futuro: Añadir DTO para query params de paginación
    ): Promise<ChatHistoryMessageDto[]> { // Devuelve Promesa de array de mensajes
      const userId = req.user?.id; // Obtiene el ID del usuario
      // Llama al servicio para obtener los mensajes, pasando el ID de conversación y el ID de usuario para verificación
      return this.assistantService.getConversationMessages(conversationId, userId);
      // Futuro con paginación: return this.assistantService.getConversationMessages(conversationId, userId, paginationDto);
    }
  
     // --- Endpoint Opcional para borrar una conversación (DELETE /assistant/conversations/:id) ---
     @Delete('conversations/:id') // Define la ruta DELETE específica con parámetro de ID
     @HttpCode(HttpStatus.NO_CONTENT) // Establece el código HTTP 204 para éxito sin contenido
     @ApiOperation({ // Describe la operación en Swagger
         summary: 'Borrar una conversación',
         description: 'Elimina permanentemente una conversación específica y todos sus mensajes asociados. Solo el dueño de la conversación puede hacerlo.'
     })
     @ApiParam({ name: 'id', description: 'ID de la conversación a eliminar', type: Number, required: true }) // Documenta el parámetro
     // Documenta las posibles respuestas en Swagger
     @ApiResponse({ status: 204, description: 'Conversación eliminada exitosamente.' }) // Éxito sin contenido
     @ApiResponse({ status: 400, description: 'ID de conversación inválido.' })
     @ApiResponse({ status: 401, description: 'No autorizado.' })
     @ApiResponse({ status: 403, description: 'Acceso prohibido (no es tu conversación).' })
     @ApiResponse({ status: 404, description: 'Conversación no encontrada.' })
     @ApiResponse({ status: 500, description: 'Error al eliminar la conversación.' })
     async deleteConversation(
        @Param('id', ParseIntPipe) conversationId: number, // Extrae y valida el ID
        @Req() req, // Para obtener el usuario
     ): Promise<void> { // No devuelve cuerpo en la respuesta (Promise<void>)
        const userId = req.user?.id; // Obtiene el ID del usuario
        // Llama al servicio para realizar la operación de borrado, pasando IDs para verificación
        await this.assistantService.deleteConversation(conversationId, userId);
        // No se necesita 'return' explícito para Promise<void>
     }
  
  } // Fin de la clase AssistantController