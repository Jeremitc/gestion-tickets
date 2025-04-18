// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Asegúrate que ConfigModule esté importado
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module'; // <-- Importa UsersModule

@Module({
  imports: [
    ConfigModule.forRoot({ // <-- Asegúrate que esté configurado
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule, // <-- Añade UsersModule aquí
  ],
  controllers: [AppController], // UserController está dentro de UsersModule
  providers: [AppService],
})
export class AppModule {}