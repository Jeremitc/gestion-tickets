// src/users/dto/update-profile.dto.ts
import { IsString, IsEmail, MinLength, IsOptional, ValidateIf, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger'; // Usar Optional

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Nuevo nombre de usuario (opcional, mín. 3 caracteres)', example: 'jeremi_updated' })
  @IsOptional() @IsString() @MinLength(3)
  username?: string;

  @ApiPropertyOptional({ description: 'Nuevo correo electrónico (opcional)', example: 'nuevo@example.com' })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Contraseña actual (requerida SÓLO si se cambia la contraseña)', example: 'contraseñaActual123' })
  @ValidateIf(o => !!o.newPassword)
  @IsNotEmpty({ message: 'La contraseña actual es requerida para cambiarla.' })
  @IsString()
  currentPassword?: string;

  @ApiPropertyOptional({ description: 'Nueva contraseña (opcional, mín. 8 caracteres)', example: 'NuevaPassSuperSegura789' })
  @IsOptional() @IsString() @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres.' })
  newPassword?: string;
}