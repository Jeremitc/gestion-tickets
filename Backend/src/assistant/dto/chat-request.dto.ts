// src/assistant/dto/chat-request.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Define los contextos válidos que esperas del frontend
const validContexts = ['general', 'tickets', 'knowledgebase'] as const;
type ContextType = typeof validContexts[number];

export class ChatRequestDto {
  @ApiProperty({
    description: 'La consulta o mensaje del usuario para el asistente.',
    example: '¿Cómo puedo crear un nuevo ticket de soporte?',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'El prompt no puede estar vacío.' })
  prompt: string;

  @ApiPropertyOptional({ // Cambiado a Optional porque ahora es realmente opcional
    description: 'El contexto de la conversación para guiar al asistente.',
    example: 'tickets',
    required: false,
    enum: validContexts,
    default: 'general',
  })
  @IsOptional()
  @IsString()
  @IsIn(validContexts, { message: 'Contexto inválido.' })
  context?: ContextType = 'general';

  @ApiPropertyOptional({
    description: 'ID de la conversación existente a la que añadir el mensaje. Si se omite o es null/undefined, se creará una nueva conversación.',
    example: 15,
    type: Number,
    nullable: true, // Indica que puede ser null
  })
  @IsOptional() // Es opcional enviarlo
  @IsInt({ message: 'El ID de conversación debe ser un número entero.' })
  @Min(1, { message: 'El ID de conversación debe ser un número positivo.' }) // Si se envía, debe ser > 0
  conversationId?: number | null; // Permite null o undefined para crear una nueva
}