/**
 * bitacora.controller.ts — Controlador de bitácora de auditoría (SRV9)
 *
 * Define los endpoints para registrar y consultar eventos de auditoría.
 * Todos los endpoints requieren autenticación JWT (JwtAuthGuard a nivel de clase).
 *
 * Endpoints:
 *   POST /api/v1/bitacora                       → registrar evento (201)
 *   GET  /api/v1/bitacora?page=1&limit=20        → listar paginado (200)
 *   GET  /api/v1/bitacora/usuario/:usuarioId     → historial de usuario (200)
 *   GET  /api/v1/bitacora/:id                    → registro específico (200 / 404)
 *
 * Nota: el orden de rutas importa en NestJS.
 * GET /usuario/:usuarioId debe definirse ANTES de GET /:id para que NestJS
 * no interprete "usuario" como un :id al hacer matching de rutas.
 *
 * @UseGuards(JwtAuthGuard) protege toda la clase — todos los endpoints requieren token.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { BitacoraService } from './bitacora.service';
import { CreateBitacoraDto } from './dto/create-bitacora.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('bitacora')          // agrupa estos endpoints bajo "bitacora" en Swagger
@ApiBearerAuth('JWT-auth')    // indica que todos requieren Bearer token en Swagger UI
@UseGuards(JwtAuthGuard)      // protege toda la clase con validación JWT
@Controller('bitacora')       // prefijo /bitacora (el global prefix agrega /api/v1)
export class BitacoraController {
  constructor(private readonly bitacoraService: BitacoraService) {}

  // ──────────────────────────────────────────────────────────
  // POST /api/v1/bitacora
  // ──────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED) // 201 para creaciones exitosas
  @ApiOperation({ summary: 'Registrar una entrada en bitácora' })
  @ApiResponse({ status: 201, description: 'Registro creado' })
  registrar(@Body() dto: CreateBitacoraDto) {
    // @Body() inyecta el body validado por ValidationPipe
    return this.bitacoraService.registrar(dto);
  }

  // ──────────────────────────────────────────────────────────
  // GET /api/v1/bitacora?page=1&limit=20
  // ──────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Obtener todos los registros de bitácora (paginado)' })
  @ApiQuery({ name: 'page',  required: false, example: 1  }) // parámetros opcionales de paginación
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de registros' })
  findAll(
    @Query('page')  page  = 1,   // @Query extrae query params de la URL
    @Query('limit') limit = 20,
  ) {
    // Number() convierte los strings de query a números (los query params siempre son strings)
    return this.bitacoraService.findAll(Number(page), Number(limit));
  }

  // ──────────────────────────────────────────────────────────
  // GET /api/v1/bitacora/usuario/:usuarioId
  // IMPORTANTE: debe ir ANTES de /:id para que NestJS no confunda "usuario" con un :id
  // ──────────────────────────────────────────────────────────

  @Get('usuario/:usuarioId')
  @ApiOperation({ summary: 'Obtener bitácora de un usuario específico' })
  @ApiParam({ name: 'usuarioId', description: 'UUID del usuario' })
  findByUsuario(@Param('usuarioId') usuarioId: string) {
    return this.bitacoraService.findByUsuario(usuarioId);
  }

  // ──────────────────────────────────────────────────────────
  // GET /api/v1/bitacora/:id
  // ──────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Obtener registro de bitácora por ID' })
  @ApiParam({ name: 'id', description: 'UUID del registro' })
  @ApiResponse({ status: 200, description: 'Registro encontrado' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  findOne(@Param('id') id: string) {
    return this.bitacoraService.findById(id);
  }
}
