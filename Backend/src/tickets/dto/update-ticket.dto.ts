import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsInt, IsPositive, IsOptional, IsDate, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTicketDto {
  @ApiPropertyOptional({ description: 'Nuevo asunto del ticket.', minLength: 5, maxLength: 150 })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ description: 'Nueva descripción detallada.', minLength: 10 })
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional({ description: 'ID del nuevo estado del ticket.', example: 2, type: Number })
  @IsOptional()
  @IsInt({ message: 'El ID de estado debe ser un número entero.' })
  @IsPositive({ message: 'El ID de estado debe ser positivo.' })
  statusId?: number;

  @ApiPropertyOptional({ description: 'ID de la nueva prioridad del ticket.', example: 3, type: Number })
  @IsOptional()
  @IsInt({ message: 'El ID de prioridad debe ser un número entero.' })
  @IsPositive({ message: 'El ID de prioridad debe ser positivo.' })
  priorityId?: number;

  @ApiPropertyOptional({ description: 'ID de la nueva categoría del ticket.', example: 1, type: Number })
  @IsOptional()
  @IsInt({ message: 'El ID de categoría debe ser un número entero.' })
  @IsPositive({ message: 'El ID de categoría debe ser positivo.' })
  categoryId?: number;

  @ApiPropertyOptional({ description: 'ID del nuevo tipo de ticket.', example: 1, type: Number })
  @IsOptional()
  @IsInt({ message: 'El ID del tipo de ticket debe ser un número entero.' })
  @IsPositive({ message: 'El ID del tipo de ticket debe ser positivo.' })
  typeId?: number;

  @ApiPropertyOptional({ description: 'ID del nuevo usuario asignado (o null para desasignar).', example: 5, type: Number, nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.assignedToId !== null)
  @IsInt({ message: 'El ID del asignado debe ser un número entero.' })
  @IsPositive({ message: 'El ID del asignado debe ser positivo.' })
  assignedToId?: number | null;

  @ApiPropertyOptional({ description: 'Fecha de cierre del ticket (formato ISO string o Date). Enviar null para reabrir.', example: '2024-01-20T15:00:00.000Z', type: Date, nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La fecha de cierre debe ser una fecha válida.' })
  closedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Fecha de creación del ticket (formato ISO string).', example: '2024-01-20T15:00:00.000Z', type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La fecha de creación debe ser una fecha válida.' })
  createdAt?: Date;

  @ApiPropertyOptional({ description: 'Mensaje de Resolucion del ticket', nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'El mensaje de Resolucion debe tener al menos 10 caracteres.' })
  resolutionMessage?:  string | null;
}