import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MedicosService } from './medicos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';

@Controller('medicos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicosController {
  constructor(private readonly medicosService: MedicosService) {}

  @Get()
  @Roles(Rol.SECRETARIA, Rol.ADMINISTRADOR, Rol.MEDICO)
  async findAll(@Query('especialidad') especialidad?: string) {
    if (especialidad) {
      return this.medicosService.findByEspecialidad(especialidad);
    }
    return this.medicosService.findAll();
  }

  @Get(':id')
  @Roles(Rol.SECRETARIA, Rol.ADMINISTRADOR, Rol.MEDICO)
  async findOne(@Param('id') id: string) {
    return this.medicosService.findOne(+id);
  }
}



