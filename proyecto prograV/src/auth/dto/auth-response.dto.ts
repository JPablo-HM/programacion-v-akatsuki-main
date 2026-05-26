/**
 * auth-response.dto.ts — DTOs de respuesta de los endpoints de autenticación
 *
 * Define la forma exacta de los objetos que retornan los endpoints de auth.
 * Los decoradores @ApiProperty documentan automáticamente los campos en Swagger.
 *
 * Estos DTOs se usan con @RawResponse() porque retornan directamente
 * sin pasar por el envoltorio del ResponseInterceptor.
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * InstitutionDto — Datos de una institución incluida en la respuesta de login
 * Cada usuario puede pertenecer a una o más instituciones.
 */
export class InstitutionDto {
  @ApiProperty({ example: 'uuid-string', description: 'ID único de la institución' })
  id: string;

  @ApiProperty({ example: 'Corporación Universidad de la Costa' })
  nombre: string;

  @ApiProperty({ example: 'CUC', description: 'Código corto identificador' })
  codigo: string;
}

/**
 * AuthResponseDto — Respuesta completa del endpoint POST /auth/login
 * Contiene ambos tokens y los datos del usuario autenticado.
 */
export class AuthResponseDto {
  @ApiProperty({ example: '300', description: 'Tiempo de vida del access_token en segundos' })
  expires_in: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT firmado para autenticar requests' })
  access_token: string;

  @ApiProperty({ example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', description: 'UUID para renovar el access_token cuando expire' })
  refresh_token: string;

  @ApiProperty({ example: 'uuid-string', description: 'ID del usuario autenticado' })
  usuarioID: string;

  @ApiProperty({ type: [InstitutionDto], description: 'Instituciones a las que pertenece el usuario' })
  institutions: InstitutionDto[];
}

/**
 * RefreshResponseDto — Respuesta del endpoint POST /auth/refresh
 * Solo retorna los nuevos tokens (el usuarioID e instituciones ya los tiene el cliente).
 */
export class RefreshResponseDto {
  @ApiProperty({ example: '300', description: 'Tiempo de vida del nuevo access_token en segundos' })
  expires_in: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Nuevo JWT de acceso' })
  access_token: string;

  @ApiProperty({ example: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', description: 'Nuevo refresh_token (el anterior queda revocado)' })
  refresh_token: string;
}
