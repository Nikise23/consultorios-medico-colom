import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoCita } from '@prisma/client';
import {
  diaSemanaConsultorio,
  finDelDiaConsultorio,
  formatFechaConsultorio,
  formatHoraConsultorio,
  inicioDelDiaConsultorio,
  parseDateTimeConsultorio,
  parseFechaConsultorio,
} from '../common/consultorio-time';
import { PrismaService } from '../prisma/prisma.service';
import { HorarioItemDto } from './dto/set-horarios.dto';

export interface FranjaHoraria {
  horaInicio: string;
  horaFin: string;
  slotMinutos: number;
}

export interface SlotDisponibilidad {
  hora: string;
  fechaHora: string;
  slotMinutos: number;
  disponible: boolean;
  ocupado: boolean;
  pasado: boolean;
}

const DIAS_NOMBRE = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

@Injectable()
export class AgendaService {
  constructor(private prisma: PrismaService) {}

  async getConfiguracion(medicoId: number) {
    await this.assertMedico(medicoId);

    const [horarios, bloqueos] = await Promise.all([
      this.prisma.horarioMedico.findMany({
        where: { medicoId },
        orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
      }),
      this.prisma.bloqueoAgenda.findMany({
        where: { medicoId },
        orderBy: { fecha: 'asc' },
      }),
    ]);

    return { medicoId, horarios, bloqueos };
  }

  async getHorariosPublicos(medicoId: number) {
    await this.assertMedico(medicoId);

    const horarios = await this.prisma.horarioMedico.findMany({
      where: { medicoId, activo: true },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });

    const sinHorarios = horarios.length === 0;
    const diasSemana = [
      ...new Set(horarios.map((h) => h.diaSemana)),
    ].sort((a, b) => a - b);

    const franjas = horarios.map((h) => ({
      diaSemana: h.diaSemana,
      dia: DIAS_NOMBRE[h.diaSemana],
      horaInicio: h.horaInicio,
      horaFin: h.horaFin,
      slotMinutos: h.slotMinutos,
    }));

    return {
      medicoId,
      sinHorarios,
      diasSemana,
      resumenDias: sinHorarios ? '' : this.formatResumenDias(diasSemana),
      franjas,
    };
  }

  async setHorarios(medicoId: number, horarios: HorarioItemDto[]) {
    await this.assertMedico(medicoId);

    for (const h of horarios) {
      if (!this.horaMenorQue(h.horaInicio, h.horaFin)) {
        throw new BadRequestException(
          `La hora de inicio debe ser anterior a la de fin (${h.horaInicio} - ${h.horaFin})`,
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.horarioMedico.deleteMany({ where: { medicoId } }),
      ...(horarios.length
        ? [
            this.prisma.horarioMedico.createMany({
              data: horarios.map((h) => ({
                medicoId,
                diaSemana: h.diaSemana,
                horaInicio: h.horaInicio,
                horaFin: h.horaFin,
                slotMinutos: h.slotMinutos,
                activo: h.activo ?? true,
              })),
            }),
          ]
        : []),
    ]);

    return this.getConfiguracion(medicoId);
  }

  async listarBloqueos(medicoId: number, desde?: string, hasta?: string) {
    await this.assertMedico(medicoId);

    const where: { medicoId: number; fecha?: { gte?: Date; lte?: Date } } = {
      medicoId,
    };

    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = this.parseFechaLocal(desde);
      if (hasta) where.fecha.lte = this.parseFechaLocal(hasta);
    }

    return this.prisma.bloqueoAgenda.findMany({
      where,
      orderBy: { fecha: 'asc' },
    });
  }

  async agregarBloqueo(medicoId: number, fecha: string, motivo?: string) {
    await this.assertMedico(medicoId);
    const fechaDate = this.parseFechaLocal(fecha);

    return this.prisma.bloqueoAgenda.upsert({
      where: {
        medicoId_fecha: { medicoId, fecha: fechaDate },
      },
      create: { medicoId, fecha: fechaDate, motivo },
      update: { motivo },
    });
  }

  async eliminarBloqueo(medicoId: number, fecha: string) {
    await this.assertMedico(medicoId);
    const fechaDate = this.parseFechaLocal(fecha);

    const bloqueo = await this.prisma.bloqueoAgenda.findUnique({
      where: { medicoId_fecha: { medicoId, fecha: fechaDate } },
    });

    if (!bloqueo) {
      throw new NotFoundException('Bloqueo no encontrado');
    }

    await this.prisma.bloqueoAgenda.delete({
      where: { id: bloqueo.id },
    });

    return { ok: true };
  }

  async estaBloqueado(medicoId: number, fecha: Date): Promise<boolean> {
    const fechaDate = this.parseFechaLocal(this.formatFechaLocal(fecha));
    const bloqueo = await this.prisma.bloqueoAgenda.findUnique({
      where: { medicoId_fecha: { medicoId, fecha: fechaDate } },
    });
    return !!bloqueo;
  }

  async getFranjasDelDia(
    medicoId: number,
    diaSemana: number,
  ): Promise<FranjaHoraria[]> {
    const horarios = await this.prisma.horarioMedico.findMany({
      where: { medicoId, diaSemana, activo: true },
      orderBy: { horaInicio: 'asc' },
    });

    return horarios.map((h) => ({
      horaInicio: h.horaInicio,
      horaFin: h.horaFin,
      slotMinutos: h.slotMinutos,
    }));
  }

