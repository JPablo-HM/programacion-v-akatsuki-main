/**
 * pantallas.service.ts — Servicio de pantallas (SRV7)
 *
 * Implementa la lógica de negocio del CRUD de pantallas.
 * Se sitúa entre el controlador (que recibe HTTP) y el repositorio (que accede a BD).
 *
 * Reglas de negocio implementadas:
 *   - create:  verifica que la ruta no esté en uso (ConflictException si duplicada)
 *   - findById: lanza NotFoundException si la pantalla no existe
 *   - update:  verifica que la pantalla exista Y que la nueva ruta no esté tomada
 *              por OTRA pantalla (se permite conservar la misma ruta)
 *   - remove:  verifica que exista antes de eliminar
 *
 * El patrón de "buscar primero, luego operar" garantiza que los errores
 * son descriptivos (404, 409) en lugar de errores genéricos de BD.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PantallasRepository } from './pantallas.repository';
import { CreatePantallaDto } from './dto/create-pantalla.dto';
import { UpdatePantallaDto } from './dto/update-pantalla.dto';

@Injectable()
export class PantallasService {
  constructor(private readonly pantallasRepository: PantallasRepository) {}

  /**
   * create — Crea una nueva pantalla verificando que la ruta sea única
   * La ruta es el identificador de navegación de la pantalla (ej: /dashboard).
   * Si ya existe otra pantalla con esa ruta → 409 Conflict.
   */
  async create(dto: CreatePantallaDto) {
    const existing = await this.pantallasRepository.findByRuta(dto.ruta);
    if (existing) {
      throw new ConflictException(`Ya existe una pantalla con la ruta "${dto.ruta}"`);
    }
    return this.pantallasRepository.create(dto);
  }

  /**
   * findAll — Retorna todas las pantallas sin filtros ni paginación
   * Las pantallas son un catálogo relativamente pequeño (decenas, no millones),
   * por eso no se pagina — se carga todo de una vez.
   */
  async findAll() {
    return this.pantallasRepository.findAll();
  }

  /**
   * findById — Busca una pantalla por UUID, lanza 404 si no existe
   * Este método es reutilizado internamente por update() y remove()
   * para verificar que la pantalla objetivo existe antes de operar.
   *
   * @throws NotFoundException si no existe ninguna pantalla con ese ID
   */
  async findById(id: string) {
    const pantalla = await this.pantallasRepository.findById(id);
    if (!pantalla) {
      throw new NotFoundException(`Pantalla con id "${id}" no encontrada`);
    }
    return pantalla;
  }

  /**
   * update — Actualiza una pantalla con validación de existencia y unicidad de ruta
   *
   * Flujo:
   *   1. Verifica que la pantalla exista → 404 si no
   *   2. Si el DTO incluye nueva ruta, verifica que no esté usada por OTRA pantalla
   *      (existing.id !== id permite conservar la misma ruta en la misma pantalla)
   *   3. Ejecuta la actualización
   */
  async update(id: string, dto: UpdatePantallaDto) {
    // Garantiza existencia antes de actualizar (lanza 404 si no existe)
    await this.findById(id);

    // Solo verifica conflicto de ruta si el DTO incluye una nueva ruta
    if (dto.ruta) {
      const existing = await this.pantallasRepository.findByRuta(dto.ruta);
      // existing.id !== id: es válido si la misma pantalla conserva su ruta
      if (existing && existing.id !== id) {
        throw new ConflictException(`Ya existe una pantalla con la ruta "${dto.ruta}"`);
      }
    }

    return this.pantallasRepository.update(id, dto);
  }

  /**
   * remove — Elimina una pantalla verificando que exista primero
   * Retorna un mensaje de confirmación en lugar del objeto eliminado.
   *
   * @throws NotFoundException si la pantalla no existe
   */
  async remove(id: string) {
    await this.findById(id); // lanza 404 si no existe
    await this.pantallasRepository.remove(id);
    return { message: `Pantalla con id "${id}" eliminada correctamente` };
  }
}
