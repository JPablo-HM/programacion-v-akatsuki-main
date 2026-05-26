# Ejemplos de prueba — Carnet Digital CUC API

## Base URL
```
http://localhost:3000/api/v1
```

---

## SRV1 — Autenticación

### 1. LOGIN (Admin)

**curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "admin@cuc.edu.co",
    "password": "Admin@2024!",
    "tipoUsuario": "ADMIN"
  }'
```

**Respuesta 201:**
```json
{
  "expires_in": "300",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "usuarioID": "uuid-del-usuario",
  "institutions": [
    {
      "id": "uuid-institucion",
      "nombre": "Corporación Universidad de la Costa",
      "codigo": "CUC"
    }
  ]
}
```

---

### 2. LOGIN (Estudiante)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "estudiante@cuc.edu.co",
    "password": "Estudiante@2024!",
    "tipoUsuario": "ESTUDIANTE"
  }'
```

---

### 3. LOGIN (Funcionario — por username)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "funcionario01",
    "password": "Funcionario@2024!",
    "tipoUsuario": "FUNCIONARIO"
  }'
```

---

### 4. LOGIN inválido (401)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "admin@cuc.edu.co",
    "password": "passwordIncorrecto",
    "tipoUsuario": "ADMIN"
  }'
```

**Respuesta 401:**
```json
{
  "statusCode": 401,
  "message": "Usuario y/o contraseña incorrectos",
  "error": "Unauthorized",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/auth/login"
}
```

---

### 5. REFRESH TOKEN

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }'
```

**Respuesta 200:**
```json
{
  "expires_in": "300",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"
}
```

---

### 6. VALIDATE TOKEN

```bash
curl -X GET http://localhost:3000/api/v1/auth/validate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respuesta 200:**
```
true
```

**Respuesta 401 (token expirado o inválido):**
```json
{
  "statusCode": 401,
  "message": "El token ha expirado",
  "error": "Unauthorized",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/auth/validate"
}
```

---

## SRV7 — Pantallas (requiere JWT)

> Sustituye `<TOKEN>` por el access_token obtenido en login.

### Crear pantalla
```bash
curl -X POST http://localhost:3000/api/v1/pantallas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "nombre": "Reportes",
    "descripcion": "Módulo de reportes del sistema",
    "ruta": "/reportes"
  }'
```

### Obtener todas
```bash
curl -X GET http://localhost:3000/api/v1/pantallas \
  -H "Authorization: Bearer <TOKEN>"
```

### Obtener por ID
```bash
curl -X GET http://localhost:3000/api/v1/pantallas/<UUID> \
  -H "Authorization: Bearer <TOKEN>"
```

### Actualizar
```bash
curl -X PUT http://localhost:3000/api/v1/pantallas/<UUID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{ "nombre": "Reportes Actualizados", "activo": true }'
```

### Eliminar
```bash
curl -X DELETE http://localhost:3000/api/v1/pantallas/<UUID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

## SRV9 — Bitácora (requiere JWT)

### Registrar entrada
```bash
curl -X POST http://localhost:3000/api/v1/bitacora \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "usuarioId": "<UUID_USUARIO>",
    "descripcion": "El usuario consultó su carnet digital",
    "accion": "CONSULTA_CARNET",
    "ip": "192.168.1.1"
  }'
```

### Obtener todo (paginado)
```bash
curl -X GET "http://localhost:3000/api/v1/bitacora?page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN>"
```

### Obtener por usuario
```bash
curl -X GET http://localhost:3000/api/v1/bitacora/usuario/<UUID_USUARIO> \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Validación de campos (400 Bad Request)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "",
    "password": "",
    "tipoUsuario": ""
  }'
```

**Respuesta 400:**
```json
{
  "statusCode": 400,
  "message": [
    "El usuario o email no puede estar vacío",
    "La contraseña no puede estar vacía",
    "El tipo de usuario no puede estar vacío"
  ],
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/auth/login"
}
```

---

## Colección Postman (JSON importable)

Importar el siguiente JSON en Postman:

```json
{
  "info": {
    "name": "Carnet Digital CUC",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl",      "value": "http://localhost:3000/api/v1" },
    { "key": "accessToken",  "value": "" },
    { "key": "refreshToken", "value": "" }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "event": [{
            "listen": "test",
            "script": {
              "exec": [
                "const r = pm.response.json();",
                "pm.collectionVariables.set('accessToken',  r.access_token);",
                "pm.collectionVariables.set('refreshToken', r.refresh_token);"
              ]
            }
          }],
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/login",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"usuario\": \"admin@cuc.edu.co\",\n  \"password\": \"Admin@2024!\",\n  \"tipoUsuario\": \"ADMIN\"\n}"
            }
          }
        },
        {
          "name": "Refresh Token",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/refresh",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"refresh_token\": \"{{refreshToken}}\"\n}"
            }
          }
        },
        {
          "name": "Validate Token",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/auth/validate",
            "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }]
          }
        }
      ]
    }
  ]
}
```
