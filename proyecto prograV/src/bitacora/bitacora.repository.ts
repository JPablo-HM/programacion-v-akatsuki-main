/**
 * bitacora.repository.ts — Repositorio de bitácora de auditoría (SRV9)
 *
 * Encapsula todas las operaciones de base de datos para la tabla bitacora.
 * BitacoraService delega aquí las interacciones con Prisma.
 *
 * Características clave:
 *   - create:        inserta un registro de auditoría incluyendo datos del usuario
 *   - findAll:       lista paginada con conteo total (Promise.all para eficiencia)
 *   - findByUsuario: historial de acciones de un usuario específico
 *   - findById:      registro específico por UUID
 *
 * Todos los métodos incluyen datos del usuario (id, email, username) mediante
 * { select } en la relación — no se carga el objeto usuario completo (que incluiría
 * la contraseña) sino solo los campos identificadores necesarios para mostrar en UI.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBitacoraDto } from './dto/create-bitacora.dto';

@Injectable()
export class BitacoraRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * create — Inserta un nuevo registro de auditoría
   * Incluye { select } en la relación usuario para retornar solo id, email y username
   * (no el objeto completo que contendría datos sensibles como el hash de contraseña).
   */
  async create(dto: CreateBitacoraDto) {
    return this.prisma.bitacora.create({
      data: {
        usuarioId:   dto.usuarioId,
        descripcion: dto.descripcion,
        accion:      dto.accion,
        ip:          dto.ip,
      },
      // Retorna los datos mínimos del usuario para identificar al actor en la respuesta
      include: { usuario: { select: { id: true, email: true, username: true } } },
    });
  }

  /**
   * findAll — Lista paginada de todos los registros ordenados por fecha descendente
   *
   * Usa Promise.all para ejecutar la consulta de datos y el conteo total en PARALELO,
   * lo que reduce el tiempo de respuesta a max(T_data, T_count) en vez de T_data + T_count.
   *
   * Retorna: { data, total, page, limit } para que el cliente pueda calcular paginación.
   *
   * @param page  — número de página (1-based), por defecto 1
   * @param limit — registros por página, por defecto 20
   */
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit; // cuántos registros saltar (offset)

    // Ejecuta ambas consultas en paralelo para mejor rendimiento
    const [data, total] = await Promise.all([
      this.prisma.bitacora.findMany({
        skip,
        take: limit,
        orderBy: { fecha: 'desc' }, // más reciente primero
        include: { usuario: { select: { id: true, email: true, username: true } } },
      }),
      this.prisma.bitacora.count(), // total de registros para calcular total de páginas
    ]);

    return { data, total, page, limit };
  }

  /**
   * findByUsuario — Historial de auditoría de un usuario específico
   * Retorna todos los registros del usuario ordenados del más reciente al más antiguo.
   * No pagina porque el historial individual raramente supera cientos de registros.
   */
  async findByUsuario(usuarioId: string) {
    return this.prisma.bitacora.findMany({
      where: { usuarioId },
      orderBy: { fecha: 'desc' },
      include: { usuario: { select: { id: true, email: true, username: true } } },
    });
  }

  /**
   * findById — Busca un registro específico de auditoría por su UUID
   * Retorna null si no existe. BitacoraService convierte el null en NotFoundException.
   */
  async findById(id: string) {
    return this.prisma.bitacora.findUnique({
      where: { id },
      include: { usuario: { select: { id: true, email: true, username: true } } },
    });
  }
}
