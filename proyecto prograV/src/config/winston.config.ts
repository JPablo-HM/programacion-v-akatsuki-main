/**
 * winston.config.ts — Configuración del sistema de logging
 *
 * Winston es una librería de logging profesional que reemplaza
 * al console.log y al Logger básico de NestJS.
 *
 * Estrategia de formatos:
 *  - Desarrollo: texto colorido en consola → fácil de leer
 *  - Producción: JSON estructurado en consola + archivos de log
 *    (los archivos JSON son más fáciles de procesar con herramientas
 *     como Kibana, Datadog, Splunk, etc.)
 */

import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

export const winstonConfig = (): WinstonModuleOptions => {
  // Detecta el entorno para elegir el formato adecuado
  const isProduction = process.env.NODE_ENV === 'production';

  // Formato para desarrollo: timestamp + colores + texto legible
  // Ejemplo de salida: [2026-01-01 12:00:00] [AuthService] info: Login exitoso
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ level, message, timestamp, context, trace }) => {
      const ctx = context ? `[${context}]` : ''; // contexto del módulo NestJS
      const err = trace ? `\n${trace}` : '';      // stack trace si hay error
      return `[${timestamp}] ${ctx} ${level}: ${message}${err}`;
    }),
  );

  // Formato para producción: JSON estructurado con timestamp y stack de errores
  // Ejemplo: { "level":"error", "message":"...", "timestamp":"...", "stack":"..." }
  const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }), // incluye stack trace en errores
    winston.format.json(),
  );

  // Transport base: siempre se loguea en consola
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: isProduction ? jsonFormat : consoleFormat,
    }),
  ];

  // En producción se agregan transportes a archivos
  if (isProduction) {
    transports.push(
      // Archivo solo para errores — más fácil de monitorear alertas críticas
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',            // solo registra nivel 'error' y superiores
        format: jsonFormat,
        maxsize: 10 * 1024 * 1024, // máximo 10MB por archivo
        maxFiles: 5,               // rota y mantiene máximo 5 archivos
      }),
      // Archivo con todos los niveles combinados
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: jsonFormat,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 10,
      }),
    );
  }

  return { transports };
};
