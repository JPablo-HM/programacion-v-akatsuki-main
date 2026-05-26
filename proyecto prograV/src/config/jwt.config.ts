/**
 * jwt.config.ts — Configuración de tokens JWT
 *
 * Centraliza todos los parámetros relacionados con autenticación JWT.
 * Se accede con: configService.get<tipo>('jwt.nombreVariable')
 *
 * Dos secretos distintos:
 *  - secret         → firma el access_token (corta duración)
 *  - refreshSecret  → firma/valida el refresh_token (larga duración)
 * Usar secretos diferentes es una buena práctica de seguridad.
 */

import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  // Clave secreta para firmar los access tokens
  // IMPORTANTE: cambiar en producción, mínimo 32 caracteres aleatorios
  secret: process.env.JWT_SECRET || 'default_jwt_secret_CHANGE_IN_PRODUCTION_32chars',

  // Tiempo de vida del access token: '5m', '1h', '30s', etc.
  // Default 5 minutos — corto por seguridad
  expiresIn: process.env.JWT_EXPIRES_IN || '5m',

  // Clave secreta distinta para los refresh tokens
  // Si se compromete un access token, el refresh sigue siendo seguro
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_CHANGE_IN_PRODUCTION_32chars',

  // Tiempo de vida del refresh token: generalmente mucho más largo
  // Default 7 días — permite renovar el acceso sin volver a hacer login
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));
