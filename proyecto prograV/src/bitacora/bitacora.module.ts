/**
 * bitacora.module.ts — Módulo de bitácora de auditoría (SRV9)
 *
 * Agrupa y conecta todos los componentes del dominio de bitácora:
 *   - BitacoraController: define los endpoints HTTP de consulta y registro
 *   - BitacoraService:    lógica de negocio (extracción de IP, 404, paginación)
 *   - BitacoraRepository: acceso a la tabla bitacora vía Prisma
 *
 * Importa AuthModule para poder usar JwtAuthGuard en el controlador.
 * AuthModule exporta JwtAuthGuard, JwtModule y PassportModule, que son
 * los tres ingredientes que Passport necesita para validar tokens JWT.
 *
 * BitacoraService se exporta para que otros módulos puedan registrar
 * eventos de auditoría inyectando el servicio (ej: AuthModule podría
 * registrar cada login en la bitácora sin exponer el repositorio).
 */

import { Module } from '@nestjs/common';
import { BitacoraController } from './bitacora.controller';
import { BitacoraService } from './bitacora.service';
import { BitacoraRepository } from './bitacora.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],  // necesario para que JwtAuthGuard funcione en el controller
  controllers: [BitacoraController],
  providers: [BitacoraService, BitacoraRepository],
  exports: [BitacoraService], // disponible para módulos que quieran registrar auditoría
})
export class BitacoraModule {}
