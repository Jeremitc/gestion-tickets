import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsInt, IsPositive } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({
    description: 'Asunto breve y descriptivo del ticket.',
    example: 'Problema al iniciar sesión después de actualizar contraseña',
    minLength: 5,
    maxLength: 150,
  })
  @IsString({ message: 'El título debe ser texto.' })
  @IsNotEmpty({ message: 'El título no puede estar vacío.' })
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres.' })
  @MaxLength(150, { message: 'El título no puede exceder los 150 caracteres.' })
  title: string;

  @ApiProperty({
    description: 'Descripción detallada del problema o solicitud.',
    example: 'Después de cambiar mi contraseña ayer, ya no puedo acceder a mi cuenta. Me aparece el error "Credenciales inválidas". He probado a reiniciar la contraseña de nuevo pero sigue igual.',
    minLength: 10,
  })
  @IsString({ message: 'La descripción debe ser texto.' })
  @IsNotEmpty({ message: 'La descripción no puede estar vacía.' })
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres.' })
  description: string;

  @ApiProperty({
    description: 'ID de la categoría a la que pertenece el ticket.',
    example: 1,
    type: Number,
  })
  @IsInt({ message: 'El ID de categoría debe ser un número entero.' })
  @IsPositive({ message: 'El ID de categoría debe ser un número positivo.' })
  categoryId: number;

  @ApiProperty({
    description: 'ID del tipo de ticket.',
    example: 1, // Ejemplo: "Incidente"
    type: Number,
  })
  @IsInt({ message: 'El ID del tipo de ticket debe ser un número entero.' })
  @IsPositive({ message: 'El ID del tipo de ticket debe ser un número positivo.' })
  typeId: number;
}