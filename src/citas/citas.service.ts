import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { SearchCitaDto } from './dto/search-cita.dto';
import { EstadoCita, Prisma } from '@prisma/client';
import { NotificacionesCitaService } from './notificaciones-cita.service';
import {
  getAgendaEspecialidadFilter,
  medicoEnAgenda,
} from '../common/agenda-config';

const includeRelaciones = {
  paciente: true,
  medico: { include: { usuario: true } },
  atencion: true,
} as const;

@Injectable()
export class CitasService {
  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesCitaService,
  ) {}

  private async assertMedicoEnAgenda(medicoId: number) {
    const filtro = getAgendaEspecialidadFilter();
    if (!filtro) return;

    const medico = await this.prisma.medico.findUnique({
      where: { id: medicoId },
      select: { especialidad: true, activo: true },
    });
    if (!medico?.activo || !medicoEnAgenda(medico.especialidad)) {
      throw new BadRequestException(
        `La agenda solo admite médicos de ${filtro}`,
      );
    }
  }

  private filtroMedicosAgenda(): Prisma.CitaWhereInput | undefined {
    const filtro = getAgendaEspecialidadFilter();
    if (!filtro) return undefined;
    return {
      medico: {
        especialidad: { equals: filtro, mode: 'insensitive' },
      },
    };
  }

  private finCita(fechaHora: Date, duracionMinutos: number): Date {
    return new Date(fechaHora.getTime() + duracionMinutos * 60 * 1000);
  }

  private async validarSolapamiento(
    medicoId: number,
    fechaHora: Date,
    duracionMinutos: number,
    excluirCitaId?: number,
  ) {
    const inicio = fechaHora;
    const fin = this.finCita(fechaHora, duracionMinutos);

    const candidatas = await this.prisma.cita.findMany({
      where: {
        medicoId,
        estado: { notIn: [EstadoCita.CANCELADA] },
        ...(excluirCitaId ? { id: { not: excluirCitaId } } : {}),
        fechaHora: { lt: fin },
      },
    });

    for (const c of candidatas) {
      const finOtra = this.finCita(c.fechaHora, c.duracionMinutos);
      if (inicio < finOtra && fin > c.fechaHora) {
        throw new BadRequestException(
          'El médico ya tiene un turno en ese horario',
        );
      }
    }
  }

  async create(dto: CreateCitaDto) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: dto.pacienteId },
    });
    if (!paciente) {
      throw new NotFoundException(`Paciente ${dto.pacienteId} no encontrado`);
    }

    const medico = await this.prisma.medico.findUnique({
      where: { id: dto.medicoId },
    });
    if (!medico) {
      throw new NotFoundException(`Médico ${dto.medicoId} no encontrado`);
    }

    await this.assertMedicoEnAgenda(dto.medicoId);

    const fechaHora = new Date(dto.fechaHora);
    const duracion = dto.duracionMinutos ?? 20;

    if (fechaHora <= new Date()) {
      throw new BadRequestException('La fecha del turno debe ser futura');
    }

    await this.validarSolapamiento(dto.medicoId, fechaHora, duracion);

    const estado = dto.confirmar ? EstadoCita.CONFIRMADA : EstadoCita.PROGRAMADA;

    let cita = await this.prisma.cita.create({
      data: {
        pacienteId: dto.pacienteId,
        medicoId: dto.medicoId,
        fechaHora,
        duracionMinutos: duracion,
        motivo: dto.motivo,
        notas: dto.notas,
        estado,
      },
      include: includeRelaciones,
    });

    if (estado === EstadoCita.CONFIRMADA) {
      cita = await this.enviarNotificaciones(cita.id);
    }

    return cita;
  }

  async findAll(query: SearchCitaDto, medicoIdFiltro?: number) {
    const where: Prisma.CitaWhereInput = {};
    const filtroAgenda = this.filtroMedicosAgenda();

    if (medicoIdFiltro) {
      where.medicoId = medicoIdFiltro;
    } else if (query.medicoId) {
      where.medicoId = query.medicoId;
    }

    if (filtroAgenda) {
      where.AND = [...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []), filtroAgenda];
    }

    if (query.pacienteId) where.pacienteId = query.pacienteId;
    if (query.estado) where.estado = query.estado;

    if (query.desde || query.hasta) {
      where.fechaHora = {};
      if (query.desde) where.fechaHora.gte = new Date(query.desde);
      if (query.hasta) where.fechaHora.lte = new Date(query.hasta);
    }

    if (query.dni) {
      where.paciente = { dni: { contains: query.dni, mode: 'insensitive' } };
    }

    if (query.busqueda?.trim()) {
      const t = query.busqueda.trim();
      where.paciente = {
        OR: [
          { dni: { contains: t, mode: 'insensitive' } },
          { nombre: { contains: t, mode: 'insensitive' } },
          { apellido: { contains: t, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.cita.findMany({
      where,
      include: includeRelaciones,
      orderBy: { fechaHora: 'asc' },
      take: 100,
    });
  }

  async findOne(id: number) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      include: includeRelaciones,
    });
    if (!cita) throw new NotFoundException(`Cita ${id} no encontrada`);
    return cita;
  }

  async update(id: number, dto: UpdateCitaDto) {
    const cita = await this.findOne(id);

    if (
      cita.estado === EstadoCita.CANCELADA ||
      cita.estado === EstadoCita.COMPLETADA
    ) {
      throw new BadRequestException('No se puede modificar esta cita');
    }

    const medicoId = dto.medicoId ?? cita.medicoId;
    const fechaHora = dto.fechaHora ? new Date(dto.fechaHora) : cita.fechaHora;
    const duracion = dto.duracionMinutos ?? cita.duracionMinutos;

    if (dto.medicoId) {
      await this.assertMedicoEnAgenda(medicoId);
    }

    if (dto.fechaHora || dto.medicoId || dto.duracionMinutos) {
      await this.validarSolapamiento(medicoId, fechaHora, duracion, id);
    }

    return this.prisma.cita.update({
      where: { id },
      data: {
        medicoId: dto.medicoId,
        fechaHora: dto.fechaHora ? fechaHora : undefined,
        duracionMinutos: dto.duracionMinutos,
        estado: dto.estado,
        motivo: dto.motivo,
        notas: dto.notas,
      },
      include: includeRelaciones,
    });
  }

  async confirmar(id: number) {
    const cita = await this.findOne(id);
    if (cita.estado === EstadoCita.CANCELADA) {
      throw new BadRequestException('La cita está cancelada');
    }
    if (cita.estado === EstadoCita.CONFIRMADA) {
      return cita;
    }

    await this.prisma.cita.update({
      where: { id },
      data: { estado: EstadoCita.CONFIRMADA },
    });

    return this.enviarNotificaciones(id);
  }

  private async enviarNotificaciones(id: number) {
    const cita = await this.findOne(id);
    const result = await this.notificaciones.enviarConfirmacion(cita);

    return this.prisma.cita.update({
      where: { id },
      data: {
        emailEnviadoAt: result.emailEnviado ? new Date() : cita.emailEnviadoAt,
        googleEventId: result.googleEventId ?? cita.googleEventId,
      },
      include: includeRelaciones,
    });
  }

  async cancelar(id: number) {
    const cita = await this.findOne(id);
    if (cita.estado === EstadoCita.CHECKIN || cita.estado === EstadoCita.COMPLETADA) {
      throw new BadRequestException('No se puede cancelar: ya tiene check-in');
    }

    if (cita.googleEventId) {
      await this.notificaciones.eliminarEventoGoogle(cita.googleEventId);
    }

    return this.prisma.cita.update({
      where: { id },
      data: { estado: EstadoCita.CANCELADA },
      include: includeRelaciones,
    });
  }

  async eliminar(id: number) {
    const cita = await this.findOne(id);
    if (cita.estado === EstadoCita.CHECKIN || cita.estado === EstadoCita.COMPLETADA) {
      throw new BadRequestException('No se puede eliminar: ya tiene check-in');
    }

    if (cita.googleEventId) {
      await this.notificaciones.eliminarEventoGoogle(cita.googleEventId);
    }

    await this.prisma.cita.delete({ where: { id } });
    return { ok: true, id };
  }

  async marcarNoAsistio(id: number) {
    const cita = await this.findOne(id);
    if (cita.estado === EstadoCita.CHECKIN) {
      throw new BadRequestException('El paciente ya ingresó a sala de espera');
    }
    return this.prisma.cita.update({
      where: { id },
      data: { estado: EstadoCita.NO_ASISTIO },
      include: includeRelaciones,
    });
  }

  async vincularAtencion(citaId: number, atencionId: number) {
    const cita = await this.findOne(citaId);
    if (cita.estado === EstadoCita.CANCELADA) {
      throw new BadRequestException('La cita está cancelada');
    }
    if (cita.atencionId) {
      throw new BadRequestException('La cita ya tiene check-in registrado');
    }

    const atencion = await this.prisma.atencion.findUnique({
      where: { id: atencionId },
    });
    if (!atencion) {
      throw new NotFoundException(`Atención ${atencionId} no encontrada`);
    }
    if (atencion.pacienteId !== cita.pacienteId) {
      throw new BadRequestException('La atención no corresponde al paciente de la cita');
    }

    return this.prisma.cita.update({
      where: { id: citaId },
      data: {
        atencionId,
        estado: EstadoCita.CHECKIN,
      },
      include: includeRelaciones,
    });
  }

  async citasHoyMedico(medicoId: number) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    return this.prisma.cita.findMany({
      where: {
        medicoId,
        fechaHora: { gte: hoy, lt: manana },
        estado: {
          in: [
            EstadoCita.PROGRAMADA,
            EstadoCita.CONFIRMADA,
            EstadoCita.CHECKIN,
          ],
        },
      },
      include: includeRelaciones,
      orderBy: { fechaHora: 'asc' },
    });
  }
}
