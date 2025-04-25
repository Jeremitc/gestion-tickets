// src/tickets/dto/comment.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketUserDto } from './ticket-lookup.dto';
// --- IMPORTACIONES AÑADIDAS ---
import { IsString, IsNotEmpty, MinLength, IsOptional, IsBoolean } from 'class-validator';
// ----------------------------

export class CommentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  content: string;

  @ApiProperty()
  created_at: Date; // Manteniendo snake_case de tu schema Comment

  // @ApiProperty() // Descomentar si necesitas exponer updatedAt
  // updatedAt: Date;

  // @ApiProperty({ description: 'Indica si el comentario es solo para personal interno.'})
  // isInternal: boolean; // Descomentar si tienes este campo y lo necesitas

  @ApiProperty({ type: () => TicketUserDto }) // Anidar DTO de usuario
  user: TicketUserDto; // Usar user como en tu schema Comment
}

export class CreateCommentDto {
  @ApiProperty({ description: 'Contenido del comentario.', example: 'He probado la solución y ahora funciona. ¡Gracias!'})
  // --- Decoradores añadidos ---
  @IsString({message: 'El comentario debe ser texto.'})
  @IsNotEmpty({message: 'El comentario no puede estar vacío.'})
  @MinLength(1, {message: 'El comentario debe tener al menos 1 caracter.'})
  // --------------------------
  content: string;

  // @ApiPropertyOptional({ description: 'Marcar como comentario interno (solo agentes/support/admin).', default: false })
  // @IsOptional()
  // @IsBoolean()
  // isInternal?: boolean = false; // Descomentar si tienes este campo en el schema Comment
}