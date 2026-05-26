/**
 * prisma.service.ts — Servicio de conexión a la base de datos
 *
 * Extiende PrismaClient para integrarlo con el ciclo de vida de NestJS.
 * Al ser @Injectable y @Global (ver prisma.module.ts), cualquier
 * repositorio del proyecto puede inyectarlo sin importar PrismaModule.
 *
 * Implementa OnModuleInit y OnModuleDestroy para conectar y desconectar
 * limpiamente cuando el servidor inicia o se detiene.
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Configura el nivel de logging de Prisma:
    // - 'query': loguea cada SQL que Prisma genera (útil en debug)
    // - 'info', 'warn', 'error': mensajes del motor de BD
    super({
      log: [
        { emit: 'event',  level: 'query' },
        { emit: 'stdout', level: 'info'  },
        { emit: 'stdout', level: 'warn'  },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  /**
   * onModuleInit — Se ejecuta automáticamente cuando NestJS
   * termina de inicializar el módulo PrismaModule.
   * Abre la conexión al pool de MySQL.
   */
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conexión a base de datos establecida');
  }

  /**
   * onModuleDestroy — Se ejecuta cuando el servidor se apaga
   * (Ctrl+C, SIGTERM, etc.). Cierra el pool de conexiones
   * limpiamente para no dejar conexiones huérfanas en MySQL.
   */
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Conexión a base de datos cerrada');
  }

  /**
   * cleanDatabase — Limpia todas las tablas de la base de datos.
   * SOLO para uso en tests o ambiente de desarrollo.
   * Lanza un error en producción para evitar borrado accidental.
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase no está permitido en producción');
    }
    // Obtiene todos los nombres de tablas existentes
    const tablenames = await this.$queryRaw<Array<{ Tables_in_db: string }>>`
      SHOW TABLES
    `;
    // Vacía cada tabla con TRUNCATE (más rápido que DELETE FROM)
    for (const { Tables_in_db: tableName } of tablenames) {
      await this.$executeRawUnsafe(`TRUNCATE TABLE \`${tableName}\``);
    }
  }
}
