import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface UsuarioAgenda {
  id: number;
  rol: Rol;
}

@Injectable()
export class AgendaAccessService {
  constructor(private prisma: PrismaService) {}

  async getMedicoByUsuarioId(usuarioId: number) {
    return this.prisma.medico.findUnique({
      where: { usuarioId },
    });
  }

  async assertMedicoUser(user: UsuarioAgenda) {
    if (user.rol !== Rol.MEDICO) {
      throw new ForbiddenException('Acceso denegado');
    }
    const medico = await this.getMedicoByUsuarioId(user.id);
    if (!medico?.activo || !medico.usaAgenda) {
      throw new ForbiddenException('No tiene acceso a la agenda de turnos');
    }
    return medico;
  }

  async assertMedicoUsaAgenda(medicoId: number) {
    const medico = await this.prisma.medico.findUnique({
      where: { id: medicoId },
    });
    if (!medico?.activo || !medico.usaAgenda) {
      throw new ForbiddenException(
        'Este profesional no tiene agenda de turnos habilitada',
      );
    }
    return medico;
  }

  async resolveMedicoId(user: UsuarioAgenda, medicoId: number): Promise<number> {
    if (user.rol === Rol.MEDICO) {
      const medico = await this.assertMedicoUser(user);
      if (medico.id !== medicoId) {
        throw new ForbiddenException('Solo puede acceder a su propia agenda');
      }
      return medico.id;
    }

    if (user.rol === Rol.ADMINISTRADOR || user.rol === Rol.SECRETARIA) {
      await this.assertMedicoUsaAgenda(medicoId);
      return medicoId;
    }

    throw new ForbiddenException('Acceso denegado');
  }

  async idsMedicosConAgenda(): Promise<number[]> {
    const medicos = await this.prisma.medico.findMany({
      where: { activo: true, usaAgenda: true },
      select: { id: true },
    });
    return medicos.map((m) => m.id);
  }

  assertPuedeGestionarHorarios(user: UsuarioAgenda) {
    if (user.rol === Rol.MEDICO) {
      throw new ForbiddenException(
        'Los médicos solo pueden gestionar bloqueos de agenda',
      );
    }
  }

  assertPuedeGestionarTurnos(user: UsuarioAgenda) {
    if (user.rol === Rol.MEDICO) {
      throw new ForbiddenException('Solo puede consultar turnos');
    }
  }
}
