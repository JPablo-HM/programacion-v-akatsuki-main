import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Iniciando seed de base de datos...\n');

  // --------------------------------------------------------
  // Tipos de usuario
  // --------------------------------------------------------
  const tipoAdmin = await prisma.tipoUsuario.upsert({
    where: { nombre: 'ADMIN' },
    update: {},
    create: { nombre: 'ADMIN' },
  });

  const tipoEstudiante = await prisma.tipoUsuario.upsert({
    where: { nombre: 'ESTUDIANTE' },
    update: {},
    create: { nombre: 'ESTUDIANTE' },
  });

  const tipoFuncionario = await prisma.tipoUsuario.upsert({
    where: { nombre: 'FUNCIONARIO' },
    update: {},
    create: { nombre: 'FUNCIONARIO' },
  });

  console.log('✅ Tipos de usuario creados');

  // --------------------------------------------------------
  // Institución
  // --------------------------------------------------------
  const cuc = await prisma.institucion.upsert({
    where: { codigo: 'CUC' },
    update: {},
    create: {
      nombre: 'Corporación Universidad de la Costa',
      codigo: 'CUC',
      activo: true,
    },
  });

  console.log('✅ Institución CUC creada');

  // --------------------------------------------------------
  // Usuarios (con passwords hasheadas)
  // --------------------------------------------------------
  const [adminHash, estudianteHash, funcionarioHash] = await Promise.all([
    bcrypt.hash('Admin@2024!', SALT_ROUNDS),
    bcrypt.hash('Estudiante@2024!', SALT_ROUNDS),
    bcrypt.hash('Funcionario@2024!', SALT_ROUNDS),
  ]);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@cuc.edu.co' },
    update: {},
    create: {
      email: 'admin@cuc.edu.co',
      username: 'admin',
      password: adminHash,
      nombre: 'Administrador',
      apellido: 'Sistema',
      activo: true,
      tipoUsuarioId: tipoAdmin.id,
    },
  });

  const estudiante = await prisma.usuario.upsert({
    where: { email: 'estudiante@cuc.edu.co' },
    update: {},
    create: {
      email: 'estudiante@cuc.edu.co',
      username: 'estudiante01',
      password: estudianteHash,
      nombre: 'Juan',
      apellido: 'Pérez',
      activo: true,
      tipoUsuarioId: tipoEstudiante.id,
    },
  });

  const funcionario = await prisma.usuario.upsert({
    where: { email: 'funcionario@cuc.edu.co' },
    update: {},
    create: {
      email: 'funcionario@cuc.edu.co',
      username: 'funcionario01',
      password: funcionarioHash,
      nombre: 'María',
      apellido: 'García',
      activo: true,
      tipoUsuarioId: tipoFuncionario.id,
    },
  });

  console.log('✅ Usuarios creados');

  // --------------------------------------------------------
  // Asociar usuarios a la institución CUC
  // --------------------------------------------------------
  for (const usuario of [admin, estudiante, funcionario]) {
    await prisma.usuarioInstitucion.upsert({
      where: {
        usuarioId_institucionId: {
          usuarioId: usuario.id,
          institucionId: cuc.id,
        },
      },
      update: {},
      create: {
        usuarioId: usuario.id,
        institucionId: cuc.id,
      },
    });
  }

  console.log('✅ Usuarios asociados a institución CUC');

  // --------------------------------------------------------
  // Pantallas iniciales
  // --------------------------------------------------------
  const pantallas = [
    { nombre: 'Dashboard',     descripcion: 'Pantalla principal del sistema',   ruta: '/dashboard' },
    { nombre: 'Perfil',        descripcion: 'Gestión del perfil de usuario',     ruta: '/perfil' },
    { nombre: 'Admin',         descripcion: 'Panel de administración',           ruta: '/admin' },
    { nombre: 'Carnet',        descripcion: 'Visualización del carnet digital',  ruta: '/carnet' },
    { nombre: 'Configuración', descripcion: 'Configuración del sistema',         ruta: '/configuracion' },
  ];

  for (const p of pantallas) {
    await prisma.pantalla.upsert({
      where: { ruta: p.ruta },
      update: {},
      create: p,
    });
  }

  console.log('✅ Pantallas iniciales creadas');

  console.log('\n🎉 Seed completado exitosamente\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Credenciales de prueba:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ADMIN      → admin@cuc.edu.co       / Admin@2024!');
  console.log('  ESTUDIANTE → estudiante@cuc.edu.co  / Estudiante@2024!');
  console.log('  FUNCIONARIO→ funcionario@cuc.edu.co / Funcionario@2024!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
