import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AgendaAccessService } from './agenda-access.service';
import { AgendaService } from './agenda.service';
import { CreateBloqueoDto } from './dto/create-bloqueo.dto';
import { SetHorariosDto } from './dto/set-horarios.dto';

const ROLES_AGENDA = [Rol.ADMINISTRADOR, Rol.SECRETARIA, Rol.MEDICO] as const;

@Controller('agenda')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgendaController {
  constructor(
    private readonly agendaService: AgendaService,
    private readonly agendaAccess: AgendaAccessService,
  ) {}

  @Get('medicos/:medicoId/disponibilidad')
  @Roles(Rol.ADMINISTRADOR, Rol.SECRETARIA)
  async getDisponibilidad(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Query('fecha') fecha: string,
    @Query('excluirCitaId') excluirCitaId?: string,
  ) {
    if (!fecha) {
      throw new BadRequestException('El parámetro fecha es requerido (YYYY-MM-DD)');
    }
    await this.agendaAccess.assertMedicoUsaAgenda(medicoId);
    return this.agendaService.getDisponibilidad(
      medicoId,
      fecha,
      excluirCitaId ? +excluirCitaId : undefined,
    );
  }

  @Get('medicos/:medicoId')
  @Roles(...ROLES_AGENDA)
  async getConfiguracion(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @CurrentUser() user: { id: number; rol: Rol },
  ) {
    const id = await this.agendaAccess.resolveMedicoId(user, medicoId);
    return this.agendaService.getConfiguracion(id);
  }

  @Put('medicos/:medicoId/horarios')
  @Roles(Rol.ADMINISTRADOR, Rol.SECRETARIA)
  async setHorarios(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Body() dto: SetHorariosDto,
    @CurrentUser() user: { id: number; rol: Rol },
  ) {
    this.agendaAccess.assertPuedeGestionarHorarios(user);
    await this.agendaAccess.assertMedicoUsaAgenda(medicoId);
    return this.agendaService.setHorarios(medicoId, dto.horarios);
  }

  @Get('medicos/:medicoId/bloqueos')
  @Roles(...ROLES_AGENDA)
  async listarBloqueos(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @CurrentUser() user?: { id: number; rol: Rol },
  ) {
    const id = await this.agendaAccess.resolveMedicoId(user!, medicoId);
    return this.agendaService.listarBloqueos(id, desde, hasta);
  }

  @Post('medicos/:medicoId/bloqueos')
  @Roles(...ROLES_AGENDA)
  async agregarBloqueo(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Body() dto: CreateBloqueoDto,
    @CurrentUser() user: { id: number; rol: Rol },
  ) {
    const id = await this.agendaAccess.resolveMedicoId(user, medicoId);
    return this.agendaService.agregarBloqueo(
      id,
      dto.fecha,
      dto.motivo,
      dto.horaInicio,
      dto.horaFin,
    );
  }

  @Delete('medicos/:medicoId/bloqueos/:id')
  @Roles(...ROLES_AGENDA)
  async eliminarBloqueo(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Param('id', ParseIntPipe) bloqueoId: number,
    @CurrentUser() user: { id: number; rol: Rol },
  ) {
    const id = await this.agendaAccess.resolveMedicoId(user, medicoId);
    return this.agendaService.eliminarBloqueo(id, bloqueoId);
  }
}
