// src/assistant/dto/chat-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ChatResponseDto {
  @ApiProperty({
    description: 'La respuesta generada por el asistente virtual.',
    example: 'Para crear un nuevo ticket, ve a la sección "Tickets" y haz clic en "Nuevo Ticket".',
  })
  reply: string;

  @ApiProperty({
    description: 'ID de la conversación a la que pertenece la respuesta (sea existente o recién creada).',
    example: 15,
  })
  conversationId: number; // Siempre devolvemos el ID de la conversación afectada
}