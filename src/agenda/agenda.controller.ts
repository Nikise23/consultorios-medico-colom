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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AgendaService } from './agenda.service';
import { CreateBloqueoDto } from './dto/create-bloqueo.dto';
import { SetHorariosDto } from './dto/set-horarios.dto';

const ROLES_AGENDA = [Rol.ADMINISTRADOR, Rol.SECRETARIA] as const;

@Controller('agenda')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Get('medicos/:medicoId/disponibilidad')
  @Roles(...ROLES_AGENDA)
  getDisponibilidad(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Query('fecha') fecha: string,
    @Query('excluirCitaId') excluirCitaId?: string,
  ) {
    if (!fecha) {
      throw new BadRequestException('El parámetro fecha es requerido (YYYY-MM-DD)');
    }
    return this.agendaService.getDisponibilidad(
      medicoId,
      fecha,
      excluirCitaId ? +excluirCitaId : undefined,
    );
  }

  @Get('medicos/:medicoId')
  @Roles(...ROLES_AGENDA)
  getConfiguracion(@Param('medicoId', ParseIntPipe) medicoId: number) {
    return this.agendaService.getConfiguracion(medicoId);
  }

  @Put('medicos/:medicoId/horarios')
  @Roles(...ROLES_AGENDA)
  setHorarios(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Body() dto: SetHorariosDto,
  ) {
    return this.agendaService.setHorarios(medicoId, dto.horarios);
  }

  @Get('medicos/:medicoId/bloqueos')
  @Roles(...ROLES_AGENDA)
  listarBloqueos(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.agendaService.listarBloqueos(medicoId, desde, hasta);
  }

  @Post('medicos/:medicoId/bloqueos')
  @Roles(...ROLES_AGENDA)
  agregarBloqueo(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Body() dto: CreateBloqueoDto,
  ) {
    return this.agendaService.agregarBloqueo(
      medicoId,
      dto.fecha,
      dto.motivo,
      dto.horaInicio,
      dto.horaFin,
    );
  }

  @Delete('medicos/:medicoId/bloqueos/:id')
  @Roles(...ROLES_AGENDA)
  eliminarBloqueo(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.agendaService.eliminarBloqueo(medicoId, id);
  }
}
