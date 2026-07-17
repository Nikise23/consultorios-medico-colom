import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EstadoCita } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import { AgendaService } from '../agenda/agenda.service';
import {
  diaSemanaConsultorio,
  finDelDiaConsultorio,
  formatFechaConsultorio,
  inicioDelDiaConsultorio,
  parseDateTimeConsultorio,
} from '../common/consultorio-time';
import { CitasService } from '../citas/citas.service';
import {
  CitaConRelaciones,
  NotificacionesCitaService,
} from '../citas/notificaciones-cita.service';
import { MedicosService } from '../medicos/medicos.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReservarTurnoDto } from './dto/reservar-turno.dto';
import { ValidarPacienteDto } from './dto/validar-paciente.dto';

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const PACIENTE_TOKEN_TTL_SECONDS = 30 * 60;

interface PacienteTokenPayload {
  purpose: 'public-booking';
  pacienteId: number;
  dni: string;
  exp: number;
}

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

    const diaSemana = diaSemanaConsultorio(fecha);
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

    const inicioDia = inicioDelDiaConsultorio(fecha);
    const finDia = finDelDiaConsultorio(fecha);

    const citas = await this.prisma.cita.findMany({
      where: {
        medicoId,
        estado: { notIn: [EstadoCita.CANCELADA] },
        fechaHora: { gte: inicioDia, lte: finDia },
      },
      select: { fechaHora: true, duracionMinutos: true },
    });

    const candidatos = this.agendaService.generarSlotsCandidatos(
      fecha,
      franjas,
    );
    const bloqueosDia = await this.agendaService.getBloqueosDelDia(
      medicoId,
      fecha,
    );
    const slots: string[] = [];

    for (const slot of candidatos) {
      if (slot < minimo || slot > maximo) continue;

      const franja = franjas.find((f) => {
        const inicio = parseDateTimeConsultorio(fecha, f.horaInicio);
        const fin = parseDateTimeConsultorio(fecha, f.horaFin);
        return slot >= inicio && slot < fin;
      });
      const duracion = franja?.slotMinutos ?? 20;

      if (
        this.agendaService.solapaConAlguna(slot, duracion, citas) ||
        this.agendaService.slotSolapaBloqueo(
          slot,
          duracion,
          fecha,
          bloqueosDia,
        )
      ) {
        continue;
      }
      slots.push(slot.toISOString());
    }

    return { fecha, medicoId, slots };
  }

  async validarPaciente(dto: ValidarPacienteDto, clientKey: string) {
    this.checkRateLimit(
      `validar-paciente:${clientKey}`,
      'Demasiados intentos de validación. Intente más tarde.',
    );

    const dni = dto.dni.replace(/\D/g, '');
    const paciente = dni ? await this.pacientesService.findByDni(dni) : null;
    const fechaRegistrada = paciente?.fechaNacimiento
      ? paciente.fechaNacimiento.toISOString().slice(0, 10)
      : null;

    if (
      !paciente ||
      !paciente.activo ||
      fechaRegistrada !== dto.fechaNacimiento
    ) {
      throw new UnauthorizedException(
        'No pudimos validar los datos ingresados. Revisalos o continuá como paciente nuevo.',
      );
    }

    return {
      validado: true,
      pacienteToken: this.firmarPacienteToken({
        purpose: 'public-booking',
        pacienteId: paciente.id,
        dni: paciente.dni,
        exp: Math.floor(Date.now() / 1000) + PACIENTE_TOKEN_TTL_SECONDS,
      }),
      expiresInSeconds: PACIENTE_TOKEN_TTL_SECONDS,
    };
  }

  async reservar(dto: ReservarTurnoDto, clientKey: string) {
    this.checkRateLimit(
      `reservar:${clientKey}`,
      'Demasiadas reservas. Intente más tarde.',
    );

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

    const esPacienteValidado = Boolean(dto.pacienteToken);
    let paciente;

    if (dto.pacienteToken) {
      const token = this.verificarPacienteToken(dto.pacienteToken);
      paciente = await this.pacientesService.findByDni(token.dni);
      if (!paciente || !paciente.activo || paciente.id !== token.pacienteId) {
        throw new UnauthorizedException(
          'La validación del paciente venció. Volvé a ingresar DNI y fecha de nacimiento.',
        );
      }
    } else {
      const dni = (dto.dni ?? '').replace(/\D/g, '');
      const existente = await this.pacientesService.findByDni(dni);
      if (existente?.fechaNacimiento) {
        throw new BadRequestException(
          'Ese DNI ya está registrado. Volvé al inicio y elegí “Ya soy paciente”.',
        );
      }

      if (existente) {
        // Paciente registrado sin fecha de nacimiento: no puede validarse como
        // frecuente, así que actualizamos su ficha y dejamos que reserve.
        paciente = await this.pacientesService.update(existente.id, {
          nombre: dto.nombre,
          apellido: dto.apellido,
          obraSocial: dto.obraSocial,
          telefono: dto.telefono,
          email: dto.email,
          fechaNacimiento: dto.fechaNacimiento,
        });
      } else {
        paciente = await this.pacientesService.create({
          dni,
          nombre: dto.nombre!,
          apellido: dto.apellido!,
          obraSocial: dto.obraSocial!,
          telefono: dto.telefono!,
          email: dto.email,
          fechaNacimiento: dto.fechaNacimiento,
        });
      }
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
      paciente: esPacienteValidado
        ? null
        : {
            nombre: cita.paciente.nombre,
            apellido: cita.paciente.apellido,
          },
      calendario,
    };
  }

  private firmarPacienteToken(payload: PacienteTokenPayload): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signature = createHmac('sha256', this.getPacienteTokenSecret())
      .update(encodedPayload)
      .digest('base64url');
    return `${encodedPayload}.${signature}`;
  }

  private verificarPacienteToken(token: string): PacienteTokenPayload {
    try {
      const [encodedPayload, signature] = token.split('.');
      if (!encodedPayload || !signature) throw new Error('Token incompleto');

      const expected = createHmac('sha256', this.getPacienteTokenSecret())
        .update(encodedPayload)
        .digest();
      const received = Buffer.from(signature, 'base64url');
      if (
        expected.length !== received.length ||
        !timingSafeEqual(expected, received)
      ) {
        throw new Error('Firma inválida');
      }

      const payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as PacienteTokenPayload;
      if (
        payload.purpose !== 'public-booking' ||
        !payload.pacienteId ||
        !payload.dni ||
        payload.exp <= Math.floor(Date.now() / 1000)
      ) {
        throw new Error('Token inválido o vencido');
      }
      return payload;
    } catch {
      throw new UnauthorizedException(
        'La validación del paciente venció. Volvé a ingresar DNI y fecha de nacimiento.',
      );
    }
  }

  private getPacienteTokenSecret(): string {
    const secret =
      this.config.get<string>('PUBLIC_PATIENT_TOKEN_SECRET') ||
      this.config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        'PUBLIC_PATIENT_TOKEN_SECRET o JWT_SECRET debe estar configurado',
      );
    }
    return secret;
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
      const inicio = parseDateTimeConsultorio(
        formatFechaConsultorio(fechaBase),
        franja.horaInicio,
      );
      const fin = parseDateTimeConsultorio(
        formatFechaConsultorio(fechaBase),
        franja.horaFin,
      );
      if (fechaHora >= inicio && fechaHora < fin) {
        return franja.slotMinutos;
      }
    }

    return 20;
  }

  private checkRateLimit(key: string, message: string) {
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
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }
    entry.count += 1;
  }
}
