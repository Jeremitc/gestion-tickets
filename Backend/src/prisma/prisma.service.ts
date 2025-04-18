// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Connect to the database when the module is initialized
    await this.$connect();
    console.log('Prisma connected to the database.');
  }

  async onModuleDestroy() {
    // Disconnect from the database when the application shuts down
    await this.$disconnect();
    console.log('Prisma disconnected from the database.');
  }

  // Optional: Add a method for clean database shutdown during e2e tests
  // async enableShutdownHooks(app: INestApplication) {
  //   this.$on('beforeExit', async () => {
  //     await app.close();
  //   });
  // }
}