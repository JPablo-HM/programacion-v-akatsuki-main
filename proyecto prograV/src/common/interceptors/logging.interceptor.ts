/**
 * logging.interceptor.ts — Interceptor de logging de requests HTTP
 *
 * Registra cada request que llega a la API y su correspondiente respuesta.
 * Al ser el interceptor más externo (registrado primero en AppModule),
 * envuelve todo el ciclo de vida del request incluyendo otros interceptores.
 *
 * Para cada request registra:
 *   → Entrada:  método y URL
 *   ← Salida:   método, URL, status HTTP y tiempo de respuesta en ms
 *   ← Error:    método, URL, mensaje de error y tiempo hasta el fallo
 *
 * Ejemplo de logs en consola:
 *   → POST /api/v1/auth/login
 *   ← POST /api/v1/auth/login [201] 45ms
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // Logger con contexto 'HTTP' para distinguir estos logs de otros
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req            = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const start          = Date.now(); // marca el momento en que llega el request

    // Log de entrada — antes de que el controller procese el request
    this.logger.log(`→ ${method} ${url}`);

    return next.handle().pipe(
      // tap() se ejecuta cuando el controller retorna exitosamente
      // sin modificar el valor retornado
      tap(() => {
        const res     = context.switchToHttp().getResponse<Response>();
        const elapsed = Date.now() - start; // tiempo total en milisegundos
        this.logger.log(`← ${method} ${url} [${res.statusCode}] ${elapsed}ms`);
      }),

      // catchError() captura errores del controller o de otros interceptores
      // loguea el error y lo re-lanza para que AllExceptionsFilter lo maneje
      catchError((error) => {
        const elapsed = Date.now() - start;
        this.logger.error(`← ${method} ${url} [ERROR] ${elapsed}ms — ${error.message}`);
        return throwError(() => error); // re-lanza el error sin tragárselo
      }),
    );
  }
}
