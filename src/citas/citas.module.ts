import { Module } from '@nestjs/common';
import { CitasService } from './citas.service';
import { CitasController } from './citas.controller';
import { NotificacionesCitaService } from './notificaciones-cita.service';

@Module({
  controllers: [CitasController],
  providers: [CitasService, NotificacionesCitaService],
  exports: [CitasService, NotificacionesCitaService],
})
export class CitasModule {}
