import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { SearchPacienteDto } from './dto/search-paciente.dto';

@Injectable()
export class PacientesService {
  constructor(private prisma: PrismaService) {}

  async search(searchDto: SearchPacienteDto) {
    const { dni, apellido } = searchDto;

    const where: any = {
      activo: true,
    };

    // Búsqueda por DNI (parcial, case-insensitive)
    if (dni && dni.trim()) {
      try {
        where.dni = {
          contains: dni.trim(),
          mode: 'insensitive',
        };
      } catch (error) {
        // Fallback a búsqueda case-sensitive si el modo insensitive falla
        where.dni = {
          contains: dni.trim(),
        };
      }
    }

    // Búsqueda por apellido (parcial, case-insensitive)
    if (apellido && apellido.trim()) {
      try {
        where.apellido = {
          contains: apellido.trim(),
          mode: 'insensitive',
        };
      } catch (error) {
        // Fallback a búsqueda case-sensitive si el modo insensitive falla
        where.apellido = {
          contains: apellido.trim(),
        };
      }
    }

    // Si hay filtros, buscar con ellos; si no, retornar todos los pacientes activos
    return this.prisma.paciente.findMany({
      where,
      take: dni || apellido ? 20 : 50,
      orderBy: {
        apellido: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id },
      include: {
        atenciones: {
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
        },
      },
    });

    if (!paciente) {
      throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
    }

    return paciente;
  }

  async findByDni(dni: string) {
    return this.prisma.paciente.findUnique({
      where: { dni },
    });
  }

  async create(createPacienteDto: CreatePacienteDto) {
    const pacienteExistente = await this.findByDni(createPacienteDto.dni);

    if (pacienteExistente) {
      throw new ConflictException(`Ya existe un paciente con DNI ${createPacienteDto.dni}`);
    }

    // Preparar datos para crear, manejando campos opcionales
    const data: any = {
      dni: createPacienteDto.dni,
      nombre: createPacienteDto.nombre,
      apellido: createPacienteDto.apellido,
      obraSocial: createPacienteDto.obraSocial,
    };

    // Solo agregar fechaNacimiento si existe y no está vacío
    if (createPacienteDto.fechaNacimiento && createPacienteDto.fechaNacimiento.trim() !== '') {
      data.fechaNacimiento = new Date(createPacienteDto.fechaNacimiento);
    }

    // Agregar campos opcionales solo si tienen valor
    if (createPacienteDto.telefono && createPacienteDto.telefono.trim() !== '') {
      data.telefono = createPacienteDto.telefono;
    }

    if (createPacienteDto.email && createPacienteDto.email.trim() !== '') {
      data.email = createPacienteDto.email;
    }

    if (createPacienteDto.direccion && createPacienteDto.direccion.trim() !== '') {
      data.direccion = createPacienteDto.direccion;
    }

    if (createPacienteDto.numeroAfiliado && createPacienteDto.numeroAfiliado.trim() !== '') {
      data.numeroAfiliado = createPacienteDto.numeroAfiliado;
    }

    return this.prisma.paciente.create({
      data,
    });
  }

  async update(id: number, updatePacienteDto: UpdatePacienteDto) {
    await this.findOne(id); // Verifica que existe

    // Preparar datos para actualizar, manejando campos opcionales
    const data: any = {};

    if (updatePacienteDto.nombre !== undefined) {
      data.nombre = updatePacienteDto.nombre;
    }
    if (updatePacienteDto.apellido !== undefined) {
      data.apellido = updatePacienteDto.apellido;
    }
    if (updatePacienteDto.obraSocial !== undefined) {
      data.obraSocial = updatePacienteDto.obraSocial;
    }
    if (updatePacienteDto.telefono !== undefined) {
      data.telefono = updatePacienteDto.telefono || null;
    }
    if (updatePacienteDto.email !== undefined) {
      data.email = updatePacienteDto.email || null;
    }
    if (updatePacienteDto.direccion !== undefined) {
      data.direccion = updatePacienteDto.direccion || null;
    }
    if (updatePacienteDto.numeroAfiliado !== undefined) {
      data.numeroAfiliado = updatePacienteDto.numeroAfiliado || null;
    }
    if (updatePacienteDto.fechaNacimiento !== undefined) {
      if (updatePacienteDto.fechaNacimiento && updatePacienteDto.fechaNacimiento.trim() !== '') {
        data.fechaNacimiento = new Date(updatePacienteDto.fechaNacimiento);
      } else {
        data.fechaNacimiento = null;
      }
    }

    return this.prisma.paciente.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verifica que existe
    
    // Soft delete: marcar como inactivo en lugar de borrar físicamente
    return this.prisma.paciente.update({
      where: { id },
      data: { activo: false },
    });
  }
}

