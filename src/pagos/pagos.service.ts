import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { SearchPagoDto } from './dto/search-pago.dto';
import { EstadoAtencion } from '@prisma/client';

@Injectable()
export class PagosService {
  constructor(private prisma: PrismaService) {}

  async create(createPagoDto: CreatePagoDto) {
    // Verificar que el paciente existe
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: createPagoDto.pacienteId },
    });

    if (!paciente) {
      throw new NotFoundException(`Paciente con ID ${createPagoDto.pacienteId} no encontrado`);
    }

    // Si hay historia clínica, verificar que existe
    if (createPagoDto.historiaClinicaId) {
      const historia = await this.prisma.historiaClinica.findUnique({
        where: { id: createPagoDto.historiaClinicaId },
      });

      if (!historia) {
        throw new NotFoundException(`Historia clínica con ID ${createPagoDto.historiaClinicaId} no encontrada`);
      }
    }

    // Si se proporciona medicoId, verificar que existe y crear una Atencion
    if (createPagoDto.medicoId) {
      const medico = await this.prisma.medico.findUnique({
        where: { id: createPagoDto.medicoId },
      });

      if (!medico) {
        throw new NotFoundException(`Médico con ID ${createPagoDto.medicoId} no encontrado`);
      }

      // Crear una Atencion para asociar el pago con el médico
      await this.prisma.atencion.create({
        data: {
          pacienteId: createPagoDto.pacienteId,
          medicoId: createPagoDto.medicoId,
          estado: EstadoAtencion.EN_ESPERA,
          observaciones: `Pago registrado - ${createPagoDto.observaciones || 'Sin observaciones'}`,
        },
      });
    }

    return this.prisma.pago.create({
      data: {
        pacienteId: createPagoDto.pacienteId,
        historiaClinicaId: createPagoDto.historiaClinicaId,
        monto: createPagoDto.monto,
        tipoPago: createPagoDto.tipoPago,
        numeroComprobante: createPagoDto.numeroComprobante,
        observaciones: createPagoDto.observaciones,
      },
      include: {
        paciente: true,
        historiaClinica: {
          include: {
            medico: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
    });
  }

  async findByPaciente(pacienteId: number) {
    const pagos = await this.prisma.pago.findMany({
      where: { pacienteId },
      include: {
        historiaClinica: {
          include: {
            medico: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaPago: 'desc',
      },
    });

    // Para pagos sin historia clínica, buscar el médico desde la Atencion más cercana
    const pagosConMedico = await Promise.all(
      pagos.map(async (pago) => {
        // Si ya tiene médico desde historia clínica, retornar tal cual
        if (pago.historiaClinica?.medico) {
          return pago;
        }

        // Buscar la Atencion más cercana al momento del pago (dentro de 2 horas)
        const fechaPago = new Date(pago.fechaPago);
        const fechaDesde = new Date(fechaPago);
        fechaDesde.setHours(fechaDesde.getHours() - 2);
        const fechaHasta = new Date(fechaPago);
        fechaHasta.setHours(fechaHasta.getHours() + 2);

        const atencion = await this.prisma.atencion.findFirst({
          where: {
            pacienteId: pago.pacienteId,
            horaIngreso: {
              gte: fechaDesde,
              lte: fechaHasta,
            },
          },
          include: {
            medico: {
              include: {
                usuario: true,
              },
            },
          },
          orderBy: {
            horaIngreso: 'desc',
          },
        });

        // Si se encuentra una atención, agregar el médico al pago
        if (atencion?.medico) {
          return {
            ...pago,
            atencion: {
              medico: atencion.medico,
            },
          };
        }

        return pago;
      }),
    );

    return pagosConMedico;
  }

  async search(searchDto: SearchPagoDto) {
    const { pacienteId, fechaDesde, fechaHasta, tipoPago } = searchDto;

    const where: any = {};

    if (pacienteId) {
      where.pacienteId = pacienteId;
    }

    if (tipoPago) {
      where.tipoPago = tipoPago;
    }

    if (fechaDesde || fechaHasta) {
      where.fechaPago = {};
      if (fechaDesde) {
        where.fechaPago.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        const fechaHastaDate = new Date(fechaHasta);
        fechaHastaDate.setHours(23, 59, 59, 999);
        where.fechaPago.lte = fechaHastaDate;
      }
    }

    const pagos = await this.prisma.pago.findMany({
      where,
      include: {
        paciente: true,
        historiaClinica: {
          include: {
            medico: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaPago: 'desc',
      },
      take: 100,
    });

    // Para pagos sin historia clínica, buscar el médico desde la Atencion más cercana
    const pagosConMedico = await Promise.all(
      pagos.map(async (pago) => {
        // Si ya tiene médico desde historia clínica, retornar tal cual
        if (pago.historiaClinica?.medico) {
          return pago;
        }

        // Buscar la Atencion más cercana al momento del pago (dentro de 2 horas)
        const fechaPago = new Date(pago.fechaPago);
        const fechaDesde = new Date(fechaPago);
        fechaDesde.setHours(fechaDesde.getHours() - 2);
        const fechaHasta = new Date(fechaPago);
        fechaHasta.setHours(fechaHasta.getHours() + 2);

        const atencion = await this.prisma.atencion.findFirst({
          where: {
            pacienteId: pago.pacienteId,
            horaIngreso: {
              gte: fechaDesde,
              lte: fechaHasta,
            },
          },
          include: {
            medico: {
              include: {
                usuario: true,
              },
            },
          },
          orderBy: {
            horaIngreso: 'desc',
          },
        });

        // Si se encuentra una atención, agregar el médico al pago
        if (atencion?.medico) {
          return {
            ...pago,
            atencion: {
              medico: atencion.medico,
            },
          };
        }

        return pago;
      }),
    );

    return pagosConMedico;
  }

  async findOne(id: number) {
    const pago = await this.prisma.pago.findUnique({
      where: { id },
      include: {
        paciente: true,
        historiaClinica: {
          include: {
            medico: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
    });

    if (!pago) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    return pago;
  }

  async getPagosByHistoriaClinica(historiaClinicaId: number) {
    return this.prisma.pago.findMany({
      where: { historiaClinicaId },
      include: {
        paciente: true,
      },
      orderBy: {
        fechaPago: 'desc',
      },
    });
  }

  async update(id: number, updatePagoDto: UpdatePagoDto) {
    await this.findOne(id); // Verifica que existe

    const dataToUpdate: any = {};

    if (updatePagoDto.monto !== undefined) {
      dataToUpdate.monto = updatePagoDto.monto;
    }
    if (updatePagoDto.tipoPago !== undefined) {
      dataToUpdate.tipoPago = updatePagoDto.tipoPago;
    }
    if (updatePagoDto.numeroComprobante !== undefined) {
      dataToUpdate.numeroComprobante = updatePagoDto.numeroComprobante || null;
    }
    if (updatePagoDto.observaciones !== undefined) {
      dataToUpdate.observaciones = updatePagoDto.observaciones || null;
    }

    return this.prisma.pago.update({
      where: { id },
      data: dataToUpdate,
      include: {
        paciente: true,
        historiaClinica: {
          include: {
            medico: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verifica que existe
    
    return this.prisma.pago.delete({
      where: { id },
    });
  }

  /**
   * Helper: Obtener médicoId desde usuarioId
   */
  private async getMedicoIdByUsuarioId(usuarioId: number): Promise<number | null> {
    const medico = await this.prisma.medico.findFirst({
      where: { usuarioId },
    });
    return medico ? medico.id : null;
  }

  /**
   * Helper: Convertir una fecha UTC a fecha en zona horaria de Argentina (formato YYYY-MM-DD)
   * 
   * Esta función toma una fecha UTC (como la que viene de la base de datos)
   * y la convierte a la fecha correspondiente en Argentina.
   * 
   * Ejemplo: Si un pago fue el 26/12 23:00 -03:00 = 27/12 02:00 UTC,
   * esta función debería retornar "2024-12-26" (no "2024-12-27")
   */
  private getFechaArgentina(fechaUTC: Date): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const partes = formatter.formatToParts(fechaUTC);
    const anio = partes.find(p => p.type === 'year')?.value || '';
    const mes = partes.find(p => p.type === 'month')?.value || '';
    const dia = partes.find(p => p.type === 'day')?.value || '';
    
    return `${anio}-${mes}-${dia}`;
  }

  /**
   * Helper: Obtener fecha de inicio del día en zona horaria de Argentina (UTC-3)
   * 
   * El día en Argentina va de 00:00:00 -03:00 a 23:59:59 -03:00
   * En UTC eso es de 03:00:00 UTC a 02:59:59 UTC del día siguiente
   * 
   * Ejemplo: Si hoy es 27/12 en Argentina:
   * - Día 27/12 en Argentina: 27/12 00:00:00 -03:00 a 28/12 00:00:00 -03:00
   * - En UTC: 27/12 03:00:00 UTC a 28/12 03:00:00 UTC
   */
  private getHoyArgentina(): { hoy: Date; mañana: Date; fechaString: string } {
    // Obtener la fecha y hora actual en la zona horaria de Argentina
    const ahora = new Date();
    
    // Usar Intl.DateTimeFormat para obtener la fecha en Argentina de forma confiable
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const partes = formatter.formatToParts(ahora);
    const anio = partes.find(p => p.type === 'year')?.value || '';
    const mes = partes.find(p => p.type === 'month')?.value || '';
    const dia = partes.find(p => p.type === 'day')?.value || '';
    
    // Crear fecha de inicio del día en Argentina (00:00:00) con offset -03:00
    // Esto crea una fecha que representa medianoche en Argentina
    const hoyArgentinaISO = `${anio}-${mes}-${dia}T00:00:00-03:00`;
    const hoyArgentina = new Date(hoyArgentinaISO);
    
    // Verificar que la fecha se creó correctamente
    if (isNaN(hoyArgentina.getTime())) {
      throw new Error(`Error al crear fecha de Argentina: ${hoyArgentinaISO}`);
    }
    
    // La fecha ya está en UTC internamente (JavaScript convierte automáticamente)
    // hoyArgentina representa 00:00:00 del día actual en Argentina, convertido a UTC
    // Por ejemplo: 27/12 00:00:00 -03:00 = 27/12 03:00:00 UTC
    
    const hoy = new Date(hoyArgentina);
    
    // Mañana es el inicio del día siguiente en Argentina
    // Calcular el día siguiente en Argentina usando Date para manejar cambios de mes/año automáticamente
    const fechaArgentina = new Date(`${anio}-${mes}-${dia}T12:00:00-03:00`); // Usar mediodía para evitar problemas de zona horaria
    fechaArgentina.setUTCDate(fechaArgentina.getUTCDate() + 1); // Sumar un día
    
    // Obtener la fecha del día siguiente en Argentina
    const formatterMañana = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const partesMañana = formatterMañana.formatToParts(fechaArgentina);
    const anioMañana = partesMañana.find(p => p.type === 'year')?.value || '';
    const mesMañana = partesMañana.find(p => p.type === 'month')?.value || '';
    const diaMañana = partesMañana.find(p => p.type === 'day')?.value || '';
    
    const mañanaISO = `${anioMañana}-${mesMañana}-${diaMañana}T00:00:00-03:00`;
    const mañanaArgentina = new Date(mañanaISO);
    
    if (isNaN(mañanaArgentina.getTime())) {
      throw new Error(`Error al crear fecha de mañana en Argentina: ${mañanaISO}`);
    }
    
    const mañana = new Date(mañanaArgentina);
    
    return {
      hoy,
      mañana,
      fechaString: `${anio}-${mes}-${dia}`
    };
  }

  /**
   * Obtener reporte de pagos del día actual
   */
  async getReporteDia(user?: any) {
    // Usar zona horaria de Argentina para determinar "hoy"
    const { hoy, mañana, fechaString } = this.getHoyArgentina();

    // Log para debugging (remover en producción si es necesario)
    console.log('🔍 getReporteDia - Fecha Argentina:', fechaString);
    console.log('🔍 getReporteDia - Hoy UTC:', hoy.toISOString());
    console.log('🔍 getReporteDia - Mañana UTC:', mañana.toISOString());

    // Construir el where clause
    const where: any = {
      fechaPago: {
        gte: hoy,
        lt: mañana,
      },
    };

    // Si es médico, filtrar por sus atenciones o historias clínicas
    if (user?.rol === 'MEDICO') {
      const medicoId = await this.getMedicoIdByUsuarioId(user.id);
      if (medicoId) {
        // Buscar atenciones del médico en el período
        const atenciones = await this.prisma.atencion.findMany({
          where: {
            medicoId: medicoId,
            horaIngreso: {
              gte: hoy,
              lt: mañana,
            },
          },
          select: {
            id: true,
            pacienteId: true,
            horaIngreso: true,
          },
        });

        if (atenciones.length === 0) {
          // Si no hay atenciones, retornar vacío
          return {
            fecha: fechaString,
            totalEfectivo: 0,
            totalTransferencia: 0,
            total: 0,
            cantidadPagos: 0,
            pagos: [],
          };
        }

        // Crear un mapa de atenciónId -> información de la atención
        // Necesitamos hacer match preciso entre pagos y atenciones
        const atencionIds = atenciones.map(a => a.id);
        
        // Obtener todos los pagos del período primero para hacer el match
        const todosLosPagos = await this.prisma.pago.findMany({
          where: {
            fechaPago: {
              gte: hoy,
              lt: mañana,
            },
            historiaClinicaId: null, // Solo pagos sin historia clínica
          },
          include: {
            paciente: true,
          },
          orderBy: {
            fechaPago: 'asc',
          },
        });

        // Hacer match entre pagos y atenciones: un pago corresponde a una atención si:
        // 1. Es del mismo paciente
        // 2. Se hizo el mismo día (o muy cerca, dentro de 2 horas) de cuando se creó la atención
        const pagosIdsMatch = new Set<number>();
        
        atenciones.forEach(atencion => {
          const fechaAtencion = new Date(atencion.horaIngreso);
          const pacienteId = atencion.pacienteId;
          
          // Buscar el pago más cercano en tiempo para esta atención
          const pagosDelPaciente = todosLosPagos.filter(p => 
            p.pacienteId === pacienteId && 
            !pagosIdsMatch.has(p.id) // No incluir pagos ya asignados
          );
          
          if (pagosDelPaciente.length > 0) {
            // Encontrar el pago más cercano en tiempo a la atención
            let pagoMasCercano = pagosDelPaciente[0];
            let diferenciaMinima = Math.abs(
              new Date(pagoMasCercano.fechaPago).getTime() - fechaAtencion.getTime()
            );
            
            for (const pago of pagosDelPaciente) {
              const diferencia = Math.abs(
                new Date(pago.fechaPago).getTime() - fechaAtencion.getTime()
              );
              if (diferencia < diferenciaMinima) {
                diferenciaMinima = diferencia;
                pagoMasCercano = pago;
              }
            }
            
            // Solo incluir si la diferencia es menor a 2 horas (7200000 ms)
            if (diferenciaMinima < 7200000) {
              pagosIdsMatch.add(pagoMasCercano.id);
            }
          }
        });

        // Filtrar pagos por:
        // 1. Historias clínicas del médico, O
        // 2. Pagos que hicieron match con atenciones del médico
        const condiciones: any[] = [
          {
            historiaClinica: {
              medicoId: medicoId,
            },
          },
        ];

        if (pagosIdsMatch.size > 0) {
          condiciones.push({
            id: {
              in: Array.from(pagosIdsMatch),
            },
          });
        }

        where.OR = condiciones;
      } else {
        // Si no tiene médico asociado, retornar vacío
        return {
          fecha: fechaString,
          totalEfectivo: 0,
          totalTransferencia: 0,
          total: 0,
          cantidadPagos: 0,
          pagos: [],
        };
      }
    }

    const pagos = await this.prisma.pago.findMany({
      where,
      include: {
        paciente: true,
        historiaClinica: {
          include: {
            medico: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaPago: 'desc',
      },
    });

    // Filtrar adicionalmente por fecha en Argentina para asegurar que solo incluimos pagos del día correcto
    // Esto es una doble verificación porque la consulta a la BD usa UTC
    const pagosFiltrados = pagos.filter((pago) => {
      const fechaPagoUTC = new Date(pago.fechaPago);
      const fechaPagoArgentina = this.getFechaArgentina(fechaPagoUTC);
      return fechaPagoArgentina === fechaString;
    });

    // Log para debugging - ver qué pagos se están retornando
    console.log('🔍 getReporteDia - Pagos encontrados en BD:', pagos.length);
    console.log('🔍 getReporteDia - Pagos filtrados por fecha Argentina:', pagosFiltrados.length);
    pagosFiltrados.forEach((pago, index) => {
      const fechaPagoUTC = new Date(pago.fechaPago);
      const fechaPagoArgentina = fechaPagoUTC.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
      });
      console.log(`🔍 Pago ${index + 1}:`, {
        id: pago.id,
        monto: pago.monto,
        tipoPago: pago.tipoPago,
        fechaPagoUTC: fechaPagoUTC.toISOString(),
        fechaPagoArgentina,
      });
    });

    // Usar los pagos filtrados en lugar de todos los pagos para todos los cálculos siguientes
    const pagosFinales = pagosFiltrados;

    // Si es administrador o secretaria, agrupar por médico
    if (user?.rol === 'ADMINISTRADOR' || user?.rol === 'SECRETARIA') {
      // Primero, necesitamos obtener información de médicos para pagos sin historia clínica
      // Buscar todas las atenciones del período para hacer match con pagos sin historia clínica
      const todasLasAtenciones = await this.prisma.atencion.findMany({
        where: {
          horaIngreso: {
            gte: hoy,
            lt: mañana,
          },
        },
        include: {
          medico: {
            include: {
              usuario: true,
            },
          },
        },
      });

      // Crear un mapa de pagoId -> medicoId para pagos sin historia clínica
      const pagoMedicoMap = new Map<number, any>();
      
      // Hacer match entre pagos sin historia clínica y atenciones - usar pagosFinales
      const pagosSinHistoria = pagosFinales.filter(p => !p.historiaClinica);
      pagosSinHistoria.forEach(pago => {
        const atencionesDelPaciente = todasLasAtenciones.filter(a => 
          a.pacienteId === pago.pacienteId
        );
        
        if (atencionesDelPaciente.length > 0) {
          // Encontrar la atención más cercana en tiempo
          let atencionMasCercana = atencionesDelPaciente[0];
          let diferenciaMinima = Math.abs(
            new Date(pago.fechaPago).getTime() - new Date(atencionMasCercana.horaIngreso).getTime()
          );
          
          for (const atencion of atencionesDelPaciente) {
            const diferencia = Math.abs(
              new Date(pago.fechaPago).getTime() - new Date(atencion.horaIngreso).getTime()
            );
            if (diferencia < diferenciaMinima) {
              diferenciaMinima = diferencia;
              atencionMasCercana = atencion;
            }
          }
          
          // Solo asignar si la diferencia es menor a 2 horas
          if (diferenciaMinima < 7200000) {
            pagoMedicoMap.set(pago.id, {
              medicoId: atencionMasCercana.medicoId,
              medico: atencionMasCercana.medico,
            });
          }
        }
      });

      const pagosPorMedico = pagos.reduce((acc, pago) => {
        let medicoId: number;
        let medicoNombre: string;
        let especialidad: string;

        if (pago.historiaClinica && pago.historiaClinica.medico) {
          // Pago con historia clínica
          medicoId = pago.historiaClinica.medicoId;
          medicoNombre = `${pago.historiaClinica.medico.usuario.nombre} ${pago.historiaClinica.medico.usuario.apellido}`;
          especialidad = pago.historiaClinica.medico.especialidad || 'Sin especialidad';
        } else if (pagoMedicoMap.has(pago.id)) {
          // Pago sin historia clínica pero con match de atención
          const medicoInfo = pagoMedicoMap.get(pago.id);
          medicoId = medicoInfo.medicoId;
          medicoNombre = `${medicoInfo.medico.usuario.nombre} ${medicoInfo.medico.usuario.apellido}`;
          especialidad = medicoInfo.medico.especialidad || 'Sin especialidad';
        } else {
          // Pago sin médico asociado, no incluirlo
          return acc;
        }

        if (!acc[medicoId]) {
          acc[medicoId] = {
            medicoId,
            medicoNombre,
            especialidad,
            totalEfectivo: 0,
            totalTransferencia: 0,
            cantidadPagos: 0,
            pagos: [],
          };
        }

        if (pago.tipoPago === 'EFECTIVO') {
          acc[medicoId].totalEfectivo += Number(pago.monto);
        } else {
          acc[medicoId].totalTransferencia += Number(pago.monto);
        }
        acc[medicoId].cantidadPagos += 1;
        acc[medicoId].pagos.push(pago);
        return acc;
      }, {});

      // Agregar desglose por día para cada médico - usar fecha en Argentina
      Object.values(pagosPorMedico).forEach((medico: any) => {
        const pagosPorDia = medico.pagos.reduce((acc: any, pago: any) => {
          // Convertir la fecha UTC a fecha en Argentina
          const fechaUTC = new Date(pago.fechaPago);
          const fecha = this.getFechaArgentina(fechaUTC);
          
          if (!acc[fecha]) {
            acc[fecha] = {
              fecha,
              totalEfectivo: 0,
              totalTransferencia: 0,
              cantidad: 0,
            };
          }
          if (pago.tipoPago === 'EFECTIVO') {
            acc[fecha].totalEfectivo += Number(pago.monto);
          } else if (pago.tipoPago === 'TRANSFERENCIA') {
            acc[fecha].totalTransferencia += Number(pago.monto);
          }
          acc[fecha].cantidad += 1;
          return acc;
        }, {});
        medico.pagosPorDia = Object.values(pagosPorDia).sort((a: any, b: any) => 
          a.fecha.localeCompare(b.fecha)
        );
      });

      const totalEfectivo = pagosFinales
        .filter((p) => p.tipoPago === 'EFECTIVO')
        .reduce((sum, p) => sum + Number(p.monto), 0);

      const totalTransferencia = pagosFinales
        .filter((p) => p.tipoPago === 'TRANSFERENCIA')
        .reduce((sum, p) => sum + Number(p.monto), 0);

      return {
        fecha: fechaString,
        totalEfectivo,
        totalTransferencia,
        total: totalEfectivo + totalTransferencia,
        cantidadPagos: pagosFinales.length,
        pagos: pagosFinales,
        pagosPorMedico: Object.values(pagosPorMedico),
      };
    }

    const totalEfectivo = pagosFinales
      .filter((p) => p.tipoPago === 'EFECTIVO')
      .reduce((sum, p) => sum + Number(p.monto), 0);

    const totalTransferencia = pagosFinales
      .filter((p) => p.tipoPago === 'TRANSFERENCIA')
      .reduce((sum, p) => sum + Number(p.monto), 0);

    return {
      fecha: fechaString,
      totalEfectivo,
      totalTransferencia,
      total: totalEfectivo + totalTransferencia,
      cantidadPagos: pagosFinales.length,
      pagos: pagosFinales,
    };
  }

  /**
   * Obtener reporte de pagos del mes actual
   */
  async getReporteMes(anio?: number, mes?: number, user?: any) {
    const fecha = new Date();
    const anioActual = anio || fecha.getFullYear();
    // mes viene como 0-11 desde el controlador (ya se restó 1)
    const mesActual = mes !== undefined ? mes : fecha.getMonth();

    // Crear fechas de inicio y fin del mes
    // mesActual es 0-11, así que usamos directamente
    const inicioMes = new Date(anioActual, mesActual, 1, 0, 0, 0, 0);
    const finMes = new Date(anioActual, mesActual + 1, 0, 23, 59, 59, 999);

    // Construir el where clause
    const where: any = {
      fechaPago: {
        gte: inicioMes,
        lte: finMes,
      },
    };

    // Si es médico, filtrar por sus atenciones o historias clínicas
    if (user?.rol === 'MEDICO') {
      const medicoId = await this.getMedicoIdByUsuarioId(user.id);
      if (medicoId) {
        // Buscar atenciones del médico en el período
        const atenciones = await this.prisma.atencion.findMany({
          where: {
            medicoId: medicoId,
            horaIngreso: {
              gte: inicioMes,
              lte: finMes,
            },
          },
          select: {
            id: true,
            pacienteId: true,
            horaIngreso: true,
          },
        });

        if (atenciones.length === 0) {
          // Si no hay atenciones, retornar vacío
          return {
            anio: anioActual,
            mes: mesActual + 1,
            totalEfectivo: 0,
            totalTransferencia: 0,
            total: 0,
            cantidadPagos: 0,
            pagosPorDia: [],
            pagos: [],
          };
        }

        // Obtener todos los pagos del período primero para hacer el match preciso
        const todosLosPagos = await this.prisma.pago.findMany({
          where: {
            fechaPago: {
              gte: inicioMes,
              lte: finMes,
            },
            historiaClinicaId: null, // Solo pagos sin historia clínica
          },
          include: {
            paciente: true,
          },
          orderBy: {
            fechaPago: 'asc',
          },
        });

        // Hacer match entre pagos y atenciones: un pago corresponde a una atención si:
        // 1. Es del mismo paciente
        // 2. Se hizo el mismo día (o muy cerca, dentro de 2 horas) de cuando se creó la atención
        const pagosIdsMatch = new Set<number>();
        
        atenciones.forEach(atencion => {
          const fechaAtencion = new Date(atencion.horaIngreso);
          const pacienteId = atencion.pacienteId;
          
          // Buscar el pago más cercano en tiempo para esta atención
          const pagosDelPaciente = todosLosPagos.filter(p => 
            p.pacienteId === pacienteId && 
            !pagosIdsMatch.has(p.id) // No incluir pagos ya asignados
          );
          
          if (pagosDelPaciente.length > 0) {
            // Encontrar el pago más cercano en tiempo a la atención
            let pagoMasCercano = pagosDelPaciente[0];
            let diferenciaMinima = Math.abs(
              new Date(pagoMasCercano.fechaPago).getTime() - fechaAtencion.getTime()
            );
            
            for (const pago of pagosDelPaciente) {
              const diferencia = Math.abs(
                new Date(pago.fechaPago).getTime() - fechaAtencion.getTime()
              );
              if (diferencia < diferenciaMinima) {
                diferenciaMinima = diferencia;
                pagoMasCercano = pago;
              }
            }
            
            // Solo incluir si la diferencia es menor a 2 horas (7200000 ms)
            if (diferenciaMinima < 7200000) {
              pagosIdsMatch.add(pagoMasCercano.id);
            }
          }
        });

        // Filtrar pagos por:
        // 1. Historias clínicas del médico, O
        // 2. Pagos que hicieron match con atenciones del médico
        const condiciones: any[] = [
          {
            historiaClinica: {
              medicoId: medicoId,
            },
          },
        ];

        if (pagosIdsMatch.size > 0) {
          condiciones.push({
            id: {
              in: Array.from(pagosIdsMatch),
            },
          });
        }

        where.OR = condiciones;
      } else {
        // Si no tiene médico asociado, retornar vacío
        return {
          anio: anioActual,
          mes: mesActual + 1,
          totalEfectivo: 0,
          totalTransferencia: 0,
          total: 0,
          cantidadPagos: 0,
          pagosPorDia: [],
          pagos: [],
        };
      }
    }

    const pagos = await this.prisma.pago.findMany({
      where,
      include: {
        paciente: true,
        historiaClinica: {
          include: {
            medico: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaPago: 'desc',
      },
    });

    const totalEfectivo = pagos
      .filter((p) => p.tipoPago === 'EFECTIVO')
      .reduce((sum, p) => sum + Number(p.monto), 0);

    const totalTransferencia = pagos
      .filter((p) => p.tipoPago === 'TRANSFERENCIA')
      .reduce((sum, p) => sum + Number(p.monto), 0);

    // Agrupar por día - IMPORTANTE: usar fecha en Argentina, no UTC
    const pagosPorDia = pagos.reduce((acc, pago) => {
      // Convertir la fecha UTC a fecha en Argentina
      const fechaUTC = new Date(pago.fechaPago);
      const fecha = this.getFechaArgentina(fechaUTC);
      
      if (!acc[fecha]) {
        acc[fecha] = {
          fecha,
          totalEfectivo: 0,
          totalTransferencia: 0,
          cantidad: 0,
        };
      }
      if (pago.tipoPago === 'EFECTIVO') {
        acc[fecha].totalEfectivo += Number(pago.monto);
      } else if (pago.tipoPago === 'TRANSFERENCIA') {
        acc[fecha].totalTransferencia += Number(pago.monto);
      }
      // Nota: OBRA_SOCIAL con monto 0 no se suma a efectivo ni transferencia
      acc[fecha].cantidad += 1;
      return acc;
    }, {});

    // Si es administrador, agrupar por médico
    if (user?.rol === 'ADMINISTRADOR') {
      // Primero, necesitamos obtener información de médicos para pagos sin historia clínica
      // Buscar todas las atenciones del período para hacer match con pagos sin historia clínica
      const todasLasAtenciones = await this.prisma.atencion.findMany({
        where: {
          horaIngreso: {
            gte: inicioMes,
            lte: finMes,
          },
        },
        include: {
          medico: {
            include: {
              usuario: true,
            },
          },
        },
      });

      // Crear un mapa de pagoId -> medicoId para pagos sin historia clínica
      const pagoMedicoMap = new Map<number, any>();
      
      // Hacer match entre pagos sin historia clínica y atenciones
      const pagosSinHistoria = pagos.filter(p => !p.historiaClinica);
      pagosSinHistoria.forEach(pago => {
        const atencionesDelPaciente = todasLasAtenciones.filter(a => 
          a.pacienteId === pago.pacienteId
        );
        
        if (atencionesDelPaciente.length > 0) {
          // Encontrar la atención más cercana en tiempo
          let atencionMasCercana = atencionesDelPaciente[0];
          let diferenciaMinima = Math.abs(
            new Date(pago.fechaPago).getTime() - new Date(atencionMasCercana.horaIngreso).getTime()
          );
          
          for (const atencion of atencionesDelPaciente) {
            const diferencia = Math.abs(
              new Date(pago.fechaPago).getTime() - new Date(atencion.horaIngreso).getTime()
            );
            if (diferencia < diferenciaMinima) {
              diferenciaMinima = diferencia;
              atencionMasCercana = atencion;
            }
          }
          
          // Solo asignar si la diferencia es menor a 2 horas
          if (diferenciaMinima < 7200000) {
            pagoMedicoMap.set(pago.id, {
              medicoId: atencionMasCercana.medicoId,
              medico: atencionMasCercana.medico,
            });
          }
        }
      });

      const pagosPorMedico = pagos.reduce((acc, pago) => {
        let medicoId: number;
        let medicoNombre: string;
        let especialidad: string;

        if (pago.historiaClinica && pago.historiaClinica.medico) {
          // Pago con historia clínica
          medicoId = pago.historiaClinica.medicoId;
          medicoNombre = `${pago.historiaClinica.medico.usuario.nombre} ${pago.historiaClinica.medico.usuario.apellido}`;
          especialidad = pago.historiaClinica.medico.especialidad || 'Sin especialidad';
        } else if (pagoMedicoMap.has(pago.id)) {
          // Pago sin historia clínica pero con match de atención
          const medicoInfo = pagoMedicoMap.get(pago.id);
          medicoId = medicoInfo.medicoId;
          medicoNombre = `${medicoInfo.medico.usuario.nombre} ${medicoInfo.medico.usuario.apellido}`;
          especialidad = medicoInfo.medico.especialidad || 'Sin especialidad';
        } else {
          // Pago sin médico asociado, no incluirlo
          return acc;
        }

        if (!acc[medicoId]) {
          acc[medicoId] = {
            medicoId,
            medicoNombre,
            especialidad,
            totalEfectivo: 0,
            totalTransferencia: 0,
            cantidadPagos: 0,
            pagos: [],
          };
        }

        if (pago.tipoPago === 'EFECTIVO') {
          acc[medicoId].totalEfectivo += Number(pago.monto);
        } else {
          acc[medicoId].totalTransferencia += Number(pago.monto);
        }
        acc[medicoId].cantidadPagos += 1;
        acc[medicoId].pagos.push(pago);
        return acc;
      }, {});

      // Agregar desglose por día para cada médico - usar fecha en Argentina
      Object.values(pagosPorMedico).forEach((medico: any) => {
        const pagosPorDiaMedico = medico.pagos.reduce((acc: any, pago: any) => {
          // Convertir la fecha UTC a fecha en Argentina
          const fechaUTC = new Date(pago.fechaPago);
          const fecha = this.getFechaArgentina(fechaUTC);
          
          if (!acc[fecha]) {
            acc[fecha] = {
              fecha,
              totalEfectivo: 0,
              totalTransferencia: 0,
              cantidad: 0,
            };
          }
          if (pago.tipoPago === 'EFECTIVO') {
            acc[fecha].totalEfectivo += Number(pago.monto);
          } else if (pago.tipoPago === 'TRANSFERENCIA') {
            acc[fecha].totalTransferencia += Number(pago.monto);
          }
          acc[fecha].cantidad += 1;
          return acc;
        }, {});
        medico.pagosPorDia = Object.values(pagosPorDiaMedico).sort((a: any, b: any) => 
          a.fecha.localeCompare(b.fecha)
        );
      });

      return {
        anio: anioActual,
        mes: mesActual + 1,
        totalEfectivo,
        totalTransferencia,
        total: totalEfectivo + totalTransferencia,
        cantidadPagos: pagos.length,
        pagosPorDia: Object.values(pagosPorDia),
        pagos,
        pagosPorMedico: Object.values(pagosPorMedico),
      };
    }

    return {
      anio: anioActual,
      mes: mesActual + 1,
      totalEfectivo,
      totalTransferencia,
      total: totalEfectivo + totalTransferencia,
      cantidadPagos: pagos.length,
      pagosPorDia: Object.values(pagosPorDia),
      pagos,
    };
  }

  /**
   * Obtener reporte de pagos del año actual
   */
  async getReporteAnio(anio?: number, user?: any) {
    const fecha = new Date();
    const anioActual = anio || fecha.getFullYear();

    const inicioAnio = new Date(anioActual, 0, 1);
    const finAnio = new Date(anioActual, 11, 31, 23, 59, 59, 999);

    // Construir el where clause
    const where: any = {
      fechaPago: {
        gte: inicioAnio,
        lte: finAnio,
      },
    };

    // Si es médico, filtrar por sus atenciones o historias clínicas
    if (user?.rol === 'MEDICO') {
      const medicoId = await this.getMedicoIdByUsuarioId(user.id);
      if (medicoId) {
        // Buscar atenciones del médico en el período
        const atenciones = await this.prisma.atencion.findMany({
          where: {
            medicoId: medicoId,
            horaIngreso: {
              gte: inicioAnio,
              lte: finAnio,
            },
          },
          select: {
            id: true,
            pacienteId: true,
            horaIngreso: true,
          },
        });

        if (atenciones.length === 0) {
          // Si no hay atenciones, retornar vacío
          return {
            anio: anioActual,
            totalEfectivo: 0,
            totalTransferencia: 0,
            total: 0,
            cantidadPagos: 0,
            pagosPorMes: [],
            pagos: [],
          };
        }

        // Obtener todos los pagos del período primero para hacer el match preciso
        const todosLosPagos = await this.prisma.pago.findMany({
          where: {
            fechaPago: {
              gte: inicioAnio,
              lte: finAnio,
            },
            historiaClinicaId: null, // Solo pagos sin historia clínica
          },
          include: {
            paciente: true,
          },
          orderBy: {
            fechaPago: 'asc',
          },
        });

        // Hacer match entre pagos y atenciones: un pago corresponde a una atención si:
        // 1. Es del mismo paciente
        // 2. Se hizo el mismo día (o muy cerca, dentro de 2 horas) de cuando se creó la atención
        const pagosIdsMatch = new Set<number>();
        
        atenciones.forEach(atencion => {
          const fechaAtencion = new Date(atencion.horaIngreso);
          const pacienteId = atencion.pacienteId;
          
          // Buscar el pago más cercano en tiempo para esta atención
          const pagosDelPaciente = todosLosPagos.filter(p => 
            p.pacienteId === pacienteId && 
            !pagosIdsMatch.has(p.id) // No incluir pagos ya asignados
          );
          
          if (pagosDelPaciente.length > 0) {
            // Encontrar el pago más cercano en tiempo a la atención
            let pagoMasCercano = pagosDelPaciente[0];
            let diferenciaMinima = Math.abs(
              new Date(pagoMasCercano.fechaPago).getTime() - fechaAtencion.getTime()
            );
            
            for (const pago of pagosDelPaciente) {
              const diferencia = Math.abs(
                new Date(pago.fechaPago).getTime() - fechaAtencion.getTime()
              );
              if (diferencia < diferenciaMinima) {
                diferenciaMinima = diferencia;
                pagoMasCercano = pago;
              }
            }
            
            // Solo incluir si la diferencia es menor a 2 horas (7200000 ms)
            if (diferenciaMinima < 7200000) {
              pagosIdsMatch.add(pagoMasCercano.id);
            }
          }
        });

        // Filtrar pagos por:
        // 1. Historias clínicas del médico, O
        // 2. Pagos que hicieron match con atenciones del médico
        const condiciones: any[] = [
          {
            historiaClinica: {
              medicoId: medicoId,
            },
          },
        ];

        if (pagosIdsMatch.size > 0) {
          condiciones.push({
            id: {
              in: Array.from(pagosIdsMatch),
            },
          });
        }

        where.OR = condiciones;
      } else {
        // Si no tiene médico asociado, retornar vacío
        return {
          anio: anioActual,
          totalEfectivo: 0,
          totalTransferencia: 0,
          total: 0,
          cantidadPagos: 0,
          pagosPorMes: [],
          pagos: [],
        };
      }
    }

    const pagos = await this.prisma.pago.findMany({
      where,
      include: {
        paciente: true,
        historiaClinica: {
          include: {
            medico: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaPago: 'desc',
      },
    });

    const totalEfectivo = pagos
      .filter((p) => p.tipoPago === 'EFECTIVO')
      .reduce((sum, p) => sum + Number(p.monto), 0);

    const totalTransferencia = pagos
      .filter((p) => p.tipoPago === 'TRANSFERENCIA')
      .reduce((sum, p) => sum + Number(p.monto), 0);

    // Agrupar por mes
    const pagosPorMes = pagos.reduce((acc, pago) => {
      const fecha = new Date(pago.fechaPago);
      const mes = fecha.getMonth();
      if (!acc[mes]) {
        acc[mes] = {
          mes: mes + 1,
          totalEfectivo: 0,
          totalTransferencia: 0,
          cantidad: 0,
        };
      }
      if (pago.tipoPago === 'EFECTIVO') {
        acc[mes].totalEfectivo += Number(pago.monto);
      } else {
        acc[mes].totalTransferencia += Number(pago.monto);
      }
      acc[mes].cantidad += 1;
      return acc;
      }, {});

    // Si es administrador, agrupar por médico
    if (user?.rol === 'ADMINISTRADOR') {
      // Primero, necesitamos obtener información de médicos para pagos sin historia clínica
      // Buscar todas las atenciones del período para hacer match con pagos sin historia clínica
      const todasLasAtenciones = await this.prisma.atencion.findMany({
        where: {
          horaIngreso: {
            gte: inicioAnio,
            lte: finAnio,
          },
        },
        include: {
          medico: {
            include: {
              usuario: true,
            },
          },
        },
      });

      // Crear un mapa de pagoId -> medicoId para pagos sin historia clínica
      const pagoMedicoMap = new Map<number, any>();
      
      // Hacer match entre pagos sin historia clínica y atenciones
      const pagosSinHistoria = pagos.filter(p => !p.historiaClinica);
      pagosSinHistoria.forEach(pago => {
        const atencionesDelPaciente = todasLasAtenciones.filter(a => 
          a.pacienteId === pago.pacienteId
        );
        
        if (atencionesDelPaciente.length > 0) {
          // Encontrar la atención más cercana en tiempo
          let atencionMasCercana = atencionesDelPaciente[0];
          let diferenciaMinima = Math.abs(
            new Date(pago.fechaPago).getTime() - new Date(atencionMasCercana.horaIngreso).getTime()
          );
          
          for (const atencion of atencionesDelPaciente) {
            const diferencia = Math.abs(
              new Date(pago.fechaPago).getTime() - new Date(atencion.horaIngreso).getTime()
            );
            if (diferencia < diferenciaMinima) {
              diferenciaMinima = diferencia;
              atencionMasCercana = atencion;
            }
          }
          
          // Solo asignar si la diferencia es menor a 2 horas
          if (diferenciaMinima < 7200000) {
            pagoMedicoMap.set(pago.id, {
              medicoId: atencionMasCercana.medicoId,
              medico: atencionMasCercana.medico,
            });
          }
        }
      });

      const pagosPorMedico = pagos.reduce((acc, pago) => {
        let medicoId: number;
        let medicoNombre: string;
        let especialidad: string;

        if (pago.historiaClinica && pago.historiaClinica.medico) {
          // Pago con historia clínica
          medicoId = pago.historiaClinica.medicoId;
          medicoNombre = `${pago.historiaClinica.medico.usuario.nombre} ${pago.historiaClinica.medico.usuario.apellido}`;
          especialidad = pago.historiaClinica.medico.especialidad || 'Sin especialidad';
        } else if (pagoMedicoMap.has(pago.id)) {
          // Pago sin historia clínica pero con match de atención
          const medicoInfo = pagoMedicoMap.get(pago.id);
          medicoId = medicoInfo.medicoId;
          medicoNombre = `${medicoInfo.medico.usuario.nombre} ${medicoInfo.medico.usuario.apellido}`;
          especialidad = medicoInfo.medico.especialidad || 'Sin especialidad';
        } else {
          // Pago sin médico asociado, no incluirlo
          return acc;
        }

        if (!acc[medicoId]) {
          acc[medicoId] = {
            medicoId,
            medicoNombre,
            especialidad,
            totalEfectivo: 0,
            totalTransferencia: 0,
            cantidadPagos: 0,
            pagos: [],
          };
        }

        if (pago.tipoPago === 'EFECTIVO') {
          acc[medicoId].totalEfectivo += Number(pago.monto);
        } else {
          acc[medicoId].totalTransferencia += Number(pago.monto);
        }
        acc[medicoId].cantidadPagos += 1;
        acc[medicoId].pagos.push(pago);
        return acc;
      }, {});

      // Agregar desglose por mes para cada médico
      Object.values(pagosPorMedico).forEach((medico: any) => {
        const pagosPorMesMedico = medico.pagos.reduce((acc: any, pago: any) => {
          const fecha = new Date(pago.fechaPago);
          const mes = fecha.getMonth();
          if (!acc[mes]) {
            acc[mes] = {
              mes: mes + 1,
              totalEfectivo: 0,
              totalTransferencia: 0,
              cantidad: 0,
            };
          }
          if (pago.tipoPago === 'EFECTIVO') {
            acc[mes].totalEfectivo += Number(pago.monto);
          } else {
            acc[mes].totalTransferencia += Number(pago.monto);
          }
          acc[mes].cantidad += 1;
          return acc;
        }, {});
        medico.pagosPorMes = Object.values(pagosPorMesMedico).sort((a: any, b: any) => 
          a.mes - b.mes
        );
      });

      return {
        anio: anioActual,
        totalEfectivo,
        totalTransferencia,
        total: totalEfectivo + totalTransferencia,
        cantidadPagos: pagos.length,
        pagosPorMes: Object.values(pagosPorMes),
        pagos,
        pagosPorMedico: Object.values(pagosPorMedico),
      };
    }

    return {
      anio: anioActual,
      totalEfectivo,
      totalTransferencia,
      total: totalEfectivo + totalTransferencia,
      cantidadPagos: pagos.length,
      pagosPorMes: Object.values(pagosPorMes),
      pagos,
    };
  }

  /**
   * Obtener estadísticas generales de pagos
   */
  async getEstadisticas(user?: any) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

    const inicioAnio = new Date(hoy.getFullYear(), 0, 1);
    const finAnio = new Date(hoy.getFullYear(), 11, 31, 23, 59, 59, 999);

    // Construir el where clause base
    const buildWhere = async (fechaDesde: Date, fechaHasta: Date) => {
      const where: any = {
        fechaPago: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
      };

      // Si es médico, filtrar por sus atenciones o historias clínicas
      if (user?.rol === 'MEDICO') {
        const medicoId = await this.getMedicoIdByUsuarioId(user.id);
        if (medicoId) {
          // Buscar atenciones del médico en el período
          const atenciones = await this.prisma.atencion.findMany({
            where: {
              medicoId: medicoId,
              horaIngreso: {
                gte: fechaDesde,
                lte: fechaHasta,
              },
            },
            select: {
              id: true,
              pacienteId: true,
              horaIngreso: true,
            },
          });

          if (atenciones.length === 0) {
            // Si no hay atenciones, retornar condición que no devuelva resultados
            where.id = -1; // ID que no existe
            return where;
          }

          // Obtener todos los pagos del período primero para hacer el match preciso
          const todosLosPagos = await this.prisma.pago.findMany({
            where: {
              fechaPago: {
                gte: fechaDesde,
                lte: fechaHasta,
              },
              historiaClinicaId: null, // Solo pagos sin historia clínica
            },
            include: {
              paciente: true,
            },
            orderBy: {
              fechaPago: 'asc',
            },
          });

          // Hacer match entre pagos y atenciones: un pago corresponde a una atención si:
          // 1. Es del mismo paciente
          // 2. Se hizo el mismo día (o muy cerca, dentro de 2 horas) de cuando se creó la atención
          const pagosIdsMatch = new Set<number>();
          
          atenciones.forEach(atencion => {
            const fechaAtencion = new Date(atencion.horaIngreso);
            const pacienteId = atencion.pacienteId;
            
            // Buscar el pago más cercano en tiempo para esta atención
            const pagosDelPaciente = todosLosPagos.filter(p => 
              p.pacienteId === pacienteId && 
              !pagosIdsMatch.has(p.id) // No incluir pagos ya asignados
            );
            
            if (pagosDelPaciente.length > 0) {
              // Encontrar el pago más cercano en tiempo a la atención
              let pagoMasCercano = pagosDelPaciente[0];
              let diferenciaMinima = Math.abs(
                new Date(pagoMasCercano.fechaPago).getTime() - fechaAtencion.getTime()
              );
              
              for (const pago of pagosDelPaciente) {
                const diferencia = Math.abs(
                  new Date(pago.fechaPago).getTime() - fechaAtencion.getTime()
                );
                if (diferencia < diferenciaMinima) {
                  diferenciaMinima = diferencia;
                  pagoMasCercano = pago;
                }
              }
              
              // Solo incluir si la diferencia es menor a 2 horas (7200000 ms)
              if (diferenciaMinima < 7200000) {
                pagosIdsMatch.add(pagoMasCercano.id);
              }
            }
          });

          // Filtrar pagos por:
          // 1. Historias clínicas del médico, O
          // 2. Pagos que hicieron match con atenciones del médico
          const condiciones: any[] = [
            {
              historiaClinica: {
                medicoId: medicoId,
              },
            },
          ];

          if (pagosIdsMatch.size > 0) {
            condiciones.push({
              id: {
                in: Array.from(pagosIdsMatch),
              },
            });
          }

          where.OR = condiciones;
        } else {
          // Si no tiene médico asociado, retornar condición que no devuelva resultados
          where.id = -1; // ID que no existe
        }
      }

      return where;
    };

    // Pagos del día
    const whereDia = await buildWhere(hoy, mañana);
    const pagosDia = await this.prisma.pago.findMany({
      where: whereDia,
    });

    // Pagos del mes
    const whereMes = await buildWhere(inicioMes, finMes);
    const pagosMes = await this.prisma.pago.findMany({
      where: whereMes,
    });

    // Pagos del año
    const whereAnio = await buildWhere(inicioAnio, finAnio);
    const pagosAnio = await this.prisma.pago.findMany({
      where: whereAnio,
    });

    const calcularTotales = (pagos) => {
      const efectivo = pagos
        .filter((p) => p.tipoPago === 'EFECTIVO')
        .reduce((sum, p) => sum + Number(p.monto), 0);
      const transferencia = pagos
        .filter((p) => p.tipoPago === 'TRANSFERENCIA')
        .reduce((sum, p) => sum + Number(p.monto), 0);
      return {
        efectivo,
        transferencia,
        total: efectivo + transferencia,
        cantidad: pagos.length,
      };
    };

    return {
      dia: calcularTotales(pagosDia),
      mes: calcularTotales(pagosMes),
      anio: calcularTotales(pagosAnio),
    };
  }
}

