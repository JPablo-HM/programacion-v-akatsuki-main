/**
 * create-bitacora.dto.ts — DTO para registrar una entrada de auditoría (SRV9)
 *
 * Define los campos necesarios para crear un registro en la bitácora del sistema.
 * La bitácora es un log de auditoría: registra qué usuario hizo qué acción y cuándo.
 *
 * Campos:
 *   - usuarioId:   quién realizó la acción (UUID del usuario)
 *   - descripcion: texto libre que explica lo ocurrido
 *   - accion:      código de acción normalizado a mayúsculas (LOGIN, LOGOUT, CREATE, etc.)
 *   - ip:          dirección IP del cliente (opcional — puede no estar disponible)
 *
 * La fecha (fecha) no está en el DTO porque se genera automáticamente en la BD
 * mediante @default(now()) en el schema Prisma.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateBitacoraDto {
  // ID del usuario que ejecutó la acción — no es opcional, siempre debe haber un actor
  @ApiProperty({ example: 'uuid-del-usuario', description: 'ID del usuario que ejecuta la acción' })
  @IsNotEmpty({ message: 'El usuarioId no puede estar vacío' })
  @IsString()
  usuarioId: string;

  // Descripción legible de lo que ocurrió. Se limpia con trim().
  // Ejemplo: "El usuario inició sesión en el sistema"
  @ApiProperty({ example: 'El usuario inició sesión en el sistema' })
  @IsNotEmpty({ message: 'La descripción no puede estar vacía' })
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  descripcion: string;

  // Código de la acción normalizado a mayúsculas.
  // Convención: usar verbos en inglés (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW, etc.)
  // @Transform lo normaliza automáticamente: "login" → "LOGIN"
  @ApiProperty({ example: 'LOGIN', description: 'Tipo de acción realizada' })
  @IsNotEmpty({ message: 'La acción no puede estar vacía' })
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim().toUpperCase())
  accion: string;

  // IP del cliente — opcional porque puede no estar disponible en todas las peticiones.
  // BitacoraService.registrarDesdeRequest() extrae la IP del request automáticamente.
  @ApiPropertyOptional({ example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  ip?: string;
}
