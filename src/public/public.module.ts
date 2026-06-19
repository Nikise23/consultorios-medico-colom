import { Module } from '@nestjs/common';
import { CitasModule } from '../citas/citas.module';
import { MedicosModule } from '../medicos/medicos.module';
import { PacientesModule } from '../pacientes/pacientes.module';
import { AgendaModule } from '../agenda/agenda.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [MedicosModule, PacientesModule, CitasModule, AgendaModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
