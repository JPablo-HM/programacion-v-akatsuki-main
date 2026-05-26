/**
 * update-pantalla.dto.ts — DTO para actualizar una pantalla (SRV7)
 *
 * Extiende CreatePantallaDto usando PartialType de @nestjs/swagger,
 * lo que hace que todos los campos de CreatePantallaDto sean opcionales.
 * Esto permite actualizaciones parciales (PATCH-style aunque use PUT):
 * el cliente solo envía los campos que quiere modificar.
 *
 * Añade el campo `activo` que no existe en el DTO de creación,
 * porque las pantallas se crean activas por defecto (el schema Prisma
 * tiene activo @default(true)) y solo se desactivan al editar.
 */

import { PartialType } from '@nestjs/swagger';
import { CreatePantallaDto } from './create-pantalla.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePantallaDto extends PartialType(CreatePantallaDto) {
  // Permite activar o desactivar la pantalla sin eliminarla.
  // Soft-disable: la pantalla sigue en la BD pero puede excluirse de la UI.
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
