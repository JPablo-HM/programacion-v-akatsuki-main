/**
 * bcrypt.util.ts — Utilidades para manejo seguro de contraseñas
 *
 * bcrypt es el algoritmo estándar para hashear contraseñas.
 * A diferencia de SHA/MD5, bcrypt es lento por diseño (el factor
 * SALT_ROUNDS controla cuánto trabajo computacional requiere),
 * lo que hace que los ataques de fuerza bruta sean muy costosos.
 *
 * SALT_ROUNDS = 10 → ~100ms por hash en hardware moderno.
 * Nunca guardar contraseñas en texto plano. Siempre hashear antes de insertar.
 */

import * as bcrypt from 'bcrypt';

// Número de rondas de salt — determina la seguridad y velocidad del hash
// 10 es el estándar recomendado para aplicaciones web (balance seguridad/velocidad)
const SALT_ROUNDS = 10;

/**
 * hashPassword — Convierte una contraseña en texto plano a hash bcrypt
 * Se usa al crear o actualizar la contraseña de un usuario.
 *
 * @param plain — contraseña en texto plano ingresada por el usuario
 * @returns hash bcrypt listo para guardar en la base de datos
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * comparePassword — Verifica si una contraseña coincide con su hash
 * Se usa en el proceso de login para validar credenciales.
 * bcrypt extrae el salt del hash automáticamente para la comparación.
 *
 * @param plain  — contraseña ingresada por el usuario en el login
 * @param hashed — hash guardado en la base de datos
 * @returns true si coinciden, false si no
 */
export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
