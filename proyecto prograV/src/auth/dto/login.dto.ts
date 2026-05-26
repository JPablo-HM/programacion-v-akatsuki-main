/**
 * login.dto.ts — Data Transfer Object para el endpoint POST /auth/login
 *
 * Define exactamente qué campos acepta el endpoint de login y aplica
 * validaciones automáticas usando class-validator y class-transformer.
 *
 * El ValidationPipe en main.ts aplica estas validaciones antes de que
 * el request llegue al controller. Si algún campo falla, responde 400
 * automáticamente con los mensajes de error definidos aquí.
 *
 * @Transform permite normalizar los datos de entrada (trim, uppercase)
 * antes de que las validaciones se ejecuten.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  /**
   * usuario — puede ser el email o el username del usuario
   * El servicio busca en ambos campos de la BD.
   * @Transform aplica trim() para eliminar espacios accidentales
   */
  @ApiProperty({
    example: 'admin@cuc.edu.co',
    description: 'Email o nombre de usuario',
  })
  @IsNotEmpty({ message: 'El usuario o email no puede estar vacío' })
  @IsString({ message: 'El usuario debe ser texto' })
  @Transform(({ value }) => value?.toString().trim()) // elimina espacios al inicio/fin
  usuario: string;

  /**
   * password — contraseña en texto plano
   * Se compara con el hash bcrypt en la BD — nunca se almacena sin hashear
   * MinLength de 6 como validación mínima de complejidad
   */
  @ApiProperty({
    example: 'Admin@2024!',
    description: 'Contraseña del usuario',
  })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  /**
   * tipoUsuario — rol del usuario: ADMIN, ESTUDIANTE o FUNCIONARIO
   * @Transform convierte automáticamente a mayúsculas, así el usuario
   * puede enviar 'admin', 'Admin' o 'ADMIN' y siempre funciona
   */
  @ApiProperty({
    example: 'ADMIN',
    description: 'Tipo de usuario: ADMIN | ESTUDIANTE | FUNCIONARIO',
    enum: ['ADMIN', 'ESTUDIANTE', 'FUNCIONARIO'],
  })
  @IsNotEmpty({ message: 'El tipo de usuario no puede estar vacío' })
  @IsString({ message: 'El tipo de usuario debe ser texto' })
  @Transform(({ value }) => value?.toString().trim().toUpperCase())
  tipoUsuario: string;
}
