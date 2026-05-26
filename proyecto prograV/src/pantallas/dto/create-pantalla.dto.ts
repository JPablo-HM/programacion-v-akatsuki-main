/**
 * create-pantalla.dto.ts — DTO para crear una pantalla (SRV7)
 *
 * Define y valida los datos requeridos para registrar una nueva pantalla
 * en el sistema. Cada campo incluye:
 *   - Validación con class-validator (@IsNotEmpty, @IsString, etc.)
 *   - Normalización con @Transform (trim, lowercase)
 *   - Documentación Swagger con @ApiProperty
 *
 * La ruta debe ser única en la BD — el servicio verifica esto antes de insertar.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreatePantallaDto {
  // Nombre visible de la pantalla. Acepta letras, números, espacios, guiones y underscores.
  // Se normaliza con trim() para eliminar espacios al inicio y al final.
  @ApiProperty({ example: 'Dashboard', description: 'Nombre de la pantalla' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_]+$/, {
    message: 'El nombre solo puede contener letras, números, espacios, guiones y guiones bajos',
  })
  @Transform(({ value }) => value?.trim())
  nombre: string;

  // Descripción opcional de la pantalla. Se hace trim para limpiar espacios.
  @ApiPropertyOptional({ example: 'Pantalla principal del sistema' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  descripcion?: string;

  // Ruta de navegación de la pantalla (ej: /dashboard, /admin/usuarios).
  // Debe comenzar con / y solo contener caracteres URL-seguros.
  // Se normaliza a minúsculas con trim+toLowerCase para consistencia.
  // Es el campo único — no puede haber dos pantallas con la misma ruta.
  @ApiProperty({ example: '/dashboard', description: 'Ruta de la pantalla (única)' })
  @IsNotEmpty({ message: 'La ruta no puede estar vacía' })
  @IsString()
  @MaxLength(200)
  @Matches(/^\/[a-zA-Z0-9\-_/]*$/, {
    message: 'La ruta debe comenzar con / y solo contener letras, números, guiones y barras',
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  ruta: string;
}
