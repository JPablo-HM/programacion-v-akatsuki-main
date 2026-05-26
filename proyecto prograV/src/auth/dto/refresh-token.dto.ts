/**
 * refresh-token.dto.ts — DTO para el endpoint POST /auth/refresh
 *
 * Recibe el refresh_token opaco (UUID v4) previamente emitido por el login.
 * Este token se busca en la tabla refresh_tokens de la BD para verificar
 * que no esté revocado ni expirado.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  /**
   * refresh_token — UUID v4 generado por el sistema en el login
   * Se envía como string opaco; el servidor lo valida contra la BD.
   * No es un JWT sino un identificador único almacenado en BD.
   */
  @ApiProperty({
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    description: 'Refresh token previamente emitido por /auth/login',
  })
  @IsNotEmpty({ message: 'El refresh_token no puede estar vacío' })
  @IsString({ message: 'El refresh_token debe ser texto' })
  refresh_token: string;
}