  async getDisponibilidad(
    medicoId: number,
    fecha: string,
    excluirCitaId?: number,
  ) {
    await this.assertMedico(medicoId);

    const horariosActivos = await this.prisma.horarioMedico.findMany({
      where: { medicoId, activo: true },
    });

    const diasAtencion = [
      ...new Set(horariosActivos.map((h) => h.diaSemana)),
    ].sort((a, b) => a - b);

    if (horariosActivos.length === 0) {
      return {
        fecha,
        medicoId,
        sinHorarios: true,
        diasAtencion,
        bloqueado: false,
        diaAtiende: false,
        slots: [] as SlotDisponibilidad[],
      };
    }

    const fechaBase = this.parseFechaLocal(fecha);
    const bloqueado = await this.estaBloqueado(medicoId, fechaBase);

    if (bloqueado) {
      return {
        fecha,
        medicoId,
        sinHorarios: false,
        diasAtencion,
        bloqueado: true,
        diaAtiende: false,
        slots: [] as SlotDisponibilidad[],
      };
    }

    const diaSemana = diaSemanaConsultorio(fecha);
    const franjas = await this.getFranjasDelDia(medicoId, diaSemana);

    if (franjas.length === 0) {
      return {
        fecha,
        medicoId,
        sinHorarios: false,
        diasAtencion,
        bloqueado: false,
        diaAtiende: false,
        slots: [] as SlotDisponibilidad[],
      };
    }

    const inicioDia = inicioDelDiaConsultorio(fecha);
    const finDia = finDelDiaConsultorio(fecha);

    const citas = await this.prisma.cita.findMany({
      where: {
        medicoId,
        estado: { notIn: [EstadoCita.CANCELADA] },
        fechaHora: { gte: inicioDia, lte: finDia },
        ...(excluirCitaId ? { id: { not: excluirCitaId } } : {}),
      },
      select: { fechaHora: true, duracionMinutos: true },
    });

    const candidatos = this.generarSlotsCandidatos(fecha, franjas);
    const ahora = new Date();

    const slots: SlotDisponibilidad[] = candidatos.map((slot) => {
      const franja = this.buscarFranja(slot, fecha, franjas);
      const duracion = franja?.slotMinutos ?? 20;
      const ocupado = this.solapaConAlguna(slot, duracion, citas);
      const pasado = slot < ahora;

      return {
        hora: formatHoraConsultorio(slot),
        fechaHora: slot.toISOString(),
        slotMinutos: duracion,
        disponible: !ocupado && !pasado,
        ocupado,
        pasado,
      };
    });

    return {
      fecha,
      medicoId,
      sinHorarios: false,
      diasAtencion,
      bloqueado: false,
      diaAtiende: true,
      slots,
    };
  }

  generarSlotsCandidatos(fecha: string, franjas: FranjaHoraria[]): Date[] {
    const slots: Date[] = [];

    for (const franja of franjas) {
      let cursor = parseDateTimeConsultorio(fecha, franja.horaInicio);
      const finFranja = parseDateTimeConsultorio(fecha, franja.horaFin);

      while (
        cursor.getTime() + franja.slotMinutos * 60 * 1000 <=
        finFranja.getTime()
      ) {
        slots.push(new Date(cursor));
        cursor = new Date(
          cursor.getTime() + franja.slotMinutos * 60 * 1000,
        );
      }
    }

    return slots;
  }

  solapaConAlguna(
    inicio: Date,
    duracionMinutos: number,
    citas: { fechaHora: Date; duracionMinutos: number }[],
  ): boolean {
    const fin = new Date(inicio.getTime() + duracionMinutos * 60 * 1000);
    for (const c of citas) {
      const finOtra = new Date(
        c.fechaHora.getTime() + c.duracionMinutos * 60 * 1000,
      );
      if (inicio < finOtra && fin > c.fechaHora) return true;
    }
    return false;
  }

  parseFechaLocal(fecha: string): Date {
    const [y, m, d] = fecha.split('-').map(Number);
    if (!y || !m || !d) {
      throw new BadRequestException('Fecha inválida (use YYYY-MM-DD)');
    }
    return parseFechaConsultorio(fecha);
  }

  formatFechaLocal(d: Date): string {
    return formatFechaConsultorio(d);
  }

  inicioDelDia(d: Date): Date {
    return inicioDelDiaConsultorio(formatFechaConsultorio(d));
  }

  finDelDia(d: Date): Date {
    return finDelDiaConsultorio(formatFechaConsultorio(d));
  }

  private horaMenorQue(inicio: string, fin: string): boolean {
    const [hi, mi] = inicio.split(':').map(Number);
    const [hf, mf] = fin.split(':').map(Number);
    return hi * 60 + mi < hf * 60 + mf;
  }

  private buscarFranja(
    slot: Date,
    fecha: string,
    franjas: FranjaHoraria[],
  ): FranjaHoraria | undefined {
    for (const franja of franjas) {
      const inicio = parseDateTimeConsultorio(fecha, franja.horaInicio);
      const fin = parseDateTimeConsultorio(fecha, franja.horaFin);
      if (slot >= inicio && slot < fin) return franja;
    }
    return undefined;
  }

  private formatResumenDias(dias: number[]): string {
    const nombres = dias.map((d) => DIAS_NOMBRE[d] ?? String(d));
    if (nombres.length === 0) return '';
    if (nombres.length === 1) return nombres[0];
    if (nombres.length === 2) return `${nombres[0]} y ${nombres[1]}`;
    return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
  }

  private async assertMedico(medicoId: number) {
    const medico = await this.prisma.medico.findUnique({
      where: { id: medicoId },
    });
    if (!medico) {
      throw new NotFoundException(`Médico ${medicoId} no encontrado`);
    }
    return medico;
  }
}
