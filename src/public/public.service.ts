import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EstadoCita } from '@prisma/client';
import { AgendaService } from '../agenda/agenda.service';
import { CitasService } from '../citas/citas.service';
import {
  CitaConRelaciones,
  NotificacionesCitaService,
} from '../citas/notificaciones-cita.service';
import { MedicosService } from '../medicos/medicos.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReservarTurnoDto } from './dto/reservar-turno.dto';

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

@Injectable()
export class PublicService {
  private readonly anticipacionMinHoras: number;
  private readonly anticipacionMaxDias: number;
  private readonly rateLimitMax: number;
  private readonly rateLimitWindowMs: number;

  constructor(
    private config: ConfigService,
    private medicosService: MedicosService,
    private pacientesService: PacientesService,
    private citasService: CitasService,
    private prisma: PrismaService,
    private notificaciones: NotificacionesCitaService,
    private agendaService: AgendaService,
  ) {
    this.anticipacionMinHoras = Number(
      this.config.get('PUBLIC_TURNOS_ANTICIPACION_MIN_HORAS') ?? 2,
    );
    this.anticipacionMaxDias = Number(
      this.config.get('PUBLIC_TURNOS_ANTICIPACION_MAX_DIAS') ?? 60,
    );
    this.rateLimitMax = Number(
      this.config.get('PUBLIC_TURNOS_RATE_LIMIT_MAX') ?? 5,
    );
    this.rateLimitWindowMs =
      Number(this.config.get('PUBLIC_TURNOS_RATE_LIMIT_WINDOW_MIN') ?? 60) *
      60 *
      1000;
  }

  async listarMedicos() {
    const medicos = await this.medicosService.findAll();
    return medicos.map((m) => ({
      id: m.id,
      especialidad: m.especialidad,
      nombre: m.usuario.nombre,
      apellido: m.usuario.apellido,
      nombreCompleto: `${m.usuario.nombre} ${m.usuario.apellido}`,
    }));
  }

