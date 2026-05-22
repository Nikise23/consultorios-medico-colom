import { Module } from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { PacientesController } from './pacientes.controller';
import { AtencionesModule } from '../atenciones/atenciones.module';
import { PagosModule } from '../pagos/pagos.module';
import { CitasModule } from '../citas/citas.module';

@Module({
  imports: [AtencionesModule, PagosModule, CitasModule],
  controllers: [PacientesController],
  providers: [PacientesService],
  exports: [PacientesService],
})
export class PacientesModule {}


