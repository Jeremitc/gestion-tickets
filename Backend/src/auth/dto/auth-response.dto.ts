// src/auth/dto/auth-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../../users/dto/user-profile.dto'; // Importa el DTO del perfil

export class AuthResponseDto {
    @ApiProperty({
        description: 'Token de acceso JWT para autenticación.',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImplcmVtaSIsInN1YiI6MSwiaWF0IjoxNjE2NTQ0MjA0LCJleHAiOjE2MTY1NDc4MDR9.ej4a_fakesignature_dQw4w9WgXcQ'
    })
    access_token: string;

    @ApiProperty({
        description: 'Mensaje indicando el resultado del login.',
        example: 'Inicio de sesión exitoso'
    })
    message: string;

    @ApiProperty({
        description: 'Datos del perfil del usuario autenticado.',
        type: () => UserProfileDto // Referencia al DTO de perfil para Swagger
    })
    user: UserProfileDto; // Usa el DTO específico para el perfil
}