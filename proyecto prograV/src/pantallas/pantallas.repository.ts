/**
 * pantallas.repository.ts — Repositorio de pantallas (SRV7)
 *
 * Encapsula todas las operaciones de base de datos para la tabla pantallas.
 * PantallasService delega aquí todas las interacciones con Prisma.
 *
 * Métodos disponibles:
 *   - create:      inserta una nueva pantalla
 *   - findAll:     lista todas ordenadas alfabéticamente
 *   - findById:    busca por UUID primario
 *   - findByRuta:  busca por ruta única (para verificar conflictos)
 *   - update:      actualiza campos de una pantalla existente
 *   - remove:      elimina físicamente una pantalla
 *   - existsById:  verifica existencia sin cargar el objeto completo
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePantallaDto } from './dto/create-pantalla.dto';
import { UpdatePantallaDto } from './dto/update-pantalla.dto';

@Injectable()
export class PantallasRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * create — Inserta una nueva pantalla en la BD
   * El DTO ya fue validado por ValidationPipe antes de llegar aquí.
   * La unicidad de ruta debe verificarse ANTES de llamar a este método
   * (lo hace PantallasService.create con findByRuta).
   */
  async create(dto: CreatePantallaDto) {
    return this.prisma.pantalla.create({ data: dto });
  }

  /**
   * findAll — Lista todas las pantallas ordenadas por nombre (A→Z)
   * El orden alfabético facilita la navegación en interfaces de administración.
   */
  async findAll() {
    return this.prisma.pantalla.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * findById — Busca una pantalla por su UUID
   * Retorna null si no existe. PantallasService convierte el null en NotFoundException.
   */
  async findById(id: string) {
    return this.prisma.pantalla.findUnique({ where: { id } });
  }

  /**
   * findByRuta — Busca una pantalla por su ruta de navegación (campo único)
   * Se usa para verificar conflictos antes de crear o actualizar.
   * Retorna null si la ruta está libre.
   */
  async findByRuta(ruta: string) {
    return this.prisma.pantalla.findUnique({ where: { ruta } });
  }

  /**
   * update — Actualiza los campos de una pantalla existente
   * El servicio verifica que la pantalla exista (findById) y que la nueva
   * ruta no esté en uso por otra pantalla antes de llamar este método.
   */
  async update(id: string, dto: UpdatePantallaDto) {
    return this.prisma.pantalla.update({ where: { id }, data: dto });
  }

  /**
   * remove — Elimina físicamente una pantalla de la BD
   * Es una eliminación definitiva (hard delete). Si se quisiera soft delete,
   * se debería usar update con { activo: false } en lugar de delete.
   */
  async remove(id: string) {
    return this.prisma.pantalla.delete({ where: { id } });
  }

  /**
   * existsById — Verifica si existe una pantalla con ese ID sin cargar el objeto
   * Más eficiente que findById cuando solo se necesita confirmar existencia.
   * count() retorna 0 o 1 ya que id es clave primaria única.
   */
  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.pantalla.count({ where: { id } });
    return count > 0;
  }
}
