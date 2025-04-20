// src/assistant/dto/conversation-summary.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ConversationSummaryDto {
  @ApiProperty({
    description: 'ID único de la conversación.',
    example: 15
  })
  id: number;

  @ApiProperty({
    description: 'Título de la conversación (puede ser generado a partir del primer mensaje).',
    example: 'Cómo crear un ticket',
    nullable: true
  })
  title: string | null;

  @ApiProperty({
    description: 'Fecha y hora de creación de la conversación (formato ISO).',
    example: '2023-11-17T10:00:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización (último mensaje) de la conversación (formato ISO).',
    example: '2023-11-17T10:35:00.000Z',
    type: Date,
  })
  updatedAt: Date;
}