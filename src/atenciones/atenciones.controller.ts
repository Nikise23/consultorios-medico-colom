import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { AtencionesService } from './atenciones.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAtencionDto } from './dto/create-atencion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Rol } from '@prisma/client';

@Controller('atenciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AtencionesController {
  constructor(
    private readonly atencionesService: AtencionesService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Endpoint principal: Obtener lista de pacientes en espera para el médico
   * GET /atenciones/activas
   */
  @Get('activas')
  @Roles(Rol.MEDICO, Rol.ADMINISTRADOR)
  async findActivas(@CurrentUser() user: any, @Query('medicoId') medicoId?: string) {
    // Si es administrador, puede ver todas las atenciones activas
    // Si es médico, solo las suyas
    if (user.rol === Rol.ADMINISTRADOR && medicoId) {
      return this.atencionesService.findActivasByMedico(parseInt(medicoId));
    }

    if (user.rol === Rol.MEDICO) {
      // Obtener el médico asociado al usuario
      const medico = await this.getMedicoByUsuarioId(user.id);
      return this.atencionesService.findActivasByMedico(medico.id);
    }

    // Administrador sin filtro: todas las activas
    return this.atencionesService.findActivas();
  }

  /**
   * Obtener atenciones en estado ATENDIENDO para el médico actual
   */
  @Get('atendiendo')
  @Roles(Rol.MEDICO, Rol.ADMINISTRADOR)
  async findAtendiendo(@CurrentUser() user: any) {
    if (user.rol === Rol.MEDICO) {
      const medico = await this.getMedicoByUsuarioId(user.id);
      return this.atencionesService.findAtendiendoByMedico(medico.id);
    }

    return [];
  }

  @Get(':id')
  @Roles(Rol.MEDICO, Rol.ADMINISTRADOR, Rol.SECRETARIA)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.atencionesService.findOne(id);
  }

  /**
   * Endpoint principal: Cambiar estado a ATENDIENDO
   * PATCH /atenciones/:id/atender
   */
  @Patch(':id/atender')
  @Roles(Rol.MEDICO, Rol.ADMINISTRADOR)
  async atender(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    let medicoId: number;

    if (user.rol === Rol.MEDICO) {
      const medico = await this.getMedicoByUsuarioId(user.id);
      medicoId = medico.id;
    } else {
      // Administrador: obtener médicoId de la atención
      const atencion = await this.atencionesService.findOne(id);
      medicoId = atencion.medicoId;
    }

    return this.atencionesService.atender(id, medicoId);
  }

  /**
   * Crear nueva atención para un paciente (para nueva historia clínica después de 24h)
   */
  @Post('nueva-consulta')
  @Roles(Rol.MEDICO, Rol.ADMINISTRADOR)
  async crearNuevaConsulta(
    @Body() createAtencionDto: CreateAtencionDto,
    @CurrentUser() user: any,
  ) {
    let medicoId: number;

    if (user.rol === Rol.MEDICO) {
      const medico = await this.getMedicoByUsuarioId(user.id);
      medicoId = medico.id;
    } else {
      medicoId = createAtencionDto.medicoId;
    }

    // Crear atención directamente en estado ATENDIENDO para nueva consulta
    return this.atencionesService.createNuevaConsulta({
      ...createAtencionDto,
      medicoId,
    });
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

