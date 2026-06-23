import { Module } from '@nestjs/common';
import { AgendaAccessService } from './agenda-access.service';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';

@Module({
  controllers: [AgendaController],
  providers: [AgendaService, AgendaAccessService],
  exports: [AgendaService, AgendaAccessService],
})
export class AgendaModule {}
