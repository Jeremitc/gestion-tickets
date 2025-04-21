// src/users/dto/user-profile.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { Role, VALID_ROLES } from '../../common/constants';

// DTO para representar el perfil de un usuario, usado en respuestas de autenticación y actualización de perfil
export class UserProfileDto {
  @ApiProperty({ description: 'ID único del usuario', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nombre de usuario', example: 'jeremi', required: false, nullable: true })
  username?: string | null;

  @ApiProperty({ description: 'Correo electrónico del usuario', example: 'jeremi.genial1@gmail.com' })
  email: string;

  @ApiProperty({
    description: 'Rol del usuario en el sistema (client, support, admin)',
    example: 'client',
    enum: VALID_ROLES,
  })
  role: Role;

  @ApiProperty({ description: 'Indica si el usuario está activo', example: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha de creación de la cuenta (formato ISO)',
    example: '2023-10-27T10:00:00.000Z',
    required: false,
    nullable: true,
  })
  created_at?: Date | null;

  @ApiProperty({
    description: 'Fecha de la última actualización (formato ISO)',
    example: '2023-10-27T12:30:00.000Z',
    required: false,
    nullable: true,
  })
  updated_at?: Date | null;
}