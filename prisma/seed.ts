import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // Crear usuarios
  const adminPassword = await bcrypt.hash('admin123', 10);
  const secretariaPassword = await bcrypt.hash('secretaria123', 10);
  const medicoPassword = await bcrypt.hash('medico123', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@consultorio.com' },
    update: {},
    create: {
      email: 'admin@consultorio.com',
      password: adminPassword,
      rol: 'ADMINISTRADOR',
      nombre: 'Admin',
      apellido: 'Sistema',
    },
  });

  const secretaria = await prisma.usuario.upsert({
    where: { email: 'secretaria@consultorio.com' },
    update: {},
    create: {
      email: 'secretaria@consultorio.com',
      password: secretariaPassword,
      rol: 'SECRETARIA',
      nombre: 'María',
      apellido: 'González',
    },
  });

  const medicoUsuario = await prisma.usuario.upsert({
    where: { email: 'medico@consultorio.com' },
    update: {},
    create: {
      email: 'medico@consultorio.com',
      password: medicoPassword,
      rol: 'MEDICO',
      nombre: 'Dr. Carlos',
      apellido: 'García',
    },
  });

  // Crear médico
  const medico = await prisma.medico.upsert({
    where: { usuarioId: medicoUsuario.id },
    update: {},
    create: {
      usuarioId: medicoUsuario.id,
      matricula: 'MP12345',
      especialidad: 'Clínica Médica',
    },
  });

  // Crear pacientes de ejemplo
  const paciente1 = await prisma.paciente.upsert({
    where: { dni: '12345678' },
    update: {},
    create: {
      dni: '12345678',
      nombre: 'Juan',
      apellido: 'Pérez',
      fechaNacimiento: new Date('1990-01-15'),
      telefono: '1234567890',
      email: 'juan@example.com',
      direccion: 'Calle 123',
      obraSocial: 'OSDE',
      numeroAfiliado: '123456',
    },
  });

  const paciente2 = await prisma.paciente.upsert({
    where: { dni: '87654321' },
    update: {},
    create: {
      dni: '87654321',
      nombre: 'María',
      apellido: 'López',
      fechaNacimiento: new Date('1985-05-20'),
      telefono: '0987654321',
      email: 'maria@example.com',
      direccion: 'Avenida 456',
      obraSocial: 'Swiss Medical',
      numeroAfiliado: '654321',
    },
  });

  console.log('✅ Seed completado exitosamente!');
  console.log('\n📋 Usuarios creados:');
  console.log('   Admin: admin@consultorio.com / admin123');
  console.log('   Secretaria: secretaria@consultorio.com / secretaria123');
  console.log('   Médico: medico@consultorio.com / medico123');
  console.log('\n👥 Pacientes de ejemplo:');
  console.log(`   - ${paciente1.nombre} ${paciente1.apellido} (DNI: ${paciente1.dni})`);
  console.log(`   - ${paciente2.nombre} ${paciente2.apellido} (DNI: ${paciente2.dni})`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




