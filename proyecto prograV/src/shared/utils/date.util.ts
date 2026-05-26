/**
 * date.util.ts — Utilidades para manejo de fechas y tiempos de expiración
 *
 * Las variables de entorno como JWT_EXPIRES_IN='5m' y JWT_REFRESH_EXPIRES_IN='7d'
 * usan un formato de string compacto. Este módulo convierte esos strings
 * a valores numéricos (segundos) y a objetos Date para guardar en la BD.
 *
 * Formatos soportados: '30s', '5m', '2h', '7d'
 */

/**
 * parseExpiresInToSeconds — Convierte un string de expiración a segundos
 * Usado para calcular el campo expires_in de la respuesta de login.
 *
 * @param expiresIn — string como '5m', '1h', '7d', '300s'
 * @returns número de segundos equivalente
 *
 * Ejemplo: '5m' → 300, '7d' → 604800, '1h' → 3600
 */
export function parseExpiresInToSeconds(expiresIn: string): number {
  const unit  = expiresIn.slice(-1);                    // último carácter: 's', 'm', 'h', 'd'
  const value = parseInt(expiresIn.slice(0, -1), 10);   // número antes de la unidad

  switch (unit) {
    case 's': return value;                // segundos → directo
    case 'm': return value * 60;           // minutos → ×60
    case 'h': return value * 60 * 60;      // horas → ×3600
    case 'd': return value * 24 * 60 * 60; // días → ×86400
    default:  return 300;                  // fallback: 5 minutos si el formato es desconocido
  }
}

/**
 * addSecondsToNow — Calcula una fecha futura sumando segundos al momento actual
 *
 * @param seconds — cantidad de segundos a sumar
 * @returns objeto Date con la fecha resultante
 */
export function addSecondsToNow(seconds: number): Date {
  const date = new Date();
  date.setSeconds(date.getSeconds() + seconds);
  return date;
}

/**
 * expiresInToDate — Convierte un string de expiración a una fecha absoluta
 * Usado para calcular el campo expiresAt del refresh token al guardarlo en BD.
 *
 * @param expiresIn — string como '7d', '5m'
 * @returns Date con la fecha exacta de expiración
 *
 * Ejemplo: si hoy es 2026-01-01 y expiresIn='7d' → retorna 2026-01-08
 */
export function expiresInToDate(expiresIn: string): Date {
  const seconds = parseExpiresInToSeconds(expiresIn);
  return addSecondsToNow(seconds);
}
