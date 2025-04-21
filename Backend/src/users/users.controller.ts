// src/users/users.controller.ts

import { Controller, Patch, Body, UseGuards, Req, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UserProfileDto } from './dto/user-profile.dto'; // Importa el DTO de respuesta

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('me') // PATCH /users/me
  @ApiOperation({ summary: 'Actualizar mi perfil', description: 'Actualiza username, email o contraseña del usuario autenticado.' })
  @ApiBearerAuth('access-token') // Requiere JWT
  @ApiBody({ type: UpdateProfileDto }) // Describe el cuerpo
  @ApiResponse({ status: 200, description: 'Perfil actualizado.', type: UserProfileDto }) // Respuesta OK
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 401, description: 'No autorizado / Contraseña actual incorrecta.' })
  @ApiResponse({ status: 409, description: 'Conflicto (username/email ya existe).' })
  async updateMyProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto): Promise<UserProfileDto> {
    const userId = req.user.id;
    console.log(`Updating profile for user ID: ${userId}`);
    // El servicio ya devuelve los datos con el formato UserProfileDto (sin hash)
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  // Si decides mover GET /profile aquí, documéntalo de forma similar a como está en AuthController
}