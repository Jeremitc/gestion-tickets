// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Import PrismaService
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt'; // Import bcrypt
import { JwtService } from '@nestjs/jwt'; // Import JwtService
import { AuthResponseDto } from './dto/auth-response.dto'; // <-- Importa el DTO de respuesta
import { UserProfileDto } from '../users/dto/user-profile.dto'; // <-- Importa el DTO de perfil

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
) {} // Inject PrismaService y JwtService

  // --- Función de Login Actualizada ---
  async login(loginDto: LoginDto): Promise<AuthResponseDto> { // Usa el DTO de respuesta como tipo de retorno
    const { emailOrUsername, password } = loginDto;

    // 1. Buscar usuario por email o username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername },
        ],
      },
    });

    // 2. Si no se encuentra, lanzar error 401
    if (!user) {
       throw new UnauthorizedException('Credenciales inválidas.');
    }

    // 3. Comparar contraseña ingresada con el hash almacenado
    const isPasswordMatching = await bcrypt.compare(password, user.password_hash);

    // 4. Si no coinciden, lanzar error 401
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // 5. Preparar el payload para el token JWT
    const payload = { username: user.username, sub: user.id }; // sub: user.id es estándar
    const accessToken = this.jwtService.sign(payload); // Firmar el token

    // 6. Preparar los datos del usuario para la respuesta (excluyendo el hash)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userData } = user;

    // 7. Devolver la respuesta con la estructura definida en AuthResponseDto
    return {
      access_token: accessToken,
      message: 'Inicio de sesión exitoso',
      // Asegúrate de que userData coincide con UserProfileDto
      // Puedes usar 'as' si estás seguro, o mapear explícitamente si es necesario
      user: userData as UserProfileDto
    };
  }

  // --- Placeholder for Registration Endpoint (Mantenido del original) ---
  // async register(registerDto: RegisterDto) { // Necesitarías crear RegisterDto
  //   const { email, username, password } = registerDto;
  //   // Lógica futura:
  //   // 1. Verificar si el email o username ya existen (lanzar ConflictException 409 si sí)
  //   // 2. Hashear la contraseña: const hashedPassword = await bcrypt.hash(password, 10);
  //   // 3. Crear el usuario en la BD usando Prisma:
  //   //    const newUser = await this.prisma.user.create({ data: { email, username, password_hash: hashedPassword } });
  //   // 4. Opcional: Generar un token JWT y devolverlo como en login, o solo devolver el perfil del usuario creado.
  //   //    const { password_hash, ...userData } = newUser;
  //   //    return userData; // O devolver AuthResponseDto
  // }
  // --------------------------------------------------------------------
}