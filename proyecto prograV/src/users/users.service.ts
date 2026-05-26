/**
 * users.service.ts — Servicio de usuarios
 *
 * Capa de lógica de negocio para operaciones sobre usuarios.
 * Actúa como intermediario entre los controladores y el repositorio,
 * añadiendo validaciones que van más allá del simple acceso a datos.
 *
 * Actualmente expone dos operaciones:
 *   - findById:    busca por UUID, lanza 404 si no existe
 *   - findByEmail: busca por email, lanza 404 si no existe
 *
 * El servicio lanza NotFoundException en lugar de retornar null,
 * lo que simplifica el código en los controladores (no necesitan verificar null).
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * findById — Busca un usuario por UUID y lanza 404 si no existe
   * Versión "segura" de UsersRepository.findById: garantiza que siempre
   * retorna un usuario válido o lanza una excepción HTTP.
   *
   * @param id — UUID del usuario
   * @throws NotFoundException si no existe ningún usuario con ese ID
   */
  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    return user;
  }

  /**
   * findByEmail — Busca un usuario por email y lanza 404 si no existe
   * Nota: este método sí revela que el email no existe (404).
   * Solo debería usarse en contextos administrativos, no en login.
   * Para login, AuthService usa UsersRepository.findByEmailOrUsername directamente
   * con mensajes genéricos.
   *
   * @param email — dirección de email del usuario
   * @throws NotFoundException si no existe ningún usuario con ese email
   */
  async findByEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) throw new NotFoundException(`Usuario con email ${email} no encontrado`);
    return user;
  }
}
