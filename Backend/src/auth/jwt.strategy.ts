// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // --- CAMBIO AQUÍ ---
      // Usa getOrThrow para asegurar que el valor existe o falla la carga
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      // -----------------
    });
  }

  // ... el método validate sigue igual ...
  async validate(payload: { sub: number; username: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado o token inválido.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userData } = user;
    return userData;
  }
}