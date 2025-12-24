import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAtencionDto } from './dto/create-atencion.dto';
import { EstadoAtencion } from '@prisma/client';

@Injectable()
export class AtencionesService {
  constructor(private prisma: PrismaService) {}

  async create(createAtencionDto: CreateAtencionDto) {
    // Verificar que el paciente existe
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: createAtencionDto.pacienteId },
    });

    if (!paciente) {
      throw new NotFoundException(`Paciente con ID ${createAtencionDto.pacienteId} no encontrado`);
    }

    // Verificar que el médico existe
    const medico = await this.prisma.medico.findUnique({
      where: { id: createAtencionDto.medicoId },
    });

    if (!medico) {
      throw new NotFoundException(`Médico con ID ${createAtencionDto.medicoId} no encontrado`);
    }

    return this.prisma.atencion.create({
      data: {
        pacienteId: createAtencionDto.pacienteId,
        medicoId: createAtencionDto.medicoId,
        estado: EstadoAtencion.EN_ESPERA,
        observaciones: createAtencionDto.observaciones,
      },
      include: {
        paciente: true,
        medico: {
          include: {
            usuario: true,
          },
        },
      },
    });
  }

  /**
   * Crear nueva atención en estado ATENDIENDO para nueva consulta
   * (usado cuando se necesita crear nueva historia clínica después de 24h)
   */
  async createNuevaConsulta(createAtencionDto: CreateAtencionDto) {
    // Verificar que el paciente existe
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: createAtencionDto.pacienteId },
    });

    if (!paciente) {
      throw new NotFoundException(`Paciente con ID ${createAtencionDto.pacienteId} no encontrado`);
    }

    // Verificar que el médico existe
    const medico = await this.prisma.medico.findUnique({
      where: { id: createAtencionDto.medicoId },
    });

    if (!medico) {
      throw new NotFoundException(`Médico con ID ${createAtencionDto.medicoId} no encontrado`);
    }

    return this.prisma.atencion.create({
      data: {
        pacienteId: createAtencionDto.pacienteId,
        medicoId: createAtencionDto.medicoId,
        estado: EstadoAtencion.ATENDIENDO,
        horaAtencion: new Date(),
        observaciones: createAtencionDto.observaciones,
      },
      include: {
        paciente: true,
        medico: {
          include: {
            usuario: true,
          },
        },
      },
    });
  }

  /**
   * Obtener todas las atenciones activas (EN_ESPERA) para un médico
   * Ordenadas por hora de ingreso (más antiguas primero)
   */
  async findActivasByMedico(medicoId: number) {
    return this.prisma.atencion.findMany({
      where: {
        medicoId,
        estado: EstadoAtencion.EN_ESPERA,
      },
      include: {
        paciente: true,
      },
      orderBy: {
        horaIngreso: 'asc',
      },
    });
  }

  /**
   * Obtener todas las atenciones activas (EN_ESPERA) de todos los médicos
   */
  async findActivas() {
    return this.prisma.atencion.findMany({
      where: {
        estado: EstadoAtencion.EN_ESPERA,
      },
      include: {
        paciente: true,
        medico: {
          include: {
            usuario: true,
          },
        },
      },
      orderBy: {
        horaIngreso: 'asc',
      },
    });
  }

  /**
   * Cambiar estado a ATENDIENDO y registrar hora de atención
   */
  async atender(id: number, medicoId: number) {
    const atencion = await this.prisma.atencion.findUnique({
      where: { id },
      include: {
        paciente: true,
        medico: true,
      },
    });

    if (!atencion) {
      throw new NotFoundException(`Atención con ID ${id} no encontrada`);
    }

    if (atencion.medicoId !== medicoId) {
      throw new BadRequestException('Solo el médico asignado puede atender esta atención');
    }

    if (atencion.estado !== EstadoAtencion.EN_ESPERA) {
      throw new BadRequestException(`La atención no está en estado EN_ESPERA. Estado actual: ${atencion.estado}`);
    }

    return this.prisma.atencion.update({
      where: { id },
      data: {
        estado: EstadoAtencion.ATENDIENDO,
        horaAtencion: new Date(),
      },
      include: {
        paciente: true,
        medico: {
          include: {
            usuario: true,
          },
        },
      },
    });
  }

  /**
   * Cambiar estado a FINALIZADO (usado cuando se guarda la historia clínica)
   */
  async finalizar(id: number) {
    const atencion = await this.prisma.atencion.findUnique({
      where: { id },
    });

    if (!atencion) {
      throw new NotFoundException(`Atención con ID ${id} no encontrada`);
    }

    return this.prisma.atencion.update({
      where: { id },
      data: {
        estado: EstadoAtencion.FINALIZADO,
      },
    });
  }

  async findOne(id: number) {
    const atencion = await this.prisma.atencion.findUnique({
      where: { id },
      include: {
        paciente: true,
        medico: {
          include: {
            usuario: true,
          },
        },
        historia: true,
      },
    });

    if (!atencion) {
      throw new NotFoundException(`Atención con ID ${id} no encontrada`);
    }

    return atencion;
  }

  /**
   * Obtener atenciones en estado ATENDIENDO para un médico
   * Incluye información sobre si tiene historia clínica o no
   */
  async findAtendiendoByMedico(medicoId: number) {
    const atenciones = await this.prisma.atencion.findMany({
      where: {
        medicoId,
        estado: EstadoAtencion.ATENDIENDO,
      },
      include: {
        paciente: true,
      },
      orderBy: {
        horaAtencion: 'desc',
      },
    });

    // Verificar si cada atención tiene historia clínica
    const atencionesConHistoria = await Promise.all(
      atenciones.map(async (atencion) => {
        const historia = await this.prisma.historiaClinica.findUnique({
          where: { atencionId: atencion.id },
          select: { id: true, createdAt: true },
        });

        return {
          ...atencion,
          tieneHistoriaClinica: !!historia,
          historiaId: historia?.id || null,
        };
      }),
    );

    return atencionesConHistoria;
  }
}


