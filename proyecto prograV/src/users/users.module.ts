/**
 * users.module.ts — Módulo de usuarios
 *
 * Agrupa y expone los componentes del dominio de usuarios:
 *   - UsersService:    lógica de negocio con manejo de 404
 *   - UsersRepository: acceso directo a la BD vía Prisma
 *
 * Ambos se exportan porque:
 *   - AuthModule importa UsersModule para que AuthService pueda inyectar
 *     UsersRepository directamente (necesita el OR query de findByEmailOrUsername)
 *   - Otros módulos futuros pueden importar UsersModule para acceder a UsersService
 *
 * PrismaService no necesita importarse aquí porque PrismaModule está decorado
 * con @Global() en prisma.module.ts — está disponible en toda la aplicación.
 */

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

@Module({
  providers: [UsersService, UsersRepository],
  // Exportamos ambos: AuthService usa Repository, otros módulos usan Service
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
