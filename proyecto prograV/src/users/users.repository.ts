/**
 * users.repository.ts — Repositorio de usuarios
 *
 * Encapsula todas las consultas a la tabla usuarios en la base de datos.
 * AuthService usa este repositorio para buscar usuarios durante login y refresh.
 * UsersService lo usa para operaciones de negocio (buscar por ID, email, etc.).
 *
 * Patrón Repository: la lógica de negocio no necesita saber cómo se construyen
 * las consultas Prisma. Si migrara a otro ORM, solo habría que modificar este archivo.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Constante que define qué relaciones se cargan junto al usuario.
// Se reutiliza en todos los métodos para evitar repetición (DRY).
// tipoUsuario: carga el rol del usuario (ADMIN, ESTUDIANTE, etc.)
// instituciones: carga la tabla pivote UsuarioInstitucion con la institución anidada
const USER_WITH_RELATIONS = {
  tipoUsuario: true,
  instituciones: {
    include: { institucion: true },
  },
} as const;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * findById — Busca un usuario por su UUID primario
   * Se usa en AuthService.refresh() para cargar datos actualizados del usuario
   * después de validar el refresh token.
   *
   * @param id — UUID del usuario
   * @returns usuario con relaciones o null si no existe
   */
  async findById(id: string) {
    return this.prisma.usuario.findUnique({
      where: { id },
      include: USER_WITH_RELATIONS,
    });
  }

  /**
   * findByEmail — Busca un usuario por su dirección de email (único en BD)
   * Útil para operaciones administrativas donde se conoce el email exacto.
   *
   * @param email — email del usuario
   */
  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
      include: USER_WITH_RELATIONS,
    });
  }

  /**
   * findByUsername — Busca un usuario por su username (único en BD)
   * Complementa findByEmail cuando el identificador es el nombre de usuario.
   *
   * @param username — nombre de usuario único
   */
  async findByUsername(username: string) {
    return this.prisma.usuario.findUnique({
      where: { username },
      include: USER_WITH_RELATIONS,
    });
  }

  /**
   * findByEmailOrUsername — Busca un usuario por email O username en una sola consulta
   * Se usa en AuthService.login() donde el campo "usuario" del LoginDto puede ser
   * cualquiera de los dos. findFirst con OR permite buscar ambos en una sola query.
   *
   * Ejemplo: si dto.usuario = "juan123", busca { email: "juan123" } OR { username: "juan123" }
   *
   * @param identifier — puede ser email o username
   */
  async findByEmailOrUsername(identifier: string) {
    return this.prisma.usuario.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
      include: USER_WITH_RELATIONS,
    });
  }

  /**
   * findAll — Retorna todos los usuarios ordenados por fecha de creación (más nuevo primero)
   * Útil para paneles administrativos.
   */
  async findAll() {
    return this.prisma.usuario.findMany({
      include: USER_WITH_RELATIONS,
      orderBy: { createdAt: 'desc' },
    });
  }
}
