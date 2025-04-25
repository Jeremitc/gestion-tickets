// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/constants';
import { Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Obtener lista de todos los usuarios (solo para admin)
   * @param user - El usuario autenticado (debe ser admin)
   * @returns Lista de UserProfileDto
   */
  async findAll(user: UserProfileDto): Promise<UserProfileDto[]> {
    if (user.role !== 'admin') {
      this.logger.warn(`User ${user.id} (Role: ${user.role}) attempted to access user list.`);
      throw new ForbiddenException('Solo los administradores pueden acceder a la lista de usuarios.');
    }

    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          created_at: true,
          updated_at: true,
        },
      });

      this.logger.log(`User ${user.id} fetched ${users.length} users.`);
      return users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as Role,
        isActive: user.isActive,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch users: ${error.message}`, error.stack);
      throw new InternalServerErrorException('No se pudieron obtener los usuarios.');
    }
  }

  /**
   * Actualizar el perfil de un usuario
   * @param userId - ID del usuario a actualizar
   * @param dto - Datos para actualizar (username, email, contraseña)
   * @returns UserProfileDto con los datos actualizados
   */
  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<UserProfileDto> {
    // 1. Encuentra al usuario actual
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found.`);
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Objeto para almacenar los datos a actualizar
    const dataToUpdate: { username?: string; email?: string; password_hash?: string } = {};

    // 2. Manejar cambio de contraseña (si se proporcionó una nueva)
    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Se requiere la contraseña actual para establecer una nueva.');
      }
      const isCurrentPasswordMatching = await bcrypt.compare(
        dto.currentPassword,
        user.password_hash,
      );

      if (!isCurrentPasswordMatching) {
        throw new UnauthorizedException('La contraseña actual es incorrecta.');
      }

      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(dto.newPassword, saltRounds);
      dataToUpdate.password_hash = newPasswordHash;
    }

    // 3. Manejar cambio de username (si se proporcionó y es diferente)
    if (dto.username && dto.username !== user.username) {
      const existingUserByUsername = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (existingUserByUsername && existingUserByUsername.id !== userId) {
        throw new ConflictException('El nombre de usuario ya está en uso.');
      }
      dataToUpdate.username = dto.username;
    }

    // 4. Manejar cambio de email (si se proporcionó y es diferente)
    if (dto.email && dto.email !== user.email) {
      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingUserByEmail && existingUserByEmail.id !== userId) {
        throw new ConflictException('El correo electrónico ya está en uso.');
      }
      this.logger.warn(`Actualizando email para usuario ${userId} sin verificación.`);
      dataToUpdate.email = dto.email;
    }

    // 5. Realizar la actualización si hay datos para cambiar
    if (Object.keys(dataToUpdate).length === 0) {
      const { password_hash, ...userData } = user;
      const userProfile: UserProfileDto = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role as Role,
        isActive: userData.isActive,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      };
      return userProfile;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    // 6. Devolver el usuario actualizado (sin el hash)
    const { password_hash, ...userData } = updatedUser;
    const userProfile: UserProfileDto = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      role: userData.role as Role,
      isActive: userData.isActive,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
    };
    return userProfile;
  }
}