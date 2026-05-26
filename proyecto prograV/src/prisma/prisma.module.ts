/**
 * prisma.module.ts — Módulo de base de datos (global)
 *
 * @Global hace que PrismaService esté disponible en TODA la aplicación
 * sin necesidad de importar PrismaModule en cada módulo individual.
 * Solo se importa una vez aquí en AppModule y se puede inyectar
 * en cualquier repositorio o servicio del proyecto.
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // disponible en toda la app sin reimportar
@Module({
  providers: [PrismaService], // registra el servicio en el contenedor DI
  exports:   [PrismaService], // lo hace inyectable en otros módulos
})
export class PrismaModule {}
