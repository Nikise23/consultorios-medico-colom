import {
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

@Controller('agenda')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Get('medicos/:medicoId')
  @Roles(Rol.ADMINISTRADOR)
  getConfiguracion(@Param('medicoId', ParseIntPipe) medicoId: number) {
    return this.agendaService.getConfiguracion(medicoId);
  }

  @Put('medicos/:medicoId/horarios')
  @Roles(Rol.ADMINISTRADOR)
  setHorarios(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Body() dto: SetHorariosDto,
  ) {
    return this.agendaService.setHorarios(medicoId, dto.horarios);
  }

  @Get('medicos/:medicoId/bloqueos')
  @Roles(Rol.ADMINISTRADOR)
  listarBloqueos(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.agendaService.listarBloqueos(medicoId, desde, hasta);
  }

  @Post('medicos/:medicoId/bloqueos')
  @Roles(Rol.ADMINISTRADOR)
  agregarBloqueo(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Body() dto: CreateBloqueoDto,
  ) {
    return this.agendaService.agregarBloqueo(
      medicoId,
      dto.fecha,
      dto.motivo,
    );
  }

  @Delete('medicos/:medicoId/bloqueos/:fecha')
  @Roles(Rol.ADMINISTRADOR)
  eliminarBloqueo(
    @Param('medicoId', ParseIntPipe) medicoId: number,
    @Param('fecha') fecha: string,
  ) {
    return this.agendaService.eliminarBloqueo(medicoId, fecha);
  }
}
