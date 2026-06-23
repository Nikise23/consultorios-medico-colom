import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { Rol } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AgendaAccessService } from '../agenda/agenda-access.service';
import { CitasService } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { SearchCitaDto } from './dto/search-cita.dto';

@Controller('citas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CitasController {
  constructor(
    private readonly citasService: CitasService,
    private readonly agendaAccess: AgendaAccessService,
  ) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR, Rol.SECRETARIA)
  create(@Body() dto: CreateCitaDto, @CurrentUser() user: { id: number; rol: Rol }) {
    this.agendaAccess.assertPuedeGestionarTurnos(user);
    return this.citasService.create(dto);
  }

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.SECRETARIA, Rol.MEDICO)
  async findAll(
    @Query() query: SearchCitaDto,
    @CurrentUser() user: { id: number; rol: Rol },
  ) {
    if (user.rol === Rol.MEDICO) {
      const medico = await this.agendaAccess.assertMedicoUser(user);
      return this.citasService.findAll(query, {
        medicoId: medico.id,
        soloMedicosConAgenda: false,
      });
    }
    return this.citasService.findAll(query, { soloMedicosConAgenda: true });
  }

  @Get('hoy')
  @Roles(Rol.ADMINISTRADOR, Rol.SECRETARIA)
  async citasHoy(@Query('medicoId') medicoId?: string) {
    if (!medicoId) return [];
    return this.citasService.citasHoyMedico(+medicoId);
  }

  @Get(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.SECRETARIA, Rol.MEDICO)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; rol: Rol },
  ) {
    const cita = await this.citasService.findOne(id);
    if (user.rol === Rol.MEDICO) {
      const medico = await this.agendaAccess.assertMedicoUser(user);
      if (cita.medicoId !== medico.id) {
        throw new ForbiddenException('No puede ver este turno');
      }
    } else {
      await this.agendaAccess.assertMedicoUsaAgenda(cita.medicoId);
    }
    return cita;
  }

  @Patch(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.SECRETARIA)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCitaDto,
    @CurrentUser() user: { id: number; rol: Rol },
  ) {
    this.agendaAccess.assertPuedeGestionarTurnos(user);
    return this.citasService.update(id, dto);
  }

  @Patch(':id/confirmar')
  @Roles(Rol.ADMINISTRADOR, Rol.SECRETARIA)
  confirmar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; rol: Rol },
  ) {
    this.agendaAccess.assertPuedeGestionarTurnos(user);
    return this.citasService.confirmar(id);
  }

  @Patch(':id/no-asistio')
  @Roles(Rol.ADMINISTRADOR, Rol.SECRETARIA)
  marcarNoAsistio(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; rol: Rol },
  ) {
    this.agendaAccess.assertPuedeGestionarTurnos(user);
    return this.citasService.marcarNoAsistio(id);
  }

  @Delete(':id/permanente')
  @Roles(Rol.ADMINISTRADOR, Rol.SECRETARIA)
  eliminar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; rol: Rol },
  ) {
    this.agendaAccess.assertPuedeGestionarTurnos(user);
    return this.citasService.eliminar(id);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.SECRETARIA)
  cancelar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; rol: Rol },
  ) {
    this.agendaAccess.assertPuedeGestionarTurnos(user);
    return this.citasService.cancelar(id);
  }
}
