// src/tickets/tickets.module.ts
import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
// PrismaModule es global, no necesita importarse aquí directamente
// AuthModule tampoco es necesario importar si JwtAuthGuard funciona global

@Module({
  controllers: [TicketsController], // Registra el controlador
  providers: [TicketsService],    // Registra el servicio
  // No necesita exports a menos que otro módulo use TicketsService
})
export class TicketsModule {}