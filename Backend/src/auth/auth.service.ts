// src/auth/auth.service.ts

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import { User } from '@prisma/client';
import { Role, VALID_ROLES } from '../common/constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { emailOrUsername, password } = loginDto;
    this.logger.log(`Login attempt for: ${emailOrUsername}`);

    // 1. Buscar usuario por email o username
    const user = await this.prisma.user.findFirst({
      where: {
        isActive: true,
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername },
        ],
      },
    });

    // 2. Si no se encuentra, está inactivo o tiene un rol inválido, lanzar error 401
    if (!user || !VALID_ROLES.includes(user.role as Role)) {
      this.logger.warn(`Login failed: User not found, inactive, or invalid role for ${emailOrUsername}`);
      throw new UnauthorizedException('Credenciales inválidas o usuario inactivo.');
    }

    // 3. Comparar contraseña
    const isPasswordMatching = await bcrypt.compare(password, user.password_hash);

    // 4. Si no coinciden, lanzar error 401
    if (!isPasswordMatching) {
      this.logger.warn(`Login failed: Invalid password for ${emailOrUsername} (UserID: ${user.id})`);
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // 5. Preparar el payload para el token JWT
    //    *** OPCIONAL PERO RECOMENDADO: Incluir el rol en el payload ***
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role as Role,
    };
    const accessToken = this.jwtService.sign(payload);
    this.logger.log(`JWT generated for user ${user.id} with role ${user.role}`);

    // 6. Preparar los datos del usuario para la respuesta
    //    Asegurarse de que todos los campos de UserProfileDto estén aquí (excepto password_hash)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userDataForProfile } = user;

    // Verificar explícitamente que userDataForProfile cumple con UserProfileDto
    const userProfile: UserProfileDto = {
      id: userDataForProfile.id,
      username: userDataForProfile.username,
      email: userDataForProfile.email,
      role: userDataForProfile.role as Role,
      isActive: userDataForProfile.isActive,
      created_at: userDataForProfile.created_at,
      updated_at: userDataForProfile.updated_at,
    };

    // 7. Devolver la respuesta completa
    this.logger.log(`Login successful for UserID: ${user.id}`);
    return {
      access_token: accessToken,
      message: 'Inicio de sesión exitoso',
      user: userProfile,
    };
  }

  // --- Registro (Placeholder - Sin cambios) ---
  // async register(...) { /* ... */ }
}