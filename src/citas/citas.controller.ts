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
} from '@nestjs/common';
import { CitasService } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { SearchCitaDto } from './dto/search-cita.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';

@Controller('citas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  /** Agenda en prueba: solo administrador (ampliar roles cuando salga a producción) */
  @Post()
  @Roles(Rol.ADMINISTRADOR)
  create(@Body() dto: CreateCitaDto) {
    return this.citasService.create(dto);
  }

  @Get()
  @Roles(Rol.ADMINISTRADOR)
  findAll(@Query() query: SearchCitaDto) {
    return this.citasService.findAll(query);
  }

  @Get('hoy')
  @Roles(Rol.ADMINISTRADOR)
  async citasHoy(@Query('medicoId') medicoId?: string) {
    if (!medicoId) return [];
    return this.citasService.citasHoyMedico(+medicoId);
  }

  @Get(':id')
  @Roles(Rol.ADMINISTRADOR)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.citasService.findOne(id);
  }

  @Patch(':id')
  @Roles(Rol.ADMINISTRADOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCitaDto,
  ) {
    return this.citasService.update(id, dto);
  }

  @Patch(':id/confirmar')
  @Roles(Rol.ADMINISTRADOR)
  confirmar(@Param('id', ParseIntPipe) id: number) {
    return this.citasService.confirmar(id);
  }

  @Patch(':id/no-asistio')
  @Roles(Rol.ADMINISTRADOR)
  marcarNoAsistio(@Param('id', ParseIntPipe) id: number) {
    return this.citasService.marcarNoAsistio(id);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.citasService.cancelar(id);
  }
}
