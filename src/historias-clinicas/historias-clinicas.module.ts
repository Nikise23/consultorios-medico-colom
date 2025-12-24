import { Module } from '@nestjs/common';
import { HistoriasClinicasService } from './historias-clinicas.service';
import { HistoriasClinicasController } from './historias-clinicas.controller';
import { AtencionesModule } from '../atenciones/atenciones.module';

@Module({
  imports: [AtencionesModule],
  controllers: [HistoriasClinicasController],
  providers: [HistoriasClinicasService],
  exports: [HistoriasClinicasService],
})
export class HistoriasClinicasModule {}




