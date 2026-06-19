import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HorarioItemDto } from './dto/set-horarios.dto';

export interface FranjaHoraria {
  horaInicio: string;
  horaFin: string;
  slotMinutos: number;
}

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

  generarSlotsCandidatos(fechaBase: Date, franjas: FranjaHoraria[]): Date[] {
    const slots: Date[] = [];

    for (const franja of franjas) {
      let cursor = this.parseHoraEnDia(fechaBase, franja.horaInicio);
      const finFranja = this.parseHoraEnDia(fechaBase, franja.horaFin);

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
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  }

  formatFechaLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  inicioDelDia(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  finDelDia(d: Date): Date {
    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      23,
      59,
      59,
      999,
    );
  }

  private parseHoraEnDia(base: Date, hhmm: string): Date {
    const [h, m] = hhmm.split(':').map(Number);
    return new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      h,
      m ?? 0,
      0,
      0,
    );
  }

  private horaMenorQue(inicio: string, fin: string): boolean {
    const [hi, mi] = inicio.split(':').map(Number);
    const [hf, mf] = fin.split(':').map(Number);
    return hi * 60 + mi < hf * 60 + mf;
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
