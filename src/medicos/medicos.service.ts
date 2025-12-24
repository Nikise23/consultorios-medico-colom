import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MedicosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.medico.findMany({
      where: {
        activo: true,
      },
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
      orderBy: [
        {
          especialidad: 'asc',
        },
        {
          usuario: {
            apellido: 'asc',
          },
        },
      ],
    });
  }

  async findOne(id: number) {
    return this.prisma.medico.findUnique({
      where: { id },
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
    });
  }

  async findByEspecialidad(especialidad: string) {
    return this.prisma.medico.findMany({
      where: {
        activo: true,
        especialidad: {
          equals: especialidad,
          mode: 'insensitive',
        },
      },
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
      orderBy: {
        usuario: {
          apellido: 'asc',
        },
      },
    });
  }
}



