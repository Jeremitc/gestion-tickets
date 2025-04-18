// src/auth/dto/login.dto.ts
import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Importar

export class LoginDto {
  @ApiProperty({ // Añadir documentación para Swagger
      description: 'Correo electrónico o nombre de usuario del usuario.',
      example: 'jeremi'
  })
  @IsString()
  @IsNotEmpty({ message: 'El correo electrónico o usuario no puede estar vacío.' })
  emailOrUsername: string;

  @ApiProperty({ // Añadir documentación
      description: 'Contraseña del usuario (mínimo 6 caracteres).',
      example: 'contraseña123',
      minLength: 6
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;
}