/**
 * current-user.decorator.ts — Decorador de parámetro @CurrentUser()
 *
 * Extrae el usuario autenticado desde el objeto request de Express.
 * Después de que JwtAuthGuard valida el token JWT, el JwtStrategy
 * coloca el payload decodificado en request.user.
 *
 * Este decorador permite acceder a esos datos directamente en el
 * controller sin tener que escribir req.user manualmente.
 *
 * Uso básico (objeto completo):
 *   @CurrentUser() user: JwtPayload
 *
 * Uso con campo específico:
 *   @CurrentUser('email') email: string
 *   @CurrentUser('sub') userId: string
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../shared/types/jwt-payload.type';

export const CurrentUser = createParamDecorator(
  // _data: campo específico a extraer (opcional)
  // ctx: contexto de ejecución que da acceso al request HTTP
  (_data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // request.user es poblado por JwtStrategy.validate() después
    // de verificar y decodificar el token JWT del header Authorization
    const user: JwtPayload = request.user;

    // Si se especificó un campo concreto, retorna solo ese campo
    // Si no, retorna el objeto completo del usuario
    return _data ? user?.[_data] : user;
  },
);
