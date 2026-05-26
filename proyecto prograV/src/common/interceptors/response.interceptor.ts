/**
 * response.interceptor.ts — Interceptor de respuesta estandarizada
 *
 * Envuelve automáticamente TODAS las respuestas exitosas en el formato:
 * {
 *   "success": true,
 *   "data": <lo que retornó el controller>,
 *   "timestamp": "2026-01-01T00:00:00.000Z"
 * }
 *
 * Excepción: si el endpoint usa @RawResponse(), pasa los datos sin envolver.
 * Esto permite que los endpoints de auth retornen su formato propio
 * (access_token, refresh_token, etc.) sin la envoltura.
 *
 * Flujo:
 *   Request → [LoggingInterceptor] → [ResponseInterceptor] → Controller
 *   Response← [LoggingInterceptor] ← [ResponseInterceptor] ← Controller
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator';
import { ApiResponse } from '../../shared/types/api-response.type';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  // Reflector permite leer metadata de decoradores como @RawResponse()
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Verifica si el handler o su clase tienen el decorador @RawResponse()
    // getAllAndOverride busca primero en el método, luego en la clase
    const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(), // decorador en el método específico
      context.getClass(),   // decorador en el controller completo
    ]);

    // Si está marcado como raw, retorna la respuesta tal cual sin modificar
    if (isRaw) {
      return next.handle();
    }

    // Para todos los demás endpoints, envuelve la respuesta del controller
    // map() transforma el valor emitido por el Observable que retorna el controller
    return next.handle().pipe(
      map((data): ApiResponse => ({
        success:   true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
