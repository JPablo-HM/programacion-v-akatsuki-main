/**
 * app.config.ts — Configuración general de la aplicación
 *
 * Usa registerAs para agrupar todas las variables de entorno
 * relacionadas con la app bajo la clave 'app'.
 * Se accede desde cualquier servicio con:
 *   configService.get<tipo>('app.nombreVariable')
 */

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Entorno de ejecución: 'development' | 'production' | 'test'
  nodeEnv: process.env.NODE_ENV || 'development',

  // Puerto en el que escucha el servidor HTTP
  port: parseInt(process.env.PORT || '3000', 10),

  // Nombre identificador de la aplicación (usado en logs)
  name: process.env.APP_NAME || 'carnet-digital-cuc',

  // Orígenes permitidos para CORS, separados por coma
  // Ej: 'http://localhost:4200,http://localhost:3001'
  corsOrigins: process.env.CORS_ORIGINS || '*',

  // Ventana de tiempo para rate limiting (segundos)
  throttleTtl: parseInt(process.env.THROTTLE_TTL || '60', 10),

  // Máximo de requests permitidos en la ventana de tiempo
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
}));
