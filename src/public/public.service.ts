import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EstadoCita } from '@prisma/client';
import { CitasService } from '../citas/citas.service';
import {
  CitaConRelaciones,
  NotificacionesCitaService,
} from '../citas/notificaciones-cita.service';
import { MedicosService } from '../medicos/medicos.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReservarTurnoDto } from './dto/reservar-turno.dto';

interface FranjaHoraria {
  inicio: string;
  fin: string;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

@Injectable()
export class PublicService {
  private readonly slotMinutos: number;
  private readonly anticipacionMinHoras: number;
  private readonly anticipacionMaxDias: number;
  private readonly diasAtencion: Set<number>;
  private readonly franjas: FranjaHoraria[];
  private readonly rateLimitMax: number;
  private readonly rateLimitWindowMs: number;

  constructor(
    private config: ConfigService,
    private medicosService: MedicosService,
    private pacientesService: PacientesService,
    private citasService: CitasService,
    private prisma: PrismaService,
    private notificaciones: NotificacionesCitaService,
  ) {
    this.slotMinutos = Number(
      this.config.get('PUBLIC_TURNOS_SLOT_MINUTOS') ?? 20,
    );
    this.anticipacionMinHoras = Number(
      this.config.get('PUBLIC_TURNOS_ANTICIPACION_MIN_HORAS') ?? 2,
    );
    this.anticipacionMaxDias = Number(
      this.config.get('PUBLIC_TURNOS_ANTICIPACION_MAX_DIAS') ?? 60,
    );
    this.diasAtencion = this.parseDias(
      this.config.get('PUBLIC_TURNOS_DIAS') ?? '1,2,3,4,5',
    );
    this.franjas = this.parseFranjas(
      this.config.get('PUBLIC_TURNOS_FRANJAS') ??
        '09:00-13:00,16:00-20:00',
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

  async disponibilidad(medicoId: number, fecha: string) {
    const medico = await this.medicosService.findOne(medicoId);
    if (!medico || !medico.activo) {
      throw new NotFoundException('Profesional no encontrado');
    }

    const fechaBase = this.parseFechaLocal(fecha);
    const diaSemana = fechaBase.getDay();
    if (!this.diasAtencion.has(diaSemana)) {
      return { fecha, medicoId, slots: [] as string[] };
    }

    const ahora = new Date();
    const minimo = new Date(
      ahora.getTime() + this.anticipacionMinHoras * 60 * 60 * 1000,
    );
    const maximo = new Date(
      ahora.getTime() + this.anticipacionMaxDias * 24 * 60 * 60 * 1000,
    );

    if (fechaBase > this.finDelDia(maximo)) {
      throw new BadRequestException(
        `Solo se pueden reservar turnos hasta ${this.anticipacionMaxDias} días`,
      );
    }

    const inicioDia = this.inicioDelDia(fechaBase);
    const finDia = this.finDelDia(fechaBase);

    const citas = await this.prisma.cita.findMany({
      where: {
        medicoId,
        estado: { notIn: [EstadoCita.CANCELADA] },
        fechaHora: { gte: inicioDia, lte: finDia },
      },
      select: { fechaHora: true, duracionMinutos: true },
    });

    const candidatos = this.generarSlotsCandidatos(fechaBase);
    const slots: string[] = [];

    for (const slot of candidatos) {
      if (slot < minimo || slot > maximo) continue;
      if (this.solapaConAlguna(slot, this.slotMinutos, citas)) continue;
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
    const fechaStr = this.formatFechaLocal(fechaHora);
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

    const cita = await this.citasService.create({
      pacienteId: paciente.id,
      medicoId: dto.medicoId,
      fechaHora: dto.fechaHora,
      duracionMinutos: dto.duracionMinutos ?? this.slotMinutos,
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

  private parseDias(raw: string): Set<number> {
    return new Set(
      raw.split(',').map((d) => {
        const n = Number(d.trim());
        return n === 7 ? 0 : n;
      }),
    );
  }

  private parseFranjas(raw: string): FranjaHoraria[] {
    return raw.split(',').map((part) => {
      const [inicio, fin] = part.trim().split('-');
      if (!inicio || !fin) {
        throw new Error('PUBLIC_TURNOS_FRANJAS inválido');
      }
      return { inicio: inicio.trim(), fin: fin.trim() };
    });
  }

  private parseFechaLocal(fecha: string): Date {
    const [y, m, d] = fecha.split('-').map(Number);
    if (!y || !m || !d) {
      throw new BadRequestException('Fecha inválida (use YYYY-MM-DD)');
    }
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  }

  private formatFechaLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private inicioDelDia(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  private finDelDia(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
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

  private generarSlotsCandidatos(fechaBase: Date): Date[] {
    const slots: Date[] = [];
    for (const franja of this.franjas) {
      let cursor = this.parseHoraEnDia(fechaBase, franja.inicio);
      const finFranja = this.parseHoraEnDia(fechaBase, franja.fin);
      while (
        cursor.getTime() + this.slotMinutos * 60 * 1000 <=
        finFranja.getTime()
      ) {
        slots.push(new Date(cursor));
        cursor = new Date(cursor.getTime() + this.slotMinutos * 60 * 1000);
      }
    }
    return slots;
  }

  private solapaConAlguna(
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
}
