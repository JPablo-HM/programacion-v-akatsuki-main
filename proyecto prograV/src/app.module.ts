/**
 * app.module.ts — Módulo raíz de la aplicación
 *
 * Es el módulo principal que NestJS carga primero. Aquí se registran:
 * - Todos los módulos de dominio (auth, pantallas, bitácora, etc.)
 * - Configuración global (variables de entorno, logger, rate limiting)
 * - Providers globales: filtros de excepción, interceptores y guards
 *   que aplican a TODOS los endpoints sin excepción
 */

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';

import appConfig  from './config/app.config';
import jwtConfig  from './config/jwt.config';
import { winstonConfig } from './config/winston.config';

import { PrismaModule }    from './prisma/prisma.module';
import { AuthModule }      from './auth/auth.module';
import { UsersModule }     from './users/users.module';
import { PantallasModule } from './pantallas/pantallas.module';
import { BitacoraModule }  from './bitacora/bitacora.module';

import { AllExceptionsFilter }  from './common/filters/all-exceptions.filter';
import { ResponseInterceptor }  from './common/interceptors/response.interceptor';
import { LoggingInterceptor }   from './common/interceptors/logging.interceptor';
import { LoggerMiddleware }     from './common/middleware/logger.middleware';

@Module({
  imports: [
    // ── ConfigModule ─────────────────────────────────────────
    // Carga el archivo .env y registra las configuraciones tipadas
    // isGlobal: true → no hace falta importarlo en cada módulo
    // load: carga las factories app.config.ts y jwt.config.ts
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig],
      envFilePath: '.env',
    }),

    // ── WinstonModule ─────────────────────────────────────────
    // Sistema de logging estructurado (reemplaza al Logger de NestJS)
    // En desarrollo: formato colorido en consola
    // En producción: formato JSON + archivos de log
    WinstonModule.forRoot(winstonConfig()),

    // ── ThrottlerModule (Rate Limiting) ───────────────────────
    // Limita la cantidad de requests por IP en una ventana de tiempo
    // Default: máx 10 requests por 60 segundos (configurable en .env)
    // ttl se multiplica por 1000 porque v5 usa milisegundos
    ThrottlerModule.forRoot([
      {
        ttl:   parseInt(process.env.THROTTLE_TTL   || '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
      },
    ]),

    // ── Módulos de dominio ────────────────────────────────────
    PrismaModule,    // Conexión a MySQL — exportado como @Global()
    AuthModule,      // SRV1: login, refresh token, validate
    UsersModule,     // Repositorio de usuarios (base para SRV10)
    PantallasModule, // SRV7: CRUD de pantallas
    BitacoraModule,  // SRV9: registro de auditoría
  ],

  providers: [
    // APP_FILTER aplica el filtro a TODOS los endpoints globalmente
    // Captura cualquier excepción (Http, Prisma, Error nativo) y
    // la convierte en una respuesta JSON estandarizada
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // APP_INTERCEPTOR: LoggingInterceptor se registra primero,
    // por lo que es el interceptor más externo en la cadena.
    // Registra método, URL, status y tiempo de cada request.
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // ResponseInterceptor se ejecuta después del controller.
    // Envuelve la respuesta en { success, data, timestamp }
    // excepto en endpoints marcados con @RawResponse()
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },

    // ThrottlerGuard aplica el rate limiting globalmente.
    // Si se supera el límite devuelve 429 Too Many Requests.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * configure — Aplica middlewares a las rutas
   * LoggerMiddleware registra IP, método y user-agent de cada request
   * antes de que llegue al guard o al controller
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
