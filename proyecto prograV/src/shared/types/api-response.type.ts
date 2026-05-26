/**
 * api-response.type.ts — Tipos de respuesta estandarizados de la API
 *
 * Define la forma (shape) que deben tener TODAS las respuestas HTTP
 * de la API para mantener consistencia entre endpoints.
 *
 * ApiResponse<T>       → respuesta exitosa, usada por ResponseInterceptor
 * ApiErrorResponse     → respuesta de error, usada por AllExceptionsFilter
 *
 * Ejemplo de ApiResponse:
 * {
 *   "success": true,
 *   "data": { ...datos del endpoint... },
 *   "timestamp": "2026-01-01T00:00:00.000Z"
 * }
 *
 * Ejemplo de ApiErrorResponse:
 * {
 *   "statusCode": 401,
 *   "message": "No autorizado",
 *   "error": "Unauthorized",
 *   "timestamp": "2026-01-01T00:00:00.000Z",
 *   "path": "/api/v1/auth/login"
 * }
 */

export interface ApiResponse<T = any> {
  success: boolean;   // siempre true en respuestas exitosas
  data: T;            // el dato que devuelve el controller (genérico)
  message?: string;   // mensaje opcional descriptivo
  timestamp: string;  // ISO 8601 — cuándo se generó la respuesta
}

export interface ApiErrorResponse {
  statusCode: number;          // código HTTP: 400, 401, 404, 500, etc.
  message: string | string[];  // puede ser uno o varios mensajes (class-validator devuelve array)
  error?: string;              // nombre del error HTTP: 'Unauthorized', 'Bad Request', etc.
  timestamp: string;           // cuándo ocurrió el error
  path: string;                // ruta que generó el error, útil para debugging
}
