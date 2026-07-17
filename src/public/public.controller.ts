import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { ReservarTurnoDto } from './dto/reservar-turno.dto';
import { ValidarPacienteDto } from './dto/validar-paciente.dto';
import { PublicService } from './public.service';

@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('medicos')
  listarMedicos() {
    return this.publicService.listarMedicos();
  }

  @Get('especialidades')
  listarEspecialidades() {
    return this.publicService.listarEspecialidades();
  }

  @Get('medicos/:id/horarios')
  horarios(@Param('id', ParseIntPipe) id: number) {
    return this.publicService.horarios(id);
  }

  @Get('medicos/:id/disponibilidad')
  disponibilidad(
    @Param('id', ParseIntPipe) id: number,
    @Query('fecha') fecha: string,
  ) {
    if (!fecha) {
      throw new BadRequestException('Parámetro fecha requerido (YYYY-MM-DD)');
    }
    return this.publicService.disponibilidad(id, fecha);
  }

  @Post('pacientes/validar')
  validarPaciente(@Body() dto: ValidarPacienteDto, @Req() req: Request) {
    return this.publicService.validarPaciente(dto, this.getClientKey(req));
  }

  @Post('turnos/reservar')
  reservar(@Body() dto: ReservarTurnoDto, @Req() req: Request) {
    return this.publicService.reservar(dto, this.getClientKey(req));
  }

  private getClientKey(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown'
    );
  }
}
