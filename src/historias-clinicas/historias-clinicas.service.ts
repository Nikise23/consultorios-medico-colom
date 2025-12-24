import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHistoriaClinicaDto } from './dto/create-historia-clinica.dto';
import { UpdateHistoriaClinicaDto } from './dto/update-historia-clinica.dto';
import { SearchHistoriaClinicaDto } from './dto/search-historia-clinica.dto';
import { EstadoAtencion } from '@prisma/client';
import { AtencionesService } from '../atenciones/atenciones.service';

@Injectable()
export class HistoriasClinicasService {
  constructor(
    private prisma: PrismaService,
    private atencionesService: AtencionesService,
  ) {}

  async create(createHistoriaClinicaDto: CreateHistoriaClinicaDto, medicoId: number) {
    // Verificar que la atención existe y está en estado ATENDIENDO
    const atencion = await this.prisma.atencion.findUnique({
      where: { id: createHistoriaClinicaDto.atencionId },
      include: {
        paciente: true,
        medico: true,
      },
    });

    if (!atencion) {
      throw new NotFoundException(`Atención con ID ${createHistoriaClinicaDto.atencionId} no encontrada`);
    }

    if (atencion.medicoId !== medicoId) {
      throw new BadRequestException('Solo el médico asignado puede crear la historia clínica');
    }

    if (atencion.estado !== EstadoAtencion.ATENDIENDO) {
      throw new BadRequestException(`La atención debe estar en estado ATENDIENDO. Estado actual: ${atencion.estado}`);
    }

    // Verificar que no existe ya una historia clínica para esta atención
    const historiaExistente = await this.prisma.historiaClinica.findUnique({
      where: { atencionId: createHistoriaClinicaDto.atencionId },
    });

    if (historiaExistente) {
      throw new BadRequestException('Ya existe una historia clínica para esta atención');
    }

    // Crear la historia clínica
    const historia = await this.prisma.historiaClinica.create({
      data: {
        atencionId: createHistoriaClinicaDto.atencionId,
        pacienteId: atencion.pacienteId,
        medicoId: atencion.medicoId,
        motivoConsulta: createHistoriaClinicaDto.motivoConsulta,
        sintomas: createHistoriaClinicaDto.sintomas,
        diagnostico: createHistoriaClinicaDto.diagnostico,
        tratamiento: createHistoriaClinicaDto.tratamiento,
        observaciones: createHistoriaClinicaDto.observaciones,
        presionArterial: createHistoriaClinicaDto.presionArterial,
        temperatura: createHistoriaClinicaDto.temperatura,
        peso: createHistoriaClinicaDto.peso,
        altura: createHistoriaClinicaDto.altura,
        proximoControl: createHistoriaClinicaDto.proximoControl
          ? new Date(createHistoriaClinicaDto.proximoControl)
          : null,
      },
    });

    // Cambiar el estado de la atención a FINALIZADO
    await this.atencionesService.finalizar(createHistoriaClinicaDto.atencionId);

    // Retornar la historia con la atención actualizada
    return this.prisma.historiaClinica.findUnique({
      where: { id: historia.id },
      include: {
        paciente: true,
        medico: {
          include: {
            usuario: true,
          },
        },
        atencion: true,
      },
    });
  }

  async update(id: number, updateHistoriaClinicaDto: UpdateHistoriaClinicaDto, medicoId: number) {
    const historia = await this.prisma.historiaClinica.findUnique({
      where: { id },
    });

    if (!historia) {
      throw new NotFoundException(`Historia clínica con ID ${id} no encontrada`);
    }

    if (historia.medicoId !== medicoId) {
      throw new BadRequestException('Solo el médico que creó la historia puede modificarla');
    }

    // Validar que no hayan pasado más de 24 horas desde la creación
    const ahora = new Date();
    const fechaCreacion = new Date(historia.createdAt);
    const horasTranscurridas = (ahora.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60);

    if (horasTranscurridas > 24) {
      throw new BadRequestException(
        'No se puede modificar la historia clínica después de 24 horas. Debe crear una nueva historia clínica.',
      );
    }

    return this.prisma.historiaClinica.update({
      where: { id },
      data: {
        motivoConsulta: updateHistoriaClinicaDto.motivoConsulta,
        sintomas: updateHistoriaClinicaDto.sintomas,
        diagnostico: updateHistoriaClinicaDto.diagnostico,
        tratamiento: updateHistoriaClinicaDto.tratamiento,
        observaciones: updateHistoriaClinicaDto.observaciones,
        presionArterial: updateHistoriaClinicaDto.presionArterial,
        temperatura: updateHistoriaClinicaDto.temperatura,
        peso: updateHistoriaClinicaDto.peso,
        altura: updateHistoriaClinicaDto.altura,
        proximoControl: updateHistoriaClinicaDto.proximoControl
          ? new Date(updateHistoriaClinicaDto.proximoControl)
          : undefined,
      },
      include: {
        paciente: true,
        medico: {
          include: {
            usuario: true,
          },
        },
        atencion: true,
      },
    });
  }

  /**
   * Obtener historias clínicas del médico del día actual
   */
  async findByMedicoHoy(medicoId: number) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    return this.prisma.historiaClinica.findMany({
      where: {
        medicoId,
        fechaConsulta: {
          gte: hoy,
          lt: mañana,
        },
      },
      include: {
        paciente: true,
        atencion: {
          include: {
            paciente: true,
          },
        },
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
        fechaConsulta: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const historia = await this.prisma.historiaClinica.findUnique({
      where: { id },
      include: {
        paciente: true,
        medico: {
          include: {
            usuario: true,
          },
        },
        atencion: true,
      },
    });

    if (!historia) {
      throw new NotFoundException(`Historia clínica con ID ${id} no encontrada`);
    }

    return historia;
  }

  /**
   * Buscar historias clínicas con filtros
   */
  async search(searchDto: SearchHistoriaClinicaDto) {
    const { pacienteId, dni, apellido, medicoId, especialidad, fechaDesde, fechaHasta } = searchDto;

    const where: any = {};

    // Si se busca por DNI o apellido, primero encontrar los pacientes
    if ((dni && dni.trim()) || (apellido && apellido.trim())) {
      const pacienteWhere: any = {};
      if (dni && dni.trim()) {
        pacienteWhere.dni = dni.trim();
      }
      if (apellido && apellido.trim()) {
        try {
          pacienteWhere.apellido = {
            contains: apellido.trim(),
            mode: 'insensitive',
          };
        } catch (error) {
          // Fallback a case-sensitive si el modo insensitive falla
          pacienteWhere.apellido = {
            contains: apellido.trim(),
          };
        }
      }
      pacienteWhere.activo = true;

      const pacientes = await this.prisma.paciente.findMany({
        where: pacienteWhere,
        select: { id: true },
      });

      if (pacientes.length === 0) {
        return [];
      }

      where.pacienteId = {
        in: pacientes.map((p) => p.id),
      };
    } else if (pacienteId) {
      where.pacienteId = pacienteId;
    }

    if (medicoId) {
      where.medicoId = medicoId;
    }

    // Filtro por especialidad
    if (especialidad && especialidad.trim()) {
      // Primero encontrar médicos con esa especialidad
      try {
        const medicos = await this.prisma.medico.findMany({
          where: {
            especialidad: {
              contains: especialidad.trim(),
              mode: 'insensitive',
            },
            activo: true,
          },
          select: { id: true },
        });

        if (medicos.length === 0) {
          return [];
        }

        if (where.medicoId) {
          // Si ya hay filtro por médico, verificar que coincida
          const medicoIds = medicos.map((m) => m.id);
          if (!medicoIds.includes(where.medicoId)) {
            return [];
          }
        } else {
          where.medicoId = {
            in: medicos.map((m) => m.id),
          };
        }
      } catch (error) {
        // Fallback a case-sensitive si el modo insensitive falla
        const medicos = await this.prisma.medico.findMany({
          where: {
            especialidad: {
              contains: especialidad.trim(),
            },
            activo: true,
          },
          select: { id: true },
        });

        if (medicos.length === 0) {
          return [];
        }

        if (where.medicoId) {
          const medicoIds = medicos.map((m) => m.id);
          if (!medicoIds.includes(where.medicoId)) {
            return [];
          }
        } else {
          where.medicoId = {
            in: medicos.map((m) => m.id),
          };
        }
      }
    }

    if (fechaDesde || fechaHasta) {
      where.fechaConsulta = {};
      if (fechaDesde) {
        where.fechaConsulta.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        // Agregar un día completo para incluir todo el día
        const fechaHastaDate = new Date(fechaHasta);
        fechaHastaDate.setHours(23, 59, 59, 999);
        where.fechaConsulta.lte = fechaHastaDate;
      }
    }

    return this.prisma.historiaClinica.findMany({
      where,
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
        atencion: true,
      },
      orderBy: {
        fechaConsulta: 'desc',
      },
      take: 100,
    });
  }

  /**
   * Obtener todas las historias clínicas de un paciente
   * Puede buscar por ID, DNI o apellido
   */
  async findByPaciente(pacienteIdOrDniOrApellido: string | number) {
    let pacienteId: number;

    // Si es un número, asumir que es ID
    if (typeof pacienteIdOrDniOrApellido === 'number') {
      pacienteId = pacienteIdOrDniOrApellido;
    } else {
      const searchValue = pacienteIdOrDniOrApellido.trim();
      // Buscar paciente por DNI o apellido
      try {
        const paciente = await this.prisma.paciente.findFirst({
          where: {
            OR: [
              { dni: searchValue },
              {
                apellido: {
                  contains: searchValue,
                  mode: 'insensitive',
                },
              },
            ],
            activo: true,
          },
          select: { id: true },
        });

        if (!paciente) {
          return [];
        }

        pacienteId = paciente.id;
      } catch (error) {
        // Fallback a case-sensitive si el modo insensitive falla
        const paciente = await this.prisma.paciente.findFirst({
          where: {
            OR: [
              { dni: searchValue },
              {
                apellido: {
                  contains: searchValue,
                },
              },
            ],
            activo: true,
          },
          select: { id: true },
        });

        if (!paciente) {
          return [];
        }

        pacienteId = paciente.id;
      }
    }

    return this.prisma.historiaClinica.findMany({
      where: { pacienteId },
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
        atencion: true,
      },
      orderBy: {
        fechaConsulta: 'desc',
      },
    });
  }
}

