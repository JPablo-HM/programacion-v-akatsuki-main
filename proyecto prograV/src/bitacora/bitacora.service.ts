/**
 * bitacora.service.ts — Servicio de bitácora de auditoría (SRV9)
 *
 * Lógica de negocio para el registro y consulta de eventos de auditoría.
 * La bitácora es append-only (solo se agregan registros, nunca se modifican ni eliminan).
 *
 * Métodos principales:
 *   - registrar:              crea un registro a partir de un DTO (uso manual o desde otros servicios)
 *   - registrarDesdeRequest:  helper que extrae la IP real del request HTTP automáticamente
 *   - findAll:                lista paginada de todos los registros
 *   - findByUsuario:          historial completo de un usuario
 *   - findById:               registro específico (lanza 404 si no existe)
 *
 * registrarDesdeRequest es el método que otros servicios deben usar al registrar
 * acciones del usuario, ya que maneja automáticamente la extracción de IP con
 * soporte para proxies (cabecera x-forwarded-for).
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { BitacoraRepository } from './bitacora.repository';
import { CreateBitacoraDto } from './dto/create-bitacora.dto';
import { Request } from 'express';

@Injectable()
export class BitacoraService {
  constructor(private readonly bitacoraRepository: BitacoraRepository) {}

  /**
   * registrar — Crea un registro de auditoría a partir de un DTO completo
   * Método base que delega directamente al repositorio.
   * Útil cuando ya se tiene la IP disponible en el DTO.
   */
  async registrar(dto: CreateBitacoraDto) {
    return this.bitacoraRepository.create(dto);
  }

  /**
   * registrarDesdeRequest — Registra un evento extrayendo la IP del request HTTP
   * Este es el método recomendado cuando se tiene acceso al objeto Request de Express.
   *
   * Extrae la IP real con soporte para proxies inversos (nginx, load balancers):
   *   1. Intenta x-forwarded-for: contiene la IP original antes del proxy
   *      (puede tener múltiples IPs separadas por comas — se toma la primera)
   *   2. Fallback a req.socket.remoteAddress: IP directa del socket TCP
   *   3. undefined si no hay req disponible
   *
   * @param usuarioId   — UUID del usuario que realizó la acción
   * @param descripcion — descripción legible del evento
   * @param accion      — código de acción (LOGIN, CREATE, UPDATE, DELETE, etc.)
   * @param req         — objeto Request de Express (opcional para flexibilidad)
   */
  async registrarDesdeRequest(
    usuarioId: string,
    descripcion: string,
    accion: string,
    req?: Request,
  ) {
    // Extrae la IP del header x-forwarded-for (proxy) o del socket directo
    const ip = req
      ? (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress
      : undefined;

    return this.bitacoraRepository.create({ usuarioId, descripcion, accion, ip });
  }

  /**
   * findAll — Lista paginada de todos los registros de auditoría (más reciente primero)
   * El repositorio ejecuta data+count en paralelo para mayor eficiencia.
   *
   * @param page  — página actual (1-based)
   * @param limit — registros por página
   */
  async findAll(page = 1, limit = 20) {
    return this.bitacoraRepository.findAll(page, limit);
  }

  /**
   * findByUsuario — Obtiene todos los registros de auditoría de un usuario
   * Útil para auditorías de seguridad o para mostrar el historial de actividad
   * de un usuario específico en paneles de administración.
   */
  async findByUsuario(usuarioId: string) {
    return this.bitacoraRepository.findByUsuario(usuarioId);
  }

  /**
   * findById — Busca un registro específico por UUID, lanza 404 si no existe
   *
   * @throws NotFoundException si no existe ningún registro con ese ID
   */
  async findById(id: string) {
    const entry = await this.bitacoraRepository.findById(id);
    if (!entry) throw new NotFoundException(`Registro de bitácora con id "${id}" no encontrado`);
    return entry;
  }
}