  async listarEspecialidades(): Promise<string[]> {
    const medicos = await this.medicosService.findAll();
    const set = new Set<string>();
    for (const m of medicos) {
      if (m.especialidad?.trim()) set.add(m.especialidad.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  }

  async horarios(medicoId: number) {
    const medico = await this.medicosService.findOne(medicoId);
    if (!medico || !medico.activo) {
      throw new NotFoundException('Profesional no encontrado');
    }
    return this.agendaService.getHorariosPublicos(medicoId);
  }

  async disponibilidad(medicoId: number, fecha: string) {
    const medico = await this.medicosService.findOne(medicoId);
    if (!medico || !medico.activo) {
      throw new NotFoundException('Profesional no encontrado');
    }

    const fechaBase = this.agendaService.parseFechaLocal(fecha);

    if (await this.agendaService.estaBloqueado(medicoId, fechaBase)) {
      return { fecha, medicoId, slots: [] as string[] };
    }

    const diaSemana = fechaBase.getDay();
    const franjas = await this.agendaService.getFranjasDelDia(
      medicoId,
      diaSemana,
    );

    if (franjas.length === 0) {
      return { fecha, medicoId, slots: [] as string[] };
    }

    const ahora = new Date();
    const minimo = new Date(
      ahora.getTime() + this.anticipacionMinHoras * 60 * 60 * 1000,
    );
    const maximo = new Date(
      ahora.getTime() + this.anticipacionMaxDias * 24 * 60 * 60 * 1000,
    );

    if (fechaBase > this.agendaService.finDelDia(maximo)) {
      throw new BadRequestException(
        `Solo se pueden reservar turnos hasta ${this.anticipacionMaxDias} días`,
      );
    }

    const inicioDia = this.agendaService.inicioDelDia(fechaBase);
    const finDia = this.agendaService.finDelDia(fechaBase);

    const citas = await this.prisma.cita.findMany({
      where: {
        medicoId,
        estado: { notIn: [EstadoCita.CANCELADA] },
        fechaHora: { gte: inicioDia, lte: finDia },
      },
      select: { fechaHora: true, duracionMinutos: true },
    });

    const candidatos = this.agendaService.generarSlotsCandidatos(
      fechaBase,
      franjas,
    );
    const slots: string[] = [];

    for (const slot of candidatos) {
      if (slot < minimo || slot > maximo) continue;

      const franja = franjas.find((f) => {
        const inicio = this.parseHoraEnDia(fechaBase, f.horaInicio);
        const fin = this.parseHoraEnDia(fechaBase, f.horaFin);
        return slot >= inicio && slot < fin;
      });
      const duracion = franja?.slotMinutos ?? 20;

      if (
        this.agendaService.solapaConAlguna(slot, duracion, citas)
      ) {
        continue;
      }
      slots.push(slot.toISOString());
    }

    return { fecha, medicoId, slots };
  }

  async reservar(dto: ReservarTurnoDto, clientKey: string) {
    this.checkRateLimit(clientKey);

    const medico = await this.medicosService.findOne(dto.medicoId);
    if (!medico || !medico.activo) {
      throw new NotFoundException('Profesional no encontrado');
    }

    const fechaHora = new Date(dto.fechaHora);
    const fechaStr = this.agendaService.formatFechaLocal(fechaHora);
    const { slots } = await this.disponibilidad(dto.medicoId, fechaStr);
    const slotOk = slots.some((s) => s === fechaHora.toISOString());
    if (!slotOk) {
      throw new BadRequestException('El horario seleccionado no está disponible');
    }

    let paciente = await this.pacientesService.findByDni(dto.dni.trim());
    if (paciente) {
      paciente = await this.pacientesService.update(paciente.id, {
        nombre: dto.nombre,
        apellido: dto.apellido,
        obraSocial: dto.obraSocial,
        telefono: dto.telefono,
        email: dto.email,
        fechaNacimiento: dto.fechaNacimiento,
      });
    } else {
      paciente = await this.pacientesService.create({
        dni: dto.dni.trim(),
        nombre: dto.nombre,
        apellido: dto.apellido,
        obraSocial: dto.obraSocial,
        telefono: dto.telefono,
        email: dto.email,
        fechaNacimiento: dto.fechaNacimiento,
      });
    }

    const duracion =
      dto.duracionMinutos ??
      (await this.getSlotMinutosParaHorario(dto.medicoId, fechaHora));

    const cita = await this.citasService.create({
      pacienteId: paciente.id,
      medicoId: dto.medicoId,
      fechaHora: dto.fechaHora,
      duracionMinutos: duracion,
      motivo: dto.motivo ?? 'Turno online',
      notas: 'Reserva desde sitio web público',
      confirmar: true,
    });

    const calendario = this.notificaciones.getEnlacesCalendario(
      cita as CitaConRelaciones,
    );

    return {
      id: cita.id,
      estado: cita.estado,
      fechaHora: cita.fechaHora,
      duracionMinutos: cita.duracionMinutos,
      medico: {
        nombre: `${cita.medico.usuario.nombre} ${cita.medico.usuario.apellido}`,
        especialidad: cita.medico.especialidad,
      },
      paciente: {
        nombre: cita.paciente.nombre,
        apellido: cita.paciente.apellido,
      },
      calendario,
    };
  }

  private async getSlotMinutosParaHorario(
    medicoId: number,
    fechaHora: Date,
  ): Promise<number> {
    const franjas = await this.agendaService.getFranjasDelDia(
      medicoId,
      fechaHora.getDay(),
    );
    const fechaBase = this.agendaService.parseFechaLocal(
      this.agendaService.formatFechaLocal(fechaHora),
    );

    for (const franja of franjas) {
      const inicio = this.parseHoraEnDia(fechaBase, franja.horaInicio);
      const fin = this.parseHoraEnDia(fechaBase, franja.horaFin);
      if (fechaHora >= inicio && fechaHora < fin) {
        return franja.slotMinutos;
      }
    }

    return 20;
  }

  private checkRateLimit(key: string) {
    const now = Date.now();
    const entry = rateLimitStore.get(key);
    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + this.rateLimitWindowMs,
      });
      return;
    }
    if (entry.count >= this.rateLimitMax) {
      throw new HttpException(
        'Demasiadas reservas. Intente más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    entry.count += 1;
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
}
