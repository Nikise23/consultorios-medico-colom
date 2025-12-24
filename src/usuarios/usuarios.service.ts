import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminChangePasswordDto } from './dto/admin-change-password.dto';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
      include: {
        medico: true,
      },
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        medico: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return usuario;
  }

  async findAll() {
    return this.prisma.usuario.findMany({
      include: {
        medico: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(createUsuarioDto: CreateUsuarioDto) {
    // Verificar que el email no exista
    const usuarioExistente = await this.findByEmail(createUsuarioDto.email);
    if (usuarioExistente) {
      throw new ConflictException(`Ya existe un usuario con el email ${createUsuarioDto.email}`);
    }

    // Si es médico, validar que tenga matrícula y especialidad
    if (createUsuarioDto.rol === Rol.MEDICO) {
      if (!createUsuarioDto.matricula || !createUsuarioDto.especialidad) {
        throw new BadRequestException('Los médicos deben tener matrícula y especialidad');
      }

      // Verificar que la matrícula no exista
      const medicoExistente = await this.prisma.medico.findUnique({
        where: { matricula: createUsuarioDto.matricula },
      });

      if (medicoExistente) {
        throw new ConflictException(`Ya existe un médico con la matrícula ${createUsuarioDto.matricula}`);
      }
    }

    const hashedPassword = await bcrypt.hash(createUsuarioDto.password, 10);

    // Crear usuario y médico en una transacción
    if (createUsuarioDto.rol === Rol.MEDICO) {
      return this.prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.create({
          data: {
            email: createUsuarioDto.email,
            password: hashedPassword,
            rol: createUsuarioDto.rol,
            nombre: createUsuarioDto.nombre,
            apellido: createUsuarioDto.apellido,
          },
        });

        const medico = await tx.medico.create({
          data: {
            usuarioId: usuario.id,
            matricula: createUsuarioDto.matricula!,
            especialidad: createUsuarioDto.especialidad!,
          },
        });

        return {
          ...usuario,
          medico,
        };
      });
    }

    // Crear usuario normal (secretaria o administrador)
    return this.prisma.usuario.create({
      data: {
        email: createUsuarioDto.email,
        password: hashedPassword,
        rol: createUsuarioDto.rol,
        nombre: createUsuarioDto.nombre,
        apellido: createUsuarioDto.apellido,
      },
      include: {
        medico: true,
      },
    });
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    const usuario = await this.findOne(id);

    // Si se está cambiando el email, verificar que no exista
    if (updateUsuarioDto.email && updateUsuarioDto.email !== usuario.email) {
      const usuarioExistente = await this.findByEmail(updateUsuarioDto.email);
      if (usuarioExistente) {
        throw new ConflictException(`Ya existe un usuario con el email ${updateUsuarioDto.email}`);
      }
    }

    // Si se está cambiando la contraseña, hashearla
    if (updateUsuarioDto.password) {
      updateUsuarioDto.password = await bcrypt.hash(updateUsuarioDto.password, 10);
    }

    // Si es médico y se está actualizando matrícula o especialidad
    if (usuario.rol === Rol.MEDICO || updateUsuarioDto.rol === Rol.MEDICO) {
      const dataUsuario: any = {};
      
      if (updateUsuarioDto.email) dataUsuario.email = updateUsuarioDto.email;
      if (updateUsuarioDto.nombre) dataUsuario.nombre = updateUsuarioDto.nombre;
      if (updateUsuarioDto.apellido) dataUsuario.apellido = updateUsuarioDto.apellido;
      if (updateUsuarioDto.rol) dataUsuario.rol = updateUsuarioDto.rol;
      if (updateUsuarioDto.password) dataUsuario.password = updateUsuarioDto.password;
      if (updateUsuarioDto.activo !== undefined) dataUsuario.activo = updateUsuarioDto.activo;

      // Si se está cambiando a médico o ya es médico
      if (updateUsuarioDto.rol === Rol.MEDICO || usuario.rol === Rol.MEDICO) {
        if (updateUsuarioDto.matricula || updateUsuarioDto.especialidad) {
          // Verificar matrícula si se está cambiando
          if (updateUsuarioDto.matricula && usuario.medico?.matricula !== updateUsuarioDto.matricula) {
            const medicoExistente = await this.prisma.medico.findUnique({
              where: { matricula: updateUsuarioDto.matricula },
            });
            if (medicoExistente) {
              throw new ConflictException(`Ya existe un médico con la matrícula ${updateUsuarioDto.matricula}`);
            }
          }

          return this.prisma.$transaction(async (tx) => {
            const usuarioActualizado = await tx.usuario.update({
              where: { id },
              data: dataUsuario,
            });

            // Si ya tiene médico, actualizarlo; si no, crearlo
            if (usuario.medico) {
              await tx.medico.update({
                where: { usuarioId: id },
                data: {
                  matricula: updateUsuarioDto.matricula || usuario.medico.matricula,
                  especialidad: updateUsuarioDto.especialidad || usuario.medico.especialidad,
                },
              });
            } else if (updateUsuarioDto.matricula && updateUsuarioDto.especialidad) {
              await tx.medico.create({
                data: {
                  usuarioId: id,
                  matricula: updateUsuarioDto.matricula,
                  especialidad: updateUsuarioDto.especialidad,
                },
              });
            }

            return tx.usuario.findUnique({
              where: { id },
              include: { medico: true },
            });
          });
        }
      }
    }

    // Actualización normal
    const dataToUpdate: any = {};
    
    if (updateUsuarioDto.email) dataToUpdate.email = updateUsuarioDto.email;
    if (updateUsuarioDto.nombre) dataToUpdate.nombre = updateUsuarioDto.nombre;
    if (updateUsuarioDto.apellido) dataToUpdate.apellido = updateUsuarioDto.apellido;
    if (updateUsuarioDto.rol) dataToUpdate.rol = updateUsuarioDto.rol;
    if (updateUsuarioDto.password) dataToUpdate.password = updateUsuarioDto.password;
    if (updateUsuarioDto.activo !== undefined) dataToUpdate.activo = updateUsuarioDto.activo;

    return this.prisma.usuario.update({
      where: { id },
      data: dataToUpdate,
      include: {
        medico: true,
      },
    });
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const usuario = await this.findOne(userId);

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      usuario.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Actualizar contraseña
    return this.prisma.usuario.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
      },
    });
  }

  async updateProfile(userId: number, updateData: { nombre?: string; apellido?: string; email?: string }) {
    const usuario = await this.findOne(userId);

    // Si se está cambiando el email, verificar que no exista
    if (updateData.email && updateData.email !== usuario.email) {
      const usuarioExistente = await this.findByEmail(updateData.email);
      if (usuarioExistente) {
        throw new ConflictException(`Ya existe un usuario con el email ${updateData.email}`);
      }
    }

    return this.prisma.usuario.update({
      where: { id: userId },
      data: updateData,
      include: {
        medico: true,
      },
    });
  }

  async adminChangePassword(userId: number, adminChangePasswordDto: AdminChangePasswordDto) {
    // Verificar que el usuario existe
    await this.findOne(userId);

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(adminChangePasswordDto.newPassword, 10);

    // Actualizar contraseña sin necesidad de la contraseña actual
    return this.prisma.usuario.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
      },
    });
  }

  async remove(id: number) {
    const usuario = await this.findOne(id);
    
    // Soft delete: marcar como inactivo en lugar de borrar físicamente
    return this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
      include: {
        medico: true,
      },
    });
  }
}

