/**
 * main.ts — Punto de entrada de la aplicación
 *
 * Este archivo arranca el servidor NestJS. Configura todo lo que
 * debe estar listo ANTES de que llegue el primer request:
 * seguridad, validaciones, prefijo global, Swagger y CORS.
 */

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  // Crea la aplicación NestJS usando el módulo raíz AppModule
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // ── Seguridad HTTP ─────────────────────────────────────────
  // Helmet agrega cabeceras de seguridad automáticamente:
  // X-Frame-Options, Content-Security-Policy, X-XSS-Protection, etc.
  app.use(helmet());

  // Obtiene el servicio de configuración para leer el .env
  const configService = app.get(ConfigService);

  // Habilita CORS — controla qué orígenes pueden llamar a la API
  // Los orígenes se leen del .env (CORS_ORIGINS), separados por coma
  app.enableCors({
    origin:         configService.get<string>('app.corsOrigins', '*').split(','),
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials:    true, // permite enviar cookies/headers de auth
  });

  // ── Prefijo global de rutas ────────────────────────────────
  // Todos los endpoints quedan bajo /api/v1/...
  // Ej: /api/v1/auth/login, /api/v1/pantallas
  app.setGlobalPrefix('api/v1');

  // ── Validación global de DTOs ──────────────────────────────
  // ValidationPipe revisa automáticamente el body de cada request
  // usando los decoradores de class-validator en los DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // elimina campos que no están en el DTO
      forbidNonWhitelisted: true, // lanza error si llegan campos extra
      transform: true,            // convierte strings a sus tipos reales (number, boolean, etc.)
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,    // reporta TODOS los errores juntos, no solo el primero
    }),
  );

  // ── Documentación Swagger / OpenAPI ───────────────────────
  // Genera automáticamente la documentación de todos los endpoints
  // a partir de los decoradores @ApiTags, @ApiOperation, etc.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Carnet Digital CUC — API')
    .setDescription(
      'Microservicio de autenticación y gestión del Carnet Digital CUC.\n\n' +
      '**SRV1** — Login, Refresh Token, Validate Token\n' +
      '**SRV7** — Pantallas (preparado)\n' +
      '**SRV9** — Bitácora (preparado)',
    )
    .setVersion('1.0.0')
    .setContact('CUC Dev Team', '', 'dev@cuc.edu.co')
    // Configura el esquema de autenticación Bearer JWT en Swagger
    // El nombre 'JWT-auth' se usa en @ApiBearerAuth('JWT-auth') de los controllers
    .addBearerAuth(
      {
        type:         'http',
        scheme:       'bearer',
        bearerFormat: 'JWT',
        name:         'JWT',
        description:  'Ingresa el token JWT obtenido desde /auth/login',
        in:           'header',
      },
      'JWT-auth',
    )
    .addTag('auth',      'SRV1 — Autenticación y gestión de tokens JWT')
    .addTag('pantallas', 'SRV7 — Gestión de pantallas del sistema (preparado)')
    .addTag('bitacora',  'SRV9 — Registro de auditoría (preparado)')
    .build();

  // Genera el documento OpenAPI y lo expone en /api/docs
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // el token no se borra al recargar Swagger
      tagsSorter:           'alpha',
      operationsSorter:     'alpha',
    },
  });

  // ── Iniciar servidor ───────────────────────────────────────
  // Lee el puerto desde app.config.ts → variable PORT del .env
  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);

  logger.log(`🚀  API corriendo en:      http://localhost:${port}/api/v1`);
  logger.log(`📚  Swagger disponible en: http://localhost:${port}/api/docs`);
  logger.log(`🌍  Entorno:               ${configService.get('app.nodeEnv')}`);
}

bootstrap();
