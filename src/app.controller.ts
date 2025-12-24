import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  @Get()
  @Public()
  getHello() {
    return {
      message: 'Sistema de Gestión de Historias Clínicas - API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        auth: '/auth',
        pacientes: '/pacientes',
        atenciones: '/atenciones',
        historiasClinicas: '/historias-clinicas',
        usuarios: '/usuarios',
      },
      documentation: 'Ver README.md para más información',
    };
  }

  @Get('health')
  @Public()
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}




