/**
 * pantallas.module.ts — Módulo de pantallas (SRV7)
 *
 * Agrupa y conecta todos los componentes del dominio de pantallas:
 *   - PantallasController: define los endpoints HTTP del CRUD
 *   - PantallasService:    lógica de negocio (validaciones, 404, 409)
 *   - PantallasRepository: acceso a la tabla pantallas vía Prisma
 *
 * Importa AuthModule para poder usar JwtAuthGuard en el controlador.
 * AuthModule exporta JwtAuthGuard, JwtModule y PassportModule, que son
 * los tres ingredientes que Passport necesita para validar tokens JWT.
 *
 * PantallasService se exporta por si otros módulos necesitan consultar
 * pantallas (ej: un módulo de permisos que asocie usuarios a pantallas).
 */

import { Module } from '@nestjs/common';
import { PantallasController } from './pantallas.controller';
import { PantallasService } from './pantallas.service';
import { PantallasRepository } from './pantallas.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],  // necesario para que JwtAuthGuard funcione en el controller
  controllers: [PantallasController],
  providers: [PantallasService, PantallasRepository],
  exports: [PantallasService], // disponible para módulos que importen PantallasModule
})
export class PantallasModule {}
