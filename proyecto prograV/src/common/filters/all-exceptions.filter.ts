/**
 * all-exceptions.filter.ts — Filtro global de manejo de errores
 *
 * @Catch() sin argumentos captura CUALQUIER tipo de excepción:
 * - HttpException (401, 400, 404, etc.) lanzadas por NestJS o el código
 * - Error nativo de JavaScript (TypeError, ReferenceError, etc.)
 * - Errores de Prisma (por ejemplo violación de constraint único)
 * - Cualquier valor lanzado con throw
 *
 * Garantiza que SIEMPRE se devuelve un JSON con formato consistente
 * sin importar qué excepción ocurra. Registrado en AppModule con APP_FILTER.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../../shared/types/api-response.type';

@Catch() // captura absolutamente todas las excepciones
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    // Obtiene el contexto HTTP para acceder a request y response
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    // Valores por defecto para excepciones no controladas (500)
    let status  = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';
    let error   = 'Internal Server Error';

    if (exception instanceof HttpException) {
      // Excepción HTTP conocida: 400 Bad Request, 401 Unauthorized, 404, etc.
      // Lanzadas por NestJS (guards, pipes) o por el código con throw new HttpException(...)
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        // Forma simple: throw new HttpException('mensaje', status)
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        // Forma objeto: contiene { message, error } — usado por class-validator
        const resp = exceptionResponse as any;
        message = resp.message ?? message;
        error   = resp.error   ?? error;
      }
    } else if (exception instanceof Error) {
      // Error nativo de JavaScript u otro Error no-HTTP
      // Ej: errores de Prisma, errores de red, errores de lógica no controlados
      message = exception.message || message;
      this.logger.error(`Excepción no controlada: ${exception.message}`, exception.stack);
    } else {
      // Cualquier otro valor lanzado (string, número, objeto plano)
      this.logger.error('Excepción desconocida', String(exception));
    }

    // Construye el cuerpo de respuesta de error estandarizado
    const body: ApiErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url, // ruta que generó el error
    };

    // Log diferenciado según severidad
    if (status >= 500) {
      // Errores de servidor → log de error con stack trace
      this.logger.error(
        `[${request.method}] ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      // Errores del cliente (4xx) → solo warning
      this.logger.warn(`[${request.method}] ${request.url} → ${status}: ${JSON.stringify(message)}`);
    }

    // Envía la respuesta JSON con el código de status correcto
    response.status(status).json(body);
  }
}
