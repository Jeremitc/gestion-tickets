// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigService
import { JwtStrategy } from './jwt.strategy'; // Crearemos esto

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({ // Configuración asíncrona para usar ConfigService
      imports: [ConfigModule], // Asegúrate de que ConfigModule esté disponible
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION_TIME') },
      }),
    }),
    ConfigModule, // Importa ConfigModule si no es global o para asegurar disponibilidad
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy, // Añade el proveedor de estrategia
  ],
  exports: [AuthService, JwtModule], // Exporta JwtModule si otros módulos lo necesitan
})
export class AuthModule {}