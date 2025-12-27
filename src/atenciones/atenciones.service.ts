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
        prioridad: createAtencionDto.prioridad || false,
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
   * Incluye pagos asociados para mostrar observaciones
   */
  async findActivasByMedico(medicoId: number) {
    const atenciones = await this.prisma.atencion.findMany({
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

    // Agregar pagos asociados a cada atención
    const atencionesConPagos = await Promise.all(
      atenciones.map(async (atencion) => {
        const fechaAtencion = new Date(atencion.createdAt);
        const fechaDesde = new Date(fechaAtencion);
        fechaDesde.setHours(fechaDesde.getHours() - 2);
        const fechaHasta = new Date(fechaAtencion);
        fechaHasta.setHours(fechaHasta.getHours() + 1);

        const pagoAsociado = await this.prisma.pago.findFirst({
          where: {
            pacienteId: atencion.pacienteId,
            fechaPago: {
              gte: fechaDesde,
              lte: fechaHasta,
            },
            historiaClinicaId: null,
          },
          orderBy: {
            fechaPago: 'desc',
          },
        });

        return {
          ...atencion,
          pagoAsociado,
        };
      }),
    );

    return atencionesConPagos;
  }

  /**
   * Obtener todas las atenciones activas (EN_ESPERA) de todos los médicos
   * Incluye pagos asociados para mostrar observaciones
   */
  async findActivas() {
    const atenciones = await this.prisma.atencion.findMany({
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

    // Agregar pagos asociados a cada atención
    const atencionesConPagos = await Promise.all(
      atenciones.map(async (atencion) => {
        const fechaAtencion = new Date(atencion.createdAt);
        const fechaDesde = new Date(fechaAtencion);
        fechaDesde.setHours(fechaDesde.getHours() - 2);
        const fechaHasta = new Date(fechaAtencion);
        fechaHasta.setHours(fechaHasta.getHours() + 1);

        const pagoAsociado = await this.prisma.pago.findFirst({
          where: {
            pacienteId: atencion.pacienteId,
            fechaPago: {
              gte: fechaDesde,
              lte: fechaHasta,
            },
            historiaClinicaId: null,
          },
          orderBy: {
            fechaPago: 'desc',
          },
        });

        return {
          ...atencion,
          pagoAsociado,
        };
      }),
    );

    return atencionesConPagos;
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

    // Verificar si cada atención tiene historia clínica y agregar pagos asociados
    const atencionesConHistoria = await Promise.all(
      atenciones.map(async (atencion) => {
        const historia = await this.prisma.historiaClinica.findUnique({
          where: { atencionId: atencion.id },
          select: { id: true, createdAt: true },
        });

        // Buscar pago asociado
        const fechaAtencion = new Date(atencion.createdAt);
        const fechaDesde = new Date(fechaAtencion);
        fechaDesde.setHours(fechaDesde.getHours() - 2);
        const fechaHasta = new Date(fechaAtencion);
        fechaHasta.setHours(fechaHasta.getHours() + 1);

        const pagoAsociado = await this.prisma.pago.findFirst({
          where: {
            pacienteId: atencion.pacienteId,
            fechaPago: {
              gte: fechaDesde,
              lte: fechaHasta,
            },
            historiaClinicaId: null,
          },
          orderBy: {
            fechaPago: 'desc',
          },
        });

        return {
          ...atencion,
          tieneHistoriaClinica: !!historia,
          historiaId: historia?.id || null,
          pagoAsociado,
        };
      }),
    );

    return atencionesConHistoria;
  }

  /**
   * Cancelar una atención (eliminar de sala de espera)
   * Solo se puede cancelar si está en estado EN_ESPERA o ATENDIENDO
   * También elimina los pagos asociados que se crearon al enviar el paciente a sala de espera
   * @param medicoId - Opcional. Si se proporciona, valida que el médico sea el asignado
   */
  async cancelar(id: number, medicoId?: number) {
    const atencion = await this.prisma.atencion.findUnique({
      where: { id },
      include: {
        paciente: true,
        medico: true,
        historia: {
          include: {
            pagos: true,
          },
        },
      },
    });

    if (!atencion) {
      throw new NotFoundException(`Atención con ID ${id} no encontrada`);
    }

    // Solo validar médico si se proporciona (para médicos, no para secretarias)
    if (medicoId !== undefined && atencion.medicoId !== medicoId) {
      throw new BadRequestException('Solo el médico asignado puede cancelar esta atención');
    }

    if (atencion.estado === EstadoAtencion.FINALIZADO) {
      throw new BadRequestException('No se puede cancelar una atención finalizada');
    }

    // Si no se proporciona medicoId (secretaria), solo puede cancelar atenciones en espera
    if (medicoId === undefined && atencion.estado !== EstadoAtencion.EN_ESPERA) {
      throw new BadRequestException('Solo se pueden remover pacientes de sala de espera, no de atención');
    }

    // Buscar y eliminar pagos asociados a esta atención
    // Los pagos se crean cuando se envía el paciente a sala de espera (antes de crear la atención)
    // Buscamos pagos del mismo paciente que:
    // 1. Se crearon cerca del momento de creación de la atención (dentro de 2 horas)
    // 2. No tienen historia clínica asociada (son pagos de sala de espera, no de consultas completadas)
    const fechaAtencion = new Date(atencion.createdAt);
    const fechaDesde = new Date(fechaAtencion);
    fechaDesde.setHours(fechaDesde.getHours() - 2); // 2 horas antes de la atención
    const fechaHasta = new Date(fechaAtencion);
    fechaHasta.setHours(fechaHasta.getHours() + 1); // 1 hora después (por si acaso)

    // Buscar pagos del mismo paciente que se crearon cerca del momento de la atención
    // Solo pagos sin historia clínica (pagos de sala de espera)
    const pagosAsociados = await this.prisma.pago.findMany({
      where: {
        pacienteId: atencion.pacienteId,
        fechaPago: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
        // Solo eliminar pagos que no tienen historia clínica (pagos de sala de espera)
        historiaClinicaId: null,
      },
    });

    // Eliminar los pagos asociados
    if (pagosAsociados.length > 0) {
      await this.prisma.pago.deleteMany({
        where: {
          id: {
            in: pagosAsociados.map((p) => p.id),
          },
        },
      });
    }

    // Eliminar la atención
    return this.prisma.atencion.delete({
      where: { id },
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
   * Obtener todas las atenciones activas (EN_ESPERA y ATENDIENDO) para la secretaria
   * Incluye pagos asociados para mostrar observaciones
   */
  async findActivasParaSecretaria() {
    try {
      const atenciones = await this.prisma.atencion.findMany({
        where: {
          estado: {
            in: [EstadoAtencion.EN_ESPERA, EstadoAtencion.ATENDIENDO],
          },
          paciente: {
            activo: true,
          },
        },
        include: {
          paciente: true,
          medico: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          horaIngreso: 'asc',
        },
      });

      // Agregar pagos asociados a cada atención
      const atencionesConPagos = await Promise.all(
        atenciones.map(async (atencion) => {
          const fechaAtencion = new Date(atencion.createdAt);
          const fechaDesde = new Date(fechaAtencion);
          fechaDesde.setHours(fechaDesde.getHours() - 2);
          const fechaHasta = new Date(fechaAtencion);
          fechaHasta.setHours(fechaHasta.getHours() + 1);

          const pagoAsociado = await this.prisma.pago.findFirst({
            where: {
              pacienteId: atencion.pacienteId,
              fechaPago: {
                gte: fechaDesde,
                lte: fechaHasta,
              },
              historiaClinicaId: null,
            },
            orderBy: {
              fechaPago: 'desc',
            },
          });

          return {
            ...atencion,
            pagoAsociado,
          };
        }),
      );

      return atencionesConPagos;
    } catch (error) {
      console.error('Error en findActivasParaSecretaria:', error);
      throw error;
    }
  }
}


