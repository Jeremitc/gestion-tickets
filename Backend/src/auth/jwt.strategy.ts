// src/auth/jwt.strategy.ts

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Role, VALID_ROLES } from '../common/constants';
import { UserProfileDto } from '../users/dto/user-profile.dto';

// --- Definir la estructura esperada del Payload del JWT ---
interface JwtPayload {
  sub: number;
  username: string;
  role: Role;
  // iat?: number; // Issued at (automático)
  // exp?: number; // Expiration time (automático)
}
// ---------------------------------------------------------

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
    this.logger.log('JwtStrategy inicializada.');
  }

  /**
   * Método que Passport llama después de verificar la firma del JWT y decodificarlo.
   * El objeto 'payload' contiene lo que pusimos al firmar el token en AuthService.
   * El objetivo es devolver el objeto 'user' que se adjuntará a `req.user`.
   */
  async validate(payload: JwtPayload): Promise<UserProfileDto> {
    this.logger.log(`Validating JWT payload for user ID: ${payload.sub}, Role from payload: ${payload.role}`);

    // Aunque podríamos confiar en el payload, es MÁS SEGURO buscar el usuario
    // en la BD para obtener sus datos más recientes (incluyendo rol y si está activo).
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    // Verificar si el usuario existe, está activo y tiene un rol válido
    if (!user || !user.isActive || !VALID_ROLES.includes(user.role as Role)) {
      this.logger.warn(`JWT validation failed: User ${payload.sub} not found, inactive, or invalid role.`);
      throw new UnauthorizedException('Usuario no encontrado, inactivo o token inválido.');
    }

    // Comprobar si el rol en el token coincide con el de la BD (seguridad extra opcional)
    // if (user.role !== payload.role) {
    //   this.logger.error(`Role mismatch for user ${user.id}! JWT role: ${payload.role}, DB role: ${user.role}.`);
    //   throw new UnauthorizedException('Inconsistencia de rol detectada.');
    // }

    // Preparar el objeto que se adjuntará a req.user
    // Debe coincidir con UserProfileDto (excluyendo el hash)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userData } = user;

    // Mapear explícitamente a UserProfileDto
    const userProfile: UserProfileDto = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      role: userData.role as Role,
      isActive: userData.isActive,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
    };

    this.logger.log(`JWT validation successful for user ID: ${user.id}. Attaching user data to request.`);
    return userProfile;
  }
}