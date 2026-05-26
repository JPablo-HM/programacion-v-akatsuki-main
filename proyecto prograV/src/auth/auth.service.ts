/**
 * auth.service.ts — Lógica de negocio de autenticación (SRV1)
 *
 * Implementa completamente la historia SRV1: autenticación de usuarios.
 * Contiene la lógica de los tres endpoints de auth:
 *   - login():         valida credenciales y emite tokens
 *   - refresh():       rota tokens usando refresh_token
 *   - validateToken(): comprueba si un payload JWT es válido
 *
 * Principios de seguridad aplicados:
 *   - Mensajes de error genéricos (no revelan qué campo falló)
 *   - Rotación de refresh tokens (el anterior se revoca al refrescar)
 *   - bcrypt para comparar contraseñas (nunca texto plano)
 *   - Tokens de acceso cortos (5m) + refresh largos (7d)
 */

import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid'; // genera UUID v4 aleatorio para refresh tokens

import { LoginDto }                               from './dto/login.dto';
import { RefreshTokenDto }                        from './dto/refresh-token.dto';
import { AuthResponseDto, RefreshResponseDto }    from './dto/auth-response.dto';
import { RefreshTokenRepository }                 from './repositories/refresh-token.repository';
import { UsersRepository }                        from '../users/users.repository';
import { JwtPayload }                             from '../shared/types/jwt-payload.type';
import { comparePassword }                        from '../shared/utils/bcrypt.util';
import { parseExpiresInToSeconds, expiresInToDate } from '../shared/utils/date.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService:             JwtService,
    private readonly configService:          ConfigService,
    private readonly usersRepository:        UsersRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  // ──────────────────────────────────────────────────────────
  // LOGIN — POST /auth/login
  // ──────────────────────────────────────────────────────────

  /**
   * login — Autentica un usuario y emite access_token + refresh_token
   *
   * Flujo:
   *   1. Busca usuario por email O username en la BD
   *   2. Verifica que exista y esté activo
   *   3. Verifica que el tipoUsuario coincida con el enviado
   *   4. Compara la contraseña con bcrypt
   *   5. Construye el payload JWT con los datos del usuario
   *   6. Firma el access_token JWT
   *   7. Genera y guarda un refresh_token UUID en BD
   *   8. Retorna todos los datos al cliente
   *
   * En cualquier fallo de validación de credenciales → mensaje genérico
   * (no se revela si el usuario existe, si la contraseña es incorrecta, etc.)
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const { usuario, password, tipoUsuario } = dto;

    // Busca por email primero, si no encuentra, busca por username
    const user = await this.usersRepository.findByEmailOrUsername(usuario);

    // Comprobación combinada de existencia y estado activo
    // El mensaje es intencionalmente genérico por seguridad
    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario y/o contraseña incorrectos');
    }

    // Valida que el tipo de usuario enviado coincida con el registrado en BD
    // Un estudiante no puede autenticarse como admin aunque tenga la contraseña
    if (user.tipoUsuario.nombre !== tipoUsuario) {
      throw new UnauthorizedException('Usuario y/o contraseña incorrectos');
    }

    // Compara la contraseña ingresada con el hash bcrypt almacenado en BD
    const passwordValid = await comparePassword(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Usuario y/o contraseña incorrectos');
    }

    // Mapea las instituciones del usuario para incluirlas en la respuesta
    const institutions = user.instituciones.map((ui) => ({
      id:     ui.institucion.id,
      nombre: ui.institucion.nombre,
      codigo: ui.institucion.codigo,
    }));

    // Construye el payload que irá dentro del JWT
    // Solo se incluyen IDs de instituciones (no objetos completos) para mantener el token pequeño
    const payload: JwtPayload = {
      sub:           user.id,
      email:         user.email,
      username:      user.username,
      tipoUsuario:   user.tipoUsuario.nombre,
      instituciones: institutions.map((i) => i.id),
    };

    const accessToken  = this.signAccessToken(payload);
    const refreshToken = await this.createRefreshToken(user.id);
    const expiresIn    = this.configService.get<string>('jwt.expiresIn', '5m');

    this.logger.log(`Login exitoso: ${user.email} [${user.tipoUsuario.nombre}]`);

    return {
      expires_in:    String(parseExpiresInToSeconds(expiresIn)), // ej: '300' para 5m
      access_token:  accessToken,
      refresh_token: refreshToken,
      usuarioID:     user.id,
      institutions,  // objetos completos con id, nombre y codigo
    };
  }

  // ──────────────────────────────────────────────────────────
  // REFRESH TOKEN — POST /auth/refresh
  // ──────────────────────────────────────────────────────────

  /**
   * refresh — Rota los tokens usando un refresh_token válido
   *
   * Implementa la técnica de "Refresh Token Rotation":
   *   - El token antiguo se revoca inmediatamente al usarse
   *   - Se emite un nuevo access_token Y un nuevo refresh_token
   *   - Si el token antiguo se roba y alguien lo usa, el sistema
   *     detecta la reutilización y puede alertar (revocado=true)
   *
   * No requiere contraseña — el refresh_token actúa como credencial temporal.
   */
  async refresh(dto: RefreshTokenDto): Promise<RefreshResponseDto> {
    const { refresh_token } = dto;

    // Busca el token en la BD por su valor UUID
    const storedToken = await this.refreshTokenRepository.findByToken(refresh_token);

    // El token no existe en la BD → nunca fue emitido o ya fue eliminado
    if (!storedToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // El token fue revocado → ya fue usado antes (rotación) o se cerró sesión
    if (storedToken.revocado) {
      throw new UnauthorizedException('Refresh token revocado');
    }

    // La fecha de expiración ya pasó → el usuario debe hacer login nuevamente
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    // ROTACIÓN: revoca el token antiguo antes de emitir uno nuevo
    // Esto previene que el mismo refresh_token se use más de una vez
    await this.refreshTokenRepository.revoke(storedToken.id);

    // Carga el usuario actualizado de la BD (por si cambió su estado o rol)
    const user = await this.usersRepository.findById(storedToken.usuarioId);

    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    // Reconstruye el payload con datos actualizados del usuario
    const payload: JwtPayload = {
      sub:           user.id,
      email:         user.email,
      username:      user.username,
      tipoUsuario:   user.tipoUsuario.nombre,
      instituciones: user.instituciones.map((ui) => ui.institucion.id),
    };

    const accessToken = this.signAccessToken(payload);
    const newRefresh  = await this.createRefreshToken(user.id); // nuevo token de refresco
    const expiresIn   = this.configService.get<string>('jwt.expiresIn', '5m');

    return {
      expires_in:    String(parseExpiresInToSeconds(expiresIn)),
      access_token:  accessToken,
      refresh_token: newRefresh, // el cliente debe guardar este nuevo token
    };
  }

  // ──────────────────────────────────────────────────────────
  // VALIDATE TOKEN — GET /auth/validate
  // ──────────────────────────────────────────────────────────

  /**
   * validateToken — Verifica que el payload del JWT sea válido
   * El JwtAuthGuard ya verificó firma y expiración antes de llegar aquí.
   * Esta validación adicional confirma que el campo sub (userId) existe.
   *
   * @param user — payload del JWT inyectado por @CurrentUser()
   * @returns true si el token es válido
   */
  validateToken(user: JwtPayload): boolean {
    return !!user?.sub; // !! convierte a booleano: true si sub tiene valor
  }

  // ──────────────────────────────────────────────────────────
  // MÉTODOS PRIVADOS — Helpers internos
  // ──────────────────────────────────────────────────────────

  /**
   * signAccessToken — Firma un JWT con el payload dado
   * Lee el secreto y la expiración desde ConfigService (variables de entorno)
   */
  private signAccessToken(payload: JwtPayload): string {
    const expiresIn = this.configService.get<string>('jwt.expiresIn', '5m');
    return this.jwtService.sign(payload, { expiresIn });
  }

  /**
   * createRefreshToken — Genera un UUID v4 como refresh token y lo guarda en BD
   * UUID v4 es completamente aleatorio → imposible de predecir o falsificar
   * La expiración se calcula a partir de JWT_REFRESH_EXPIRES_IN del .env
   *
   * @param usuarioId — ID del usuario dueño del token
   * @returns el UUID del token (opaco, no es JWT)
   */
  private async createRefreshToken(usuarioId: string): Promise<string> {
    const token          = uuidv4();                                                    // genera UUID aleatorio
    const refreshExpires = this.configService.get<string>('jwt.refreshExpiresIn', '7d');
    const expiresAt      = expiresInToDate(refreshExpires);                             // convierte '7d' a Date

    await this.refreshTokenRepository.create({ token, usuarioId, expiresAt });
    return token;
  }
}
