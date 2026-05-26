/**
 * raw-response.decorator.ts — Decorador @RawResponse() para saltar el envoltorio
 *
 * El ResponseInterceptor envuelve todas las respuestas en:
 * { success: true, data: ..., timestamp: ... }
 *
 * Algunos endpoints necesitan retornar exactamente el formato especificado
 * por el cliente (Ej: los endpoints de auth devuelven su propio formato con
 * access_token, refresh_token, etc. que no deben ser envueltos).
 *
 * Este decorador le dice al ResponseInterceptor que NO envuelva la respuesta.
 * El Reflector en ResponseInterceptor lee esta metadata y si está presente,
 * retorna los datos tal como los devuelve el controller.
 *
 * Uso:
 *   @RawResponse()
 *   @Post('login')
 *   async login(): Promise<AuthResponseDto> { ... }
 */

import { SetMetadata } from '@nestjs/common';

// Clave que ResponseInterceptor busca con Reflector
export const RAW_RESPONSE_KEY = 'rawResponse';

// Decorador sin argumentos — marca el endpoint para saltar el envoltorio
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);
