// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
// PrismaModule es global, no necesita importarse aquí
// AuthModule podría necesitarse si necesitas inyectar algo de él, pero JwtAuthGuard funciona globalmente si AuthModule está importado en AppModule

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService] // Exporta el servicio si otros módulos lo necesitan
})
export class UsersModule {}