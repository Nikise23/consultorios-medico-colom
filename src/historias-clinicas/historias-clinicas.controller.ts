import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { HistoriasClinicasService } from './historias-clinicas.service';
import { CreateHistoriaClinicaDto } from './dto/create-historia-clinica.dto';
import { UpdateHistoriaClinicaDto } from './dto/update-historia-clinica.dto';
import { SearchHistoriaClinicaDto } from './dto/search-historia-clinica.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { Rol } from '@prisma/client';

@Controller('historias-clinicas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HistoriasClinicasController {
  constructor(
    private readonly historiasClinicasService: HistoriasClinicasService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles(Rol.MEDICO, Rol.ADMINISTRADOR)
  async create(
    @Body() createHistoriaClinicaDto: CreateHistoriaClinicaDto,
    @CurrentUser() user: any,
  ) {
    let medicoId: number;

    if (user.rol === Rol.MEDICO) {
      const medico = await this.getMedicoByUsuarioId(user.id);
      medicoId = medico.id;
    } else {
      // Administrador: obtener médicoId de la atención
      const atencion = await this.prisma.atencion.findUnique({
        where: { id: createHistoriaClinicaDto.atencionId },
      });
      if (!atencion) {
        throw new Error('Atención no encontrada');
      }
      medicoId = atencion.medicoId;
    }

    return this.historiasClinicasService.create(createHistoriaClinicaDto, medicoId);
  }

  @Patch(':id')
  @Roles(Rol.MEDICO, Rol.ADMINISTRADOR)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHistoriaClinicaDto: UpdateHistoriaClinicaDto,
    @CurrentUser() user: any,
  ) {
    let medicoId: number;

    if (user.rol === Rol.MEDICO) {
      const medico = await this.getMedicoByUsuarioId(user.id);
      medicoId = medico.id;
    } else {
      // Administrador: obtener médicoId de la historia
      const historia = await this.historiasClinicasService.findOne(id);
      medicoId = historia.medicoId;
    }

    return this.historiasClinicasService.update(id, updateHistoriaClinicaDto, medicoId);
  }

  @Get('search')
  @Roles(Rol.MEDICO, Rol.ADMINISTRADOR)
  async search(@Query() searchDto: SearchHistoriaClinicaDto) {
    try {
      const result = await this.historiasClinicasService.search(searchDto);
      return { data: result };
    } catch (error) {
      console.error('Error en búsqueda de historias clínicas:', error);
      throw error;
    }
  }

  @Get('paciente/:pacienteIdOrDniOrApellido')
  @Roles(Rol.MEDICO, Rol.ADMINISTRADOR)
  async findByPaciente(@Param('pacienteIdOrDniOrApellido') pacienteIdOrDniOrApellido: string) {
    try {
      // Intentar parsear como número (ID), si no funciona, usar como string (DNI o apellido)
      const parsed = parseInt(pacienteIdOrDniOrApellido.trim(), 10);
      const idOrSearch = isNaN(parsed) ? pacienteIdOrDniOrApellido.trim() : parsed;
      const result = await this.historiasClinicasService.findByPaciente(idOrSearch);
      return { data: result };
    } catch (error) {
      console.error('Error en búsqueda de historias por paciente:', error);
      throw error;
    }
  }

  @Get('medico/hoy')
  @Roles(Rol.MEDICO, Rol.ADMINISTRADOR)
  async findByMedicoHoy(@CurrentUser() user: any) {
    let medicoId: number;

    if (user.rol === Rol.MEDICO) {
      const medico = await this.getMedicoByUsuarioId(user.id);
      medicoId = medico.id;
    } else {
      throw new Error('Solo los médicos pueden acceder a sus historias del día');
    }

    return this.historiasClinicasService.findByMedicoHoy(medicoId);
  }

  @Get(':id')
  @Roles(Rol.MEDICO, Rol.ADMINISTRADOR)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.historiasClinicasService.findOne(id);
  }

  /**
   * Helper: Obtener médico por usuarioId
   */
  private async getMedicoByUsuarioId(usuarioId: number) {
    const medico = await this.prisma.medico.findFirst({
      where: { usuarioId },
    });

    if (!medico) {
      throw new Error('Usuario no tiene un médico asociado');
    }

    return medico;
  }
}


