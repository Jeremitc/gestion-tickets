// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Asegúrate de importar ValidationPipe
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // Importaciones Swagger

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableShutdownHooks(); // Habilita cierre gradual

  // Habilitar CORS (Ajusta origin si es necesario)
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Habilitar ValidationPipe globalmente (Crucial para DTOs)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // --- Configuración de Swagger ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API de SoporteSys')
    .setDescription('Documentación API para el sistema de gestión de tickets.')
    .setVersion('1.0')
    .addTag('Auth', 'Autenticación y Perfil')
    .addTag('Users', 'Operaciones de Usuario')
    .addTag('Assistant', 'Asistente Virtual')
    .addTag('Tickets', 'Gestion de Tickets')
    .addBearerAuth( // Configura seguridad JWT
      {
        description: `Por favor, introduce el token JWT aquí precedido por 'Bearer '`,
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'bearer',
        type: 'http',
        in: 'Header'
      },
      'access-token', // Nombre lógico para esta seguridad
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api-docs', app, document, { // Ruta para la UI: /api-docs
    swaggerOptions: {
        persistAuthorization: true, // Recuerda el token entre recargas
    },
    customSiteTitle: 'SoporteSys API Docs',
  });
  // ----------------------------

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);
  console.log(`🚀 Aplicación corriendo en: ${await app.getUrl()}`);
  console.log(`📚 Documentación API disponible en: ${await app.getUrl()}/api-docs`); // Log útil
}
bootstrap();