import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Rol } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BackupService } from './backup.service';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('exportar')
  @Roles(Rol.ADMINISTRADOR)
  async exportar(@Res() res: Response) {
    const backup = await this.backupService.exportarTodo();
    const fecha = new Date().toISOString().slice(0, 10);
    const filename = `backup-consultorios-colom-${fecha}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backup, null, 2));
  }
}
