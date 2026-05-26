/**
 * roles.decorator.ts — Decorador @Roles() para control de acceso por rol
 *
 * Adjunta metadata a un endpoint o controller indicando qué roles
 * pueden acceder. Un RolesGuard futuro leerá esta metadata y comparará
 * los roles requeridos contra el tipoUsuario del token JWT.
 *
 * Uso:
 *   @Roles('ADMIN')                    → solo administradores
 *   @Roles('ADMIN', 'FUNCIONARIO')     → admin o funcionario
 *
 * Preparado para implementar RolesGuard cuando sea necesario.
 * Por ahora los endpoints solo requieren estar autenticado (JwtAuthGuard).
 */

import { SetMetadata } from '@nestjs/common';

// Clave para recuperar la metadata en el guard con Reflector
export const ROLES_KEY = 'roles';

// Decorador que acepta uno o varios roles como argumentos
// y los guarda como metadata en el handler/controller
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
