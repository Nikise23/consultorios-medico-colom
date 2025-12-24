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
import { PacientesService } from './pacientes.service';
import { AtencionesService } from '../atenciones/atenciones.service';
import { PagosService } from '../pagos/pagos.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { SearchPacienteDto } from './dto/search-paciente.dto';
import { EnviarAEsperaDto } from './dto/enviar-a-espera.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Rol } from '@prisma/client';

@Controller('pacientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PacientesController {
  constructor(
    private readonly pacientesService: PacientesService,
    private readonly atencionesService: AtencionesService,
    private readonly pagosService: PagosService,
  ) {}

  @Get('search')
  @Roles(Rol.SECRETARIA, Rol.ADMINISTRADOR, Rol.MEDICO)
  async search(@Query() searchDto: SearchPacienteDto) {
    try {
      const result = await this.pacientesService.search(searchDto);
      return { data: result };
    } catch (error) {
      console.error('Error en búsqueda de pacientes:', error);
      throw error;
    }
  }

  @Get(':id')
  @Roles(Rol.SECRETARIA, Rol.ADMINISTRADOR, Rol.MEDICO)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pacientesService.findOne(id);
  }

  @Post()
  @Roles(Rol.SECRETARIA, Rol.ADMINISTRADOR)
  async create(@Body() createPacienteDto: CreatePacienteDto) {
    return this.pacientesService.create(createPacienteDto);
  }

  @Patch(':id')
  @Roles(Rol.SECRETARIA, Rol.ADMINISTRADOR)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePacienteDto: UpdatePacienteDto,
  ) {
    return this.pacientesService.update(id, updatePacienteDto);
  }

  @Delete(':id')
  @Roles(Rol.SECRETARIA, Rol.ADMINISTRADOR)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.pacientesService.remove(id);
  }

  /**
   * Endpoint principal: Registrar entrada a sala de espera
   * Si el paciente no existe, se crea y se envía a espera
   * Si existe, se puede actualizar y enviar a espera
   */
  @Post('espera')
  @Roles(Rol.SECRETARIA, Rol.ADMINISTRADOR)
  async enviarAEspera(
    @Body() enviarAEsperaDto: EnviarAEsperaDto,
    @CurrentUser() user: any,
  ) {
    let paciente = await this.pacientesService.findByDni(enviarAEsperaDto.dni);

    // Si el paciente no existe, crearlo
    if (!paciente) {
      paciente = await this.pacientesService.create({
        dni: enviarAEsperaDto.dni,
        nombre: enviarAEsperaDto.nombre,
        apellido: enviarAEsperaDto.apellido,
        fechaNacimiento: enviarAEsperaDto.fechaNacimiento,
        telefono: enviarAEsperaDto.telefono,
        email: enviarAEsperaDto.email,
        direccion: enviarAEsperaDto.direccion,
        obraSocial: enviarAEsperaDto.obraSocial,
        numeroAfiliado: enviarAEsperaDto.numeroAfiliado,
      });
    } else if (enviarAEsperaDto.actualizarDatos) {
      // Si existe y se solicita actualizar, actualizar datos
      paciente = await this.pacientesService.update(paciente.id, {
        nombre: enviarAEsperaDto.nombre,
        apellido: enviarAEsperaDto.apellido,
        fechaNacimiento: enviarAEsperaDto.fechaNacimiento,
        telefono: enviarAEsperaDto.telefono,
        email: enviarAEsperaDto.email,
        direccion: enviarAEsperaDto.direccion,
        obraSocial: enviarAEsperaDto.obraSocial,
        numeroAfiliado: enviarAEsperaDto.numeroAfiliado,
      });
    }

    // Primero registrar el pago
    const pago = await this.pagosService.create({
      pacienteId: paciente.id,
      monto: enviarAEsperaDto.monto,
      tipoPago: enviarAEsperaDto.tipoPago,
      numeroComprobante: enviarAEsperaDto.numeroComprobante,
      observaciones: enviarAEsperaDto.observacionesPago,
    });

    // Luego crear atención en estado EN_ESPERA
    const atencion = await this.atencionesService.create({
      pacienteId: paciente.id,
      medicoId: enviarAEsperaDto.medicoId,
      observaciones: enviarAEsperaDto.observaciones,
    });

    return {
      paciente,
      pago,
      atencion,
      message: 'Pago registrado y paciente enviado a sala de espera exitosamente',
    };
  }
}


