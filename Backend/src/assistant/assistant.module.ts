// src/assistant/assistant.module.ts
import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { ConfigModule } from '@nestjs/config'; // Importamos ConfigModule porque AssistantService lo necesita

@Module({
  imports: [
    ConfigModule, // Asegura que ConfigService esté disponible para inyección en AssistantService
    // No necesitamos importar AuthModule aquí porque JwtAuthGuard funciona globalmente si AuthModule está en AppModule
  ],
  controllers: [AssistantController],
  providers: [AssistantService],
  // No necesitamos exportar nada por ahora, a menos que otro módulo necesite AssistantService
})
export class AssistantModule {}