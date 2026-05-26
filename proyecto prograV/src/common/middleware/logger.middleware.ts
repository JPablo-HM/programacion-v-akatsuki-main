/**
 * logger.middleware.ts — Middleware de logging de requests entrantes
 *
 * Se ejecuta ANTES que los guards e interceptores, siendo lo primero
 * que toca cada request. Registra la IP, método, URL y user-agent.
 *
 * Diferencia con LoggingInterceptor:
 *   - Middleware: registra la llegada del request (quién llama y desde dónde)
 *   - LoggingInterceptor: registra el tiempo de respuesta y el status HTTP
 * Ambos se complementan para tener trazabilidad completa.
 *
 * Configurado en AppModule.configure() para aplicar a todas las rutas ('*').
 *
 * Ejemplo de log:
 *   [::1] GET /api/v1/auth/login — Mozilla/5.0 (Windows NT 10.0; Win64; x64)
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  // Contexto 'Request' para identificar estos logs fácilmente en consola
  private readonly logger = new Logger('Request');

  use(req: Request, _res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;

    // User-agent identifica el cliente: navegador, Insomnia, curl, etc.
    const userAgent = req.get('user-agent') || '';

    this.logger.log(`[${ip}] ${method} ${originalUrl} — ${userAgent}`);

    // Llama a next() para continuar con el siguiente middleware o handler
    // Sin next(), el request quedaría colgado sin respuesta
    next();
  }
}
