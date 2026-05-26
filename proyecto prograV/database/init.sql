-- ============================================================
-- Script de inicialización - Carnet Digital CUC
-- Motor: MySQL 8.0+
-- Ejecutar ANTES de prisma migrate (referencia/manual)
-- ============================================================

CREATE DATABASE IF NOT EXISTS carnet_digital_cuc
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE carnet_digital_cuc;

-- ============================================================
-- tipos_usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS tipos_usuario (
  id     INT          NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(50)  NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uq_tipo_usuario_nombre UNIQUE (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id               VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  email            VARCHAR(255) NOT NULL,
  username         VARCHAR(100) NOT NULL,
  password         VARCHAR(255) NOT NULL,
  nombre           VARCHAR(100) NOT NULL,
  apellido         VARCHAR(100) NOT NULL,
  activo           TINYINT(1)   NOT NULL DEFAULT 1,
  tipo_usuario_id  INT          NOT NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT uq_usuario_email    UNIQUE (email),
  CONSTRAINT uq_usuario_username UNIQUE (username),
  CONSTRAINT fk_usuario_tipo     FOREIGN KEY (tipo_usuario_id)
    REFERENCES tipos_usuario(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- instituciones
-- ============================================================
CREATE TABLE IF NOT EXISTS instituciones (
  id         VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  nombre     VARCHAR(200) NOT NULL,
  codigo     VARCHAR(50)  NOT NULL,
  activo     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT uq_institucion_codigo UNIQUE (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- usuarios_instituciones  (N:N)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios_instituciones (
  id             VARCHAR(36) NOT NULL DEFAULT (UUID()),
  usuario_id     VARCHAR(36) NOT NULL,
  institucion_id VARCHAR(36) NOT NULL,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT uq_usuario_institucion UNIQUE (usuario_id, institucion_id),
  CONSTRAINT fk_ui_usuario     FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)     ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ui_institucion FOREIGN KEY (institucion_id)
    REFERENCES instituciones(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- refresh_tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  token      VARCHAR(500) NOT NULL,
  usuario_id VARCHAR(36)  NOT NULL,
  expires_at DATETIME(3)  NOT NULL,
  revocado   TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT uq_refresh_token UNIQUE (token),
  CONSTRAINT fk_rt_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- pantallas
-- ============================================================
CREATE TABLE IF NOT EXISTS pantallas (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  nombre      VARCHAR(100) NOT NULL,
  descripcion VARCHAR(500)          DEFAULT NULL,
  ruta        VARCHAR(200) NOT NULL,
  activo      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT uq_pantalla_ruta UNIQUE (ruta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- bitacoras
-- ============================================================
CREATE TABLE IF NOT EXISTS bitacoras (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  usuario_id  VARCHAR(36)  NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  accion      VARCHAR(100) NOT NULL,
  ip          VARCHAR(50)           DEFAULT NULL,
  fecha       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_bit_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Índices adicionales para performance
-- ============================================================
CREATE INDEX idx_refresh_tokens_token    ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_usuario  ON refresh_tokens(usuario_id);
CREATE INDEX idx_bitacoras_usuario       ON bitacoras(usuario_id);
CREATE INDEX idx_bitacoras_fecha         ON bitacoras(fecha);

-- ============================================================
-- Datos base: tipos_usuario
-- ============================================================
INSERT INTO tipos_usuario (nombre) VALUES
  ('ADMIN'),
  ('ESTUDIANTE'),
  ('FUNCIONARIO')
ON DUPLICATE KEY UPDATE nombre = nombre;

-- ============================================================
-- Datos base: institución CUC
-- ============================================================
INSERT INTO instituciones (id, nombre, codigo, activo) VALUES
  (UUID(), 'Corporación Universidad de la Costa', 'CUC', 1)
ON DUPLICATE KEY UPDATE nombre = nombre;

-- ============================================================
-- NOTA: Los usuarios de prueba se insertan mediante el seeder
-- Ejecutar: npm run prisma:seed
--
-- Credenciales de prueba:
--   admin@cuc.edu.co       / Admin@2024!       (ADMIN)
--   estudiante@cuc.edu.co  / Estudiante@2024!  (ESTUDIANTE)
--   funcionario@cuc.edu.co / Funcionario@2024! (FUNCIONARIO)
-- ============================================================
