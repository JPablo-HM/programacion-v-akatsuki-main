/**
 * jwt-auth.guard.ts — Guard de autenticación JWT
 *
 * Protege los endpoints verificando que el request incluya un JWT válido.
 * Se usa con @UseGuards(JwtAuthGuard) en controllers o métodos individuales.
 * También puede aplicarse globalmente desde AppModule.
 *
 * Extiende AuthGuard('jwt') de Passport, que internamente llama a JwtStrategy.
 *
 * Lógica:
 *   1. canActivate(): verifica si la ruta es @Public(). Si lo es, deja pasar.
 *      Si no, delega a AuthGuard('jwt') que invoca JwtStrategy.
 *   2. handleRequest(): si Passport encontró un error o no hay usuario,
 *      personaliza el mensaje de error según el tipo de fallo del JWT.
 */

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Reflector permite leer metadata de decoradores como @Public()
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * canActivate — Decide si el request puede continuar
   * Primero revisa si la ruta tiene el decorador @Public().
   * Si es pública, retorna true sin verificar ningún token.
   * Si no, llama a super.canActivate() que activa JwtStrategy.
   */
  canActivate(context: ExecutionContext) {
    // Busca @Public() primero en el método, luego en la clase completa
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta está marcada como pública, permite el acceso sin token
    if (isPublic) {
      return true;
    }

    // Para rutas protegidas, activa la validación JWT de Passport
    return super.canActivate(context);
  }

  /**
   * handleRequest — Maneja el resultado de la validación JWT
   * Si Passport encontró un error o no hay usuario, lanza 401 con
   * un mensaje específico según el tipo de error del token.
   *
   * @param err  — error lanzado por Passport si algo falló
   * @param user — payload del usuario si el token es válido
   * @param info — información del error de JWT (TokenExpiredError, etc.)
   */
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      // Personaliza el mensaje según el tipo específico de error JWT
      const message =
        info?.name === 'TokenExpiredError'
          ? 'El token ha expirado'          // el token existía pero venció
          : info?.name === 'JsonWebTokenError'
          ? 'Token inválido'                 // firma incorrecta o token malformado
          : 'No autorizado';                 // cualquier otro caso (sin token, etc.)

      throw new UnauthorizedException(message);
    }

    // Si todo está bien, retorna el usuario (payload del JWT)
    // Este valor queda disponible en request.user
    return user;
  }
}
