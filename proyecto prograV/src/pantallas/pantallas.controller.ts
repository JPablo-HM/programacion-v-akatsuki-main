/**
 * pantallas.controller.ts — Controlador de pantallas (SRV7)
 *
 * Define el CRUD completo de pantallas bajo la ruta /api/v1/pantallas.
 * Todos los endpoints requieren autenticación JWT (JwtAuthGuard aplicado a nivel de clase).
 *
 * Endpoints:
 *   POST   /api/v1/pantallas         → crear pantalla (201)
 *   GET    /api/v1/pantallas         → listar todas (200)
 *   GET    /api/v1/pantallas/:id     → obtener por ID (200 / 404)
 *   PUT    /api/v1/pantallas/:id     → actualizar (200 / 404 / 409)
 *   DELETE /api/v1/pantallas/:id     → eliminar (200 / 404)
 *
 * @UseGuards(JwtAuthGuard) a nivel de clase protege TODOS los métodos.
 * @ApiBearerAuth('JWT-auth') indica en Swagger que se necesita token Bearer.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';

import { PantallasService } from './pantallas.service';
import { CreatePantallaDto } from './dto/create-pantalla.dto';
import { UpdatePantallaDto } from './dto/update-pantalla.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('pantallas')           // agrupa estos endpoints bajo "pantallas" en Swagger
@ApiBearerAuth('JWT-auth')      // indica que todos requieren Bearer token
@UseGuards(JwtAuthGuard)        // protege toda la clase — equivale a poner el guard en cada método
@Controller('pantallas')        // prefijo /pantallas (el global prefix agrega /api/v1)
export class PantallasController {
  constructor(private readonly pantallasService: PantallasService) {}

  // ──────────────────────────────────────────────────────────
  // POST /api/v1/pantallas
  // ──────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED) // responde 201 en creaciones exitosas
  @ApiOperation({ summary: 'Crear nueva pantalla' })
  @ApiResponse({ status: 201, description: 'Pantalla creada' })
  @ApiResponse({ status: 409, description: 'Ruta ya existe' })
  create(@Body() dto: CreatePantallaDto) {
    // @Body() inyecta el cuerpo del request ya validado por ValidationPipe global
    return this.pantallasService.create(dto);
  }

  // ──────────────────────────────────────────────────────────
  // GET /api/v1/pantallas
  // ──────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Obtener todas las pantallas' })
  @ApiResponse({ status: 200, description: 'Lista de pantallas' })
  findAll() {
    return this.pantallasService.findAll();
  }

  // ──────────────────────────────────────────────────────────
  // GET /api/v1/pantallas/:id
  // ──────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Obtener pantalla por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la pantalla' })
  @ApiResponse({ status: 200, description: 'Pantalla encontrada' })
  @ApiResponse({ status: 404, description: 'Pantalla no encontrada' })
  findOne(@Param('id') id: string) {
    // @Param('id') extrae el segmento :id de la URL
    return this.pantallasService.findById(id);
  }

  // ──────────────────────────────────────────────────────────
  // PUT /api/v1/pantallas/:id
  // ──────────────────────────────────────────────────────────

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar pantalla por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la pantalla' })
  @ApiResponse({ status: 200, description: 'Pantalla actualizada' })
  @ApiResponse({ status: 404, description: 'Pantalla no encontrada' })
  update(@Param('id') id: string, @Body() dto: UpdatePantallaDto) {
    return this.pantallasService.update(id, dto);
  }

  // ──────────────────────────────────────────────────────────
  // DELETE /api/v1/pantallas/:id
  // ──────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK) // 200 con mensaje de confirmación (no 204 porque retorna body)
  @ApiOperation({ summary: 'Eliminar pantalla por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la pantalla' })
  @ApiResponse({ status: 200, description: 'Pantalla eliminada' })
  @ApiResponse({ status: 404, description: 'Pantalla no encontrada' })
  remove(@Param('id') id: string) {
    return this.pantallasService.remove(id);
  }
}
