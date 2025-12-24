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
import { PagosService } from './pagos.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { SearchPagoDto } from './dto/search-pago.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Rol } from '@prisma/client';

@Controller('pagos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  @Roles(Rol.SECRETARIA, Rol.ADMINISTRADOR)
  async create(@Body() createPagoDto: CreatePagoDto) {
    return this.pagosService.create(createPagoDto);
  }

  @Get('search')
  @Roles(Rol.SECRETARIA, Rol.ADMINISTRADOR)
  async search(@Query() searchDto: SearchPagoDto) {
    return this.pagosService.search(searchDto);
  }

  @Get('paciente/:pacienteId')
  @Roles(Rol.SECRETARIA, Rol.ADMINISTRADOR)
  async findByPaciente(@Param('pacienteId', ParseIntPipe) pacienteId: number) {
    return this.pagosService.findByPaciente(pacienteId);
  }

  @Get('historia/:historiaClinicaId')
  @Roles(Rol.SECRETARIA, Rol.ADMINISTRADOR)
  async getPagosByHistoria(
    @Param('historiaClinicaId', ParseIntPipe) historiaClinicaId: number,
  ) {
    return this.pagosService.getPagosByHistoriaClinica(historiaClinicaId);
  }

  @Get('reporte/dia')
  @Roles(Rol.MEDICO, Rol.ADMINISTRADOR, Rol.SECRETARIA)
  async getReporteDia(@CurrentUser() user: any) {
    return this.pagosService.getReporteDia(user);
  }

  @Get('reporte/mes')
  @Roles(Rol.MEDICO, Rol.ADMINISTRADOR, Rol.SECRETARIA)
  async getReporteMes(
    @Query('anio') anio?: string,
    @Query('mes') mes?: string,
    @CurrentUser() user?: any,
  ) {
    const anioNum = anio ? parseInt(anio, 10) : undefined;
    const mesNum = mes ? parseInt(mes, 10) - 1 : undefined; // -1 porque los meses en JS son 0-11
    return this.pagosService.getReporteMes(anioNum, mesNum, user);
  }

  @Get('reporte/anio')
  @Roles(Rol.MEDICO, Rol.ADMINISTRADOR, Rol.SECRETARIA)
  async getReporteAnio(@Query('anio') anio?: string, @CurrentUser() user?: any) {
    const anioNum = anio ? parseInt(anio, 10) : undefined;
    return this.pagosService.getReporteAnio(anioNum, user);
  }

  @Get('estadisticas')
  @Roles(Rol.MEDICO, Rol.ADMINISTRADOR, Rol.SECRETARIA)
  async getEstadisticas(@CurrentUser() user?: any) {
    return this.pagosService.getEstadisticas(user);
  }

  @Get(':id')
  @Roles(Rol.SECRETARIA, Rol.ADMINISTRADOR)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pagosService.findOne(id);
  }

  @Patch(':id')
  @Roles(Rol.SECRETARIA, Rol.ADMINISTRADOR)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePagoDto: UpdatePagoDto,
  ) {
    return this.pagosService.update(id, updatePagoDto);
  }

  @Delete(':id')
  @Roles(Rol.SECRETARIA, Rol.ADMINISTRADOR)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.pagosService.remove(id);
  }
}

