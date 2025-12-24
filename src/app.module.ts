import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PacientesModule } from './pacientes/pacientes.module';
import { AtencionesModule } from './atenciones/atenciones.module';
import { HistoriasClinicasModule } from './historias-clinicas/historias-clinicas.module';
import { PagosModule } from './pagos/pagos.module';
import { MedicosModule } from './medicos/medicos.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    PacientesModule,
    AtencionesModule,
    HistoriasClinicasModule,
    PagosModule,
    MedicosModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

