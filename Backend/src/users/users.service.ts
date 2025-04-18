// src/users/users.service.ts
import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    // 1. Encuentra al usuario actual
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Esto no debería pasar si el token es válido, pero por seguridad
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Objeto para almacenar los datos a actualizar
    const dataToUpdate: { username?: string; email?: string; password_hash?: string } = {};

    // 2. Manejar cambio de contraseña (si se proporcionó una nueva)
    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Se requiere la contraseña actual para establecer una nueva.');
      }
      // Compara la contraseña actual proporcionada con la almacenada
      const isCurrentPasswordMatching = await bcrypt.compare(
        dto.currentPassword,
        user.password_hash,
      );

      if (!isCurrentPasswordMatching) {
        throw new UnauthorizedException('La contraseña actual es incorrecta.');
      }

      // Hashea la nueva contraseña
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(dto.newPassword, saltRounds);
      dataToUpdate.password_hash = newPasswordHash;
    }

    // 3. Manejar cambio de username (si se proporcionó y es diferente)
    if (dto.username && dto.username !== user.username) {
       // Opcional: Verificar si el nuevo username ya existe
       const existingUserByUsername = await this.prisma.user.findUnique({ where: { username: dto.username } });
       if (existingUserByUsername && existingUserByUsername.id !== userId) {
           throw new ConflictException('El nombre de usuario ya está en uso.');
       }
       dataToUpdate.username = dto.username;
    }

    // 4. Manejar cambio de email (si se proporcionó y es diferente)
    if (dto.email && dto.email !== user.email) {
       // Opcional: Verificar si el nuevo email ya existe
       const existingUserByEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
       if (existingUserByEmail && existingUserByEmail.id !== userId) {
           throw new ConflictException('El correo electrónico ya está en uso.');
       }
       // ADVERTENCIA: Implementar verificación de email en una app real
       console.warn(`Actualizando email para usuario ${userId} sin verificación.`);
       dataToUpdate.email = dto.email;
    }

    // 5. Realizar la actualización si hay datos para cambiar
    if (Object.keys(dataToUpdate).length === 0) {
        // Si no se cambió nada relevante (quizás solo se envió currentPassword sin newPassword)
        // devolvemos el usuario actual sin hacer update. O podrías lanzar un error si prefieres.
         // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password_hash, ...userData } = user;
        return userData;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    // 6. Devolver el usuario actualizado (sin el hash)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userData } = updatedUser;
    return userData;
  }
}