/**
 * auth.module.ts — Módulo de autenticación (SRV1)
 *
 * Registra y conecta todos los componentes de autenticación:
 *   - JwtModule: configurado con el secreto y expiración del .env
 *   - PassportModule: framework de autenticación con estrategia jwt por defecto
 *   - JwtStrategy: valida tokens entrantes
 *   - JwtAuthGuard: protege endpoints
 *   - RefreshTokenRepository: acceso a la tabla refresh_tokens
 *   - UsersModule: importado para poder inyectar UsersRepository en AuthService
 *
 * Exporta JwtAuthGuard, JwtModule y PassportModule para que otros módulos
 * (PantallasModule, BitacoraModule) puedan usar el guard sin reimportar todo.
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController }         from './auth.controller';
import { AuthService }            from './auth.service';
import { JwtStrategy }            from './strategies/jwt.strategy';
import { JwtAuthGuard }           from './guards/jwt-auth.guard';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { UsersModule }            from '../users/users.module';

@Module({
  imports: [
    // Registra Passport con 'jwt' como estrategia por defecto
    // Así no hay que especificar la estrategia en cada AuthGuard
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JwtModule.registerAsync permite usar ConfigService para leer el .env
    // (no se puede usar de forma síncrona porque ConfigModule carga async)
    JwtModule.registerAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:      configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn', '5m'),
        },
      }),
    }),

    // UsersModule exporta UsersRepository que AuthService necesita para
    // buscar el usuario durante login y refresh
    UsersModule,
  ],

  controllers: [AuthController],

  providers: [
    AuthService,             // lógica de negocio: login, refresh, validate
    JwtStrategy,             // estrategia Passport que valida el JWT entrante
    JwtAuthGuard,            // guard que aplica la estrategia jwt a los endpoints
    RefreshTokenRepository,  // acceso a la tabla refresh_tokens en MySQL
  ],

  // Exportamos estos para que PantallasModule y BitacoraModule puedan
  // usar @UseGuards(JwtAuthGuard) importando AuthModule
  exports: [JwtAuthGuard, JwtModule, PassportModule],
})
export class AuthModule {}
