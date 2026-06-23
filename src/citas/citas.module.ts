import { Module } from '@nestjs/common';
import { AgendaModule } from '../agenda/agenda.module';
import { CitasService } from './citas.service';
import { CitasController } from './citas.controller';
import { NotificacionesCitaService } from './notificaciones-cita.service';

@Module({
  imports: [AgendaModule],
  controllers: [CitasController],
  providers: [CitasService, NotificacionesCitaService],
  exports: [CitasService, NotificacionesCitaService],
})
export class CitasModule {}
