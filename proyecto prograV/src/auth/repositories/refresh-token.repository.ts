/**
 * refresh-token.repository.ts — Repositorio de tokens de refresco
 *
 * Encapsula todas las operaciones de base de datos relacionadas con
 * la tabla refresh_tokens. El AuthService usa este repositorio para:
 * - Crear un nuevo token al hacer login
 * - Buscar y validar un token al hacer refresh
 * - Revocar tokens para implementar rotación y cierre de sesión
 * - Limpiar tokens expirados (mantenimiento)
 *
 * Patrón Repository: desacopla la lógica de negocio (AuthService)
 * del acceso a datos (PrismaClient). Si cambiara la BD, solo
 * habría que modificar este archivo.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RefreshToken } from '@prisma/client';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * create — Guarda un nuevo refresh token en la BD
   * Se llama después de un login exitoso o después de un refresh.
   *
   * @param data.token     — UUID v4 generado por AuthService
   * @param data.usuarioId — ID del usuario al que pertenece el token
   * @param data.expiresAt — fecha de expiración calculada desde JWT_REFRESH_EXPIRES_IN
   */
  async create(data: { token: string; usuarioId: string; expiresAt: Date }): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  /**
   * findByToken — Busca un refresh token por su valor UUID
   * Se usa al validar el token recibido en POST /auth/refresh.
   * Retorna null si no existe, lo que indica token inválido.
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { token } });
  }

  /**
   * revoke — Marca un token específico como revocado
   * Se llama al rotar tokens: el token antiguo se revoca antes
   * de emitir el nuevo. Así si el token antiguo es robado,
   * ya no sirve para obtener uno nuevo.
   *
   * @param id — ID del registro de refresh_token (no el UUID del token)
   */
  async revoke(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revocado: true }, // marca como revocado, no elimina de la BD
    });
  }

  /**
   * revokeAllByUser — Revoca TODOS los tokens activos de un usuario
   * Útil para implementar logout global (cerrar todas las sesiones)
   * o cuando se detecta actividad sospechosa.
   *
   * @param usuarioId — ID del usuario cuyos tokens se revocan
   */
  async revokeAllByUser(usuarioId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { usuarioId, revocado: false }, // solo los que aún están activos
      data:  { revocado: true },
    });
  }

  /**
   * deleteExpired — Elimina físicamente los tokens ya expirados
   * Tarea de mantenimiento para no acumular registros inútiles en la BD.
   * Se puede llamar desde un cron job periódico.
   */
  async deleteExpired(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } }, // lt = less than (anterior a ahora)
    });
  }
}
