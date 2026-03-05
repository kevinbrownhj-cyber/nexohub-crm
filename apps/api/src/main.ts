import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { validateEnv } from './config/env.validation';

async function bootstrap() {
  // Validar variables de entorno antes de iniciar la aplicación
  validateEnv();
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 3600,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('NexoHub CRM API')
    .setDescription('API para gestión de casos, asignaciones, recargos y facturación')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Montar Swagger usando CDN para assets (evita bug con globalPrefix)
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'NexoHub CRM API',
    customCss: '.swagger-ui .topbar { display: none }',
    customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
    ],
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Aplicar globalPrefix SOLO a las rutas de la API, excluyendo docs
  app.setGlobalPrefix('api', {
    exclude: ['docs', 'docs/(.*)'],
  });

  const port = process.env.PORT || 3000;
  const logger = new Logger('Bootstrap');
  
  await app.listen(port);

  logger.log(`🚀 API running on: http://localhost:${port}/api`);
  logger.log(`📚 API Docs: http://localhost:${port}/docs`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Shutdown graceful para cerrar conexiones correctamente
  const shutdown = async (signal: string) => {
    logger.warn(`${signal} received, closing gracefully...`);
    try {
      await app.close();
      logger.log('✅ Application closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
