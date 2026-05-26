# Carnet Digital CUC — Backend API

Microservicio de autenticación enterprise desarrollado con **NestJS + Prisma + MySQL + JWT**.

---

## Stack tecnológico

| Tecnología        | Versión  | Uso                          |
|-------------------|----------|------------------------------|
| NestJS            | ^10      | Framework backend             |
| TypeScript        | ^5       | Lenguaje                      |
| Prisma ORM        | ^5       | ORM + migraciones             |
| MySQL             | 8.0+     | Base de datos                 |
| JWT / Passport    | —        | Autenticación                 |
| bcrypt            | ^5       | Hash de contraseñas           |
| Swagger/OpenAPI   | ^7       | Documentación                 |
| Winston           | ^3       | Logging                       |
| class-validator   | ^0.14    | Validación de DTOs            |
| @nestjs/throttler | ^5       | Rate limiting                 |
| helmet            | ^7       | Cabeceras de seguridad        |

---

## Arquitectura de carpetas

```
src/
├── auth/                    # SRV1 — Login, Refresh, Validate
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   └── auth-response.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── repositories/
│   │   └── refresh-token.repository.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
│
├── users/                   # Módulo de usuarios (base para SRV10)
│   ├── users.repository.ts
│   ├── users.service.ts
│   └── users.module.ts
│
├── pantallas/               # SRV7 — CRUD pantallas (preparado)
│   ├── dto/
│   ├── pantallas.repository.ts
│   ├── pantallas.service.ts
│   ├── pantallas.controller.ts
│   └── pantallas.module.ts
│
├── bitacora/                # SRV9 — Auditoría (preparado)
│   ├── dto/
│   ├── bitacora.repository.ts
│   ├── bitacora.service.ts
│   ├── bitacora.controller.ts
│   └── bitacora.module.ts
│
├── common/
│   ├── decorators/          # @CurrentUser, @Roles, @Public, @RawResponse
│   ├── filters/             # AllExceptionsFilter
│   ├── interceptors/        # ResponseInterceptor, LoggingInterceptor
│   └── middleware/          # LoggerMiddleware
│
├── config/
│   ├── app.config.ts
│   ├── jwt.config.ts
│   └── winston.config.ts
│
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts
│
├── shared/
│   ├── types/               # JwtPayload, ApiResponse
│   └── utils/               # bcrypt.util, date.util
│
├── app.module.ts
└── main.ts

prisma/
├── schema.prisma
└── seed.ts

database/
└── init.sql
```

---

## Configuración inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales MySQL
```

### 3. Crear base de datos MySQL

Opción A — usando el script SQL:
```sql
mysql -u root -p < database/init.sql
```

Opción B — solo crear la DB (Prisma crea las tablas):
```sql
CREATE DATABASE carnet_digital_cuc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Ejecutar migraciones

```bash
npm run prisma:migrate:dev
```

### 5. Generar Prisma Client

```bash
npm run prisma:generate
```

### 6. Cargar datos de prueba (seed)

```bash
npm run prisma:seed
```

**Credenciales creadas:**

| Email                      | Password           | Tipo        |
|----------------------------|--------------------|-------------|
| admin@cuc.edu.co           | Admin@2024!        | ADMIN       |
| estudiante@cuc.edu.co      | Estudiante@2024!   | ESTUDIANTE  |
| funcionario@cuc.edu.co     | Funcionario@2024!  | FUNCIONARIO |

### 7. Iniciar servidor

```bash
# Desarrollo (watch mode)
npm run start:dev

# Producción
npm run build
npm run start:prod
```

---

## Endpoints disponibles

| Método | Ruta                     | Auth | Descripción                        |
|--------|--------------------------|------|------------------------------------|
| POST   | /api/v1/auth/login       | No   | Login → JWT + Refresh Token        |
| POST   | /api/v1/auth/refresh     | No   | Rotar tokens                       |
| GET    | /api/v1/auth/validate    | JWT  | Validar token → true               |
| POST   | /api/v1/pantallas        | JWT  | Crear pantalla                     |
| GET    | /api/v1/pantallas        | JWT  | Listar pantallas                   |
| GET    | /api/v1/pantallas/:id    | JWT  | Obtener pantalla por ID            |
| PUT    | /api/v1/pantallas/:id    | JWT  | Actualizar pantalla                |
| DELETE | /api/v1/pantallas/:id    | JWT  | Eliminar pantalla                  |
| POST   | /api/v1/bitacora         | JWT  | Registrar en bitácora              |
| GET    | /api/v1/bitacora         | JWT  | Listar bitácora (paginado)         |
| GET    | /api/v1/bitacora/:id     | JWT  | Obtener registro por ID            |
| GET    | /api/v1/bitacora/usuario/:id | JWT | Bitácora por usuario           |

---

## Swagger / OpenAPI

Disponible en: `http://localhost:3000/api/docs`

1. Ir a `POST /auth/login`
2. Ejecutar con las credenciales de prueba
3. Copiar el `access_token`
4. Clic en **Authorize** (candado)
5. Pegar el token
6. Ya puedes probar todos los endpoints protegidos

---

## Flujo JWT

```
Cliente                        API
  │                              │
  ├──POST /auth/login ──────────►│
  │   {usuario, password, tipo}  │ Valida credenciales + bcrypt
  │◄─── 201 ────────────────────┤
  │   {access_token (5min),      │
  │    refresh_token (7días),     │
  │    usuarioID, institutions}  │
  │                              │
  ├──GET /auth/validate ────────►│
  │   Authorization: Bearer xxx  │ Verifica firma JWT
  │◄─── 200: true ──────────────┤
  │                              │
  ├──POST /auth/refresh ────────►│
  │   {refresh_token}            │ Verifica en DB + rota tokens
  │◄─── 200 ────────────────────┤
  │   {nuevo access_token,       │
  │    nuevo refresh_token}      │
```

**Rotación de refresh tokens:** cada vez que se refresca, el token anterior queda
revocado y se emite uno nuevo. Esto evita la reutilización de tokens robados.

---

## Seguridad implementada

- ✅ Contraseñas hasheadas con bcrypt (10 salt rounds)
- ✅ JWT firmado con secreto configurable
- ✅ Refresh tokens opacos (UUID) almacenados en DB
- ✅ Rotación de refresh tokens
- ✅ Rate limiting (ThrottlerGuard)
- ✅ Helmet (cabeceras HTTP seguras)
- ✅ CORS configurable
- ✅ Validación + sanitización de inputs (class-validator + whitelist)
- ✅ Mensajes de error genéricos en autenticación (no revelan si el usuario existe)
- ✅ Guards globales
- ✅ Exception filter centralizado

---

## Variables de entorno

| Variable                | Default | Descripción                       |
|-------------------------|---------|-----------------------------------|
| PORT                    | 3000    | Puerto del servidor               |
| NODE_ENV                | development | Entorno                       |
| DATABASE_URL            | —       | URL de conexión MySQL             |
| JWT_SECRET              | —       | Secreto del access token          |
| JWT_EXPIRES_IN          | 5m      | Expiración del access token       |
| JWT_REFRESH_SECRET      | —       | Secreto del refresh token         |
| JWT_REFRESH_EXPIRES_IN  | 7d      | Expiración del refresh token      |
| THROTTLE_TTL            | 60      | Ventana rate limit (segundos)     |
| THROTTLE_LIMIT          | 10      | Máx. requests por ventana         |
| CORS_ORIGINS            | *       | Orígenes permitidos (CSV)         |
