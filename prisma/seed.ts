import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type HorarioSeed = {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  slotMinutos: number;
};

async function aplicarHorariosMedico(
  nombreBusqueda: string,
  apellido: string,
  horarios: HorarioSeed[],
) {
  const medico = await prisma.medico.findFirst({
    where: {
      activo: true,
      usuario: {
        apellido: { equals: apellido, mode: 'insensitive' },
        nombre: { contains: nombreBusqueda, mode: 'insensitive' },
      },
    },
    include: {
      usuario: { select: { nombre: true, apellido: true, email: true } },
    },
  });

  if (!medico) {
    console.warn(
      `⚠️  No se encontró médico con apellido "${apellido}" y nombre que contenga "${nombreBusqueda}". Horarios omitidos.`,
    );
    return null;
  }

  await prisma.horarioMedico.deleteMany({ where: { medicoId: medico.id } });

  if (horarios.length) {
    await prisma.horarioMedico.createMany({
      data: horarios.map((h) => ({
        medicoId: medico.id,
        ...h,
      })),
    });
  }

  console.log(
    `✅ Horarios aplicados a Dr. ${medico.usuario.nombre} ${medico.usuario.apellido} (${medico.usuario.email})`,
  );

  await prisma.medico.update({
    where: { id: medico.id },
    data: { usaAgenda: true },
  });

  return medico;
}

async function main() {
  console.log('🌱 Seed de horarios de agenda (sin crear usuarios)...');

  await aplicarHorariosMedico('Pablo', 'Colom', [
    { diaSemana: 3, horaInicio: '16:30', horaFin: '18:30', slotMinutos: 15 },
    { diaSemana: 5, horaInicio: '15:00', horaFin: '18:30', slotMinutos: 15 },
    { diaSemana: 6, horaInicio: '09:00', horaFin: '12:00', slotMinutos: 15 },
  ]);

  await aplicarHorariosMedico('Francisco', 'Colom', [
    { diaSemana: 4, horaInicio: '10:00', horaFin: '11:30', slotMinutos: 10 },
    { diaSemana: 4, horaInicio: '14:30', horaFin: '17:00', slotMinutos: 10 },
    { diaSemana: 5, horaInicio: '09:30', horaFin: '11:30', slotMinutos: 10 },
  ]);

  console.log('\n✅ Seed de horarios finalizado.');
  console.log(
    '   Solo actualiza horarios de médicos ya existentes (Pablo y Francisco Colom).',
  );
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
