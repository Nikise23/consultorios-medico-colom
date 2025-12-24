import { Module } from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { PacientesController } from './pacientes.controller';
import { AtencionesModule } from '../atenciones/atenciones.module';
import { PagosModule } from '../pagos/pagos.module';

@Module({
  imports: [AtencionesModule, PagosModule],
  controllers: [PacientesController],
  providers: [PacientesService],
  exports: [PacientesService],
})
export class PacientesModule {}


