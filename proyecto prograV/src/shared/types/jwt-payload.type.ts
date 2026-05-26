/**
 * jwt-payload.type.ts — Tipo TypeScript del payload del JWT
 *
 * Define la estructura exacta de los datos que van DENTRO del token JWT.
 * Cuando el JwtStrategy valida un token, devuelve un objeto de este tipo
 * que NestJS guarda en request.user y queda disponible en los controllers
 * mediante el decorador @CurrentUser().
 *
 * Campos estándar JWT:
 *  - sub (subject): identificador único del usuario — campo obligatorio en JWT
 *  - iat (issued at): timestamp de cuándo se emitió el token (lo agrega el JwtService)
 *  - exp (expires at): timestamp de cuándo expira (lo agrega el JwtService)
 *
 * Campos personalizados (del dominio):
 *  - email, username, tipoUsuario, instituciones
 */

export interface JwtPayload {
  sub: string;             // ID del usuario (UUID) — campo requerido por el estándar JWT
  email: string;           // Email del usuario autenticado
  username: string;        // Nombre de usuario
  tipoUsuario: string;     // Rol: 'ADMIN' | 'ESTUDIANTE' | 'FUNCIONARIO'
  instituciones: string[]; // Array de IDs de instituciones a las que pertenece
  iat?: number;            // Issued At — timestamp en segundos (auto-generado)
  exp?: number;            // Expiration — timestamp en segundos (auto-generado)
}
