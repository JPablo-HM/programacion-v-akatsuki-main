/**
 * jwt.strategy.ts — Estrategia de validación de tokens JWT (Passport)
 *
 * Es el componente que Passport usa para verificar tokens JWT.
 * Se ejecuta automáticamente cada vez que JwtAuthGuard protege un endpoint.
 *
 * Proceso que sigue para cada request:
 *   1. Extrae el token del header: "Authorization: Bearer <token>"
 *   2. Verifica la firma usando JWT_SECRET del .env
 *   3. Verifica que el token no haya expirado
 *   4. Si pasa todo, llama a validate() con el payload decodificado
 *   5. Lo que retorna validate() se guarda en request.user
 *
 * Si el token falla en cualquier paso → Passport lanza 401 automáticamente.
 * El JwtAuthGuard intercepta ese error y personaliza el mensaje.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../shared/types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      // Dónde extraer el token: del header Authorization como Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // false → si el token expiró, lanza error (no lo ignora)
      ignoreExpiration: false,

      // La misma clave secreta usada para firmar el token en auth.service.ts
      // Si la clave no coincide, la verificación falla → 401
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  /**
   * validate — Se llama DESPUÉS de que Passport verificó la firma y expiración
   * El payload ya está decodificado y verificado cuando llega aquí.
   * Lo que se retorna queda disponible en request.user del controller.
   *
   * @param payload — contenido decodificado del JWT (sub, email, tipoUsuario, etc.)
   * @returns el mismo payload que quedará en request.user
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Verificación mínima: el campo sub (userId) es obligatorio en JWT estándar
    if (!payload?.sub) {
      throw new UnauthorizedException('Token inválido');
    }

    // Se retorna el payload completo → disponible con @CurrentUser() en controllers
    return payload;
  }
}
