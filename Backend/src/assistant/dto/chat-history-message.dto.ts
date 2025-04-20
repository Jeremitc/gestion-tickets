// src/assistant/dto/chat-history-message.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ChatMessage } from '@prisma/client'; // Importa el tipo base

// Este DTO representa la estructura de un único mensaje cuando se devuelve como parte del historial
export class ChatHistoryMessageDto implements Pick<ChatMessage, 'role' | 'content' | 'timestamp'> {
    @ApiProperty({
        description: "Indica quién envió el mensaje ('user' o 'assistant').",
        example: 'assistant',
        enum: ['user', 'assistant'],
    })
    role: string;

    @ApiProperty({
        description: 'El contenido del mensaje.',
        example: '¡Hola! ¿En qué puedo ayudarte hoy?',
    })
    content: string;

    @ApiProperty({
        description: 'La fecha y hora en que se creó el mensaje (formato ISO).',
        example: '2023-11-15T10:30:00.000Z',
        type: Date,
    })
    timestamp: Date; // Prisma devuelve Date, y se serializa a ISO string en JSON
}