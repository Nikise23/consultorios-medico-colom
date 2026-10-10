import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BackupService {
  constructor(private prisma: PrismaService) {}

  async exportarTodo() {
    const [
      usuarios,
      medicos,
      horariosMedico,
      bloqueosAgenda,
      pacientes,
      atenciones,
      historiasClinicas,
      pagos,
      citas,
    ] = await Promise.all([
      this.prisma.usuario.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.medico.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.horarioMedico.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.bloqueoAgenda.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.paciente.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.atencion.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.historiaClinica.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.pago.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.cita.findMany({ orderBy: { id: 'asc' } }),
    ]);

    const generadoEn = new Date().toISOString();

    return {
      meta: {
        version: 1,
        sistema: 'consultorios-medico-colom',
        generadoEn,
        advertencia:
          'Archivo sensible con datos de pacientes e historias clínicas. Guardarlo en un lugar seguro. Incluye hashes de contraseñas (no texto plano).',
        contadores: {
          usuarios: usuarios.length,
          medicos: medicos.length,
          horariosMedico: horariosMedico.length,
          bloqueosAgenda: bloqueosAgenda.length,
          pacientes: pacientes.length,
          atenciones: atenciones.length,
          historiasClinicas: historiasClinicas.length,
          pagos: pagos.length,
          citas: citas.length,
        },
      },
      data: {
        usuarios,
        medicos,
        horariosMedico,
        bloqueosAgenda,
        pacientes,
        atenciones,
        historiasClinicas,
        pagos,
        citas,
      },
    };
  }
}
