/**
 * public.decorator.ts — Decorador @Public() para rutas sin autenticación
 *
 * Por defecto el JwtAuthGuard protege todos los endpoints.
 * Este decorador marca excepciones: endpoints que deben ser accesibles
 * sin token JWT (login, refresh, endpoints públicos de información).
 *
 * Funciona junto con JwtAuthGuard: el guard lee la metadata IS_PUBLIC_KEY
 * y si está en true, permite el acceso sin verificar token.
 *
 * Uso:
 *   @Public()
 *   @Post('login')
 *   async login(...) { ... }
 */

import { SetMetadata } from '@nestjs/common';

// Clave que JwtAuthGuard busca con Reflector para saber si la ruta es pública
export const IS_PUBLIC_KEY = 'isPublic';

// Decorador sin argumentos — simplemente marca la ruta como pública
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
