/**
 * auth.controller.ts — Controlador de autenticación (SRV1)
 *
 * Define los tres endpoints de autenticación:
 *   POST /auth/login    → autenticar y obtener tokens
 *   POST /auth/refresh  → renovar tokens con refresh_token
 *   GET  /auth/validate → verificar si el access_token es válido
 *
 * Los decoradores @Public() y @RawResponse() son clave aquí:
 *   - @Public()      → exime de requerir JWT (login y refresh son públicos)
 *   - @RawResponse() → evita que ResponseInterceptor envuelva la respuesta
 *     (auth retorna su propio formato, no el envoltorio { success, data, timestamp })
 *
 * Los decoradores de Swagger (@ApiTags, @ApiOperation, @ApiResponse)
 * generan la documentación automática en /api/docs.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

import { AuthService }                         from './auth.service';
import { LoginDto }                            from './dto/login.dto';
import { RefreshTokenDto }                     from './dto/refresh-token.dto';
import { AuthResponseDto, RefreshResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard }                        from './guards/jwt-auth.guard';
import { Public }                              from '../common/decorators/public.decorator';
import { RawResponse }                         from '../common/decorators/raw-response.decorator';
import { CurrentUser }                         from '../common/decorators/current-user.decorator';
import { JwtPayload }                          from '../shared/types/jwt-payload.type';

@ApiTags('auth')          // agrupa estos endpoints bajo "auth" en Swagger
@Controller('auth')       // prefijo de ruta: /auth (el global prefix agrega /api/v1)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ──────────────────────────────────────────────────────────
  // POST /api/v1/auth/login
  // ──────────────────────────────────────────────────────────

  @Public()       // no requiere JWT — es el endpoint que emite el primer token
  @RawResponse()  // retorna exactamente lo que devuelve AuthService.login()
  @Post('login')
  @HttpCode(HttpStatus.CREATED) // responde 201 en vez del 200 por defecto de POST
  @ApiOperation({ summary: 'Autenticar usuario y obtener tokens JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Login exitoso',                type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas'                              })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos (campos vacíos, etc.)'    })
  @ApiResponse({ status: 429, description: 'Demasiadas solicitudes — rate limit superado'        })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    // @Body() inyecta el body del request ya validado por ValidationPipe
    return this.authService.login(dto);
  }

  // ──────────────────────────────────────────────────────────
  // POST /api/v1/auth/refresh
  // ──────────────────────────────────────────────────────────

  @Public()       // no requiere access_token — el refresh_token es la credencial
  @RawResponse()  // retorna exactamente { expires_in, access_token, refresh_token }
  @Post('refresh')
  @HttpCode(HttpStatus.OK) // responde 200
  @ApiOperation({ summary: 'Renovar access token mediante refresh token (rotación)' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Tokens renovados exitosamente', type: RefreshResponseDto })
  @ApiResponse({ status: 401, description: 'Refresh token inválido, revocado o expirado'            })
  async refresh(@Body() dto: RefreshTokenDto): Promise<RefreshResponseDto> {
    return this.authService.refresh(dto);
  }

  // ──────────────────────────────────────────────────────────
  // GET /api/v1/auth/validate
  // ──────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard) // este endpoint SÍ requiere JWT (el guard verifica el token)
  @RawResponse()            // retorna directamente: true
  @Get('validate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth') // indica en Swagger que este endpoint requiere Bearer token
  @ApiOperation({ summary: 'Validar si el access token JWT es válido' })
  @ApiResponse({ status: 200, description: 'Token válido → responde: true'       })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado → 401'     })
  validate(
    // @CurrentUser() extrae el payload del JWT desde request.user
    // poblado por JwtStrategy.validate() cuando el guard pasó exitosamente
    @CurrentUser() user: JwtPayload,
  ): boolean {
    return this.authService.validateToken(user);
  }
}
