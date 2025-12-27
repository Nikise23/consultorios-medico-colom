import { Controller, Get, Post, Put, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, BadRequestException, UsePipes } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Rol } from '@prisma/client';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminChangePasswordDto } from './dto/admin-change-password.dto';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.usuariosService.findOne(user.id);
  }

  @Get()
  @Roles(Rol.ADMINISTRADOR)
  async findAll() {
    return this.usuariosService.findAll();
  }

  @Post()
  @Roles(Rol.ADMINISTRADOR)
  async create(@Body() createUsuarioDto: CreateUsuarioDto) {
    console.log('Recibiendo datos para crear usuario:', createUsuarioDto);
    return this.usuariosService.create(createUsuarioDto);
  }

  @Put(':id')
  @Roles(Rol.ADMINISTRADOR)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Patch('profile')
  async updateProfile(@CurrentUser() user: any, @Body() updateData: { nombre?: string; apellido?: string; email?: string }) {
    return this.usuariosService.updateProfile(user.id, updateData);
  }

  @Patch('change-password')
  async changePassword(@CurrentUser() user: any, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usuariosService.changePassword(user.id, changePasswordDto);
  }

  @Patch('theme')
  @UsePipes(new ValidationPipe({ skipMissingProperties: true, whitelist: false, forbidNonWhitelisted: false, transform: false }))
  async updateTheme(@CurrentUser() user: any, @Body() body: any) {
    try {
      // El body puede ser directamente el tema (string o objeto) o estar dentro de una propiedad
      // Aceptamos ambos formatos para mayor flexibilidad
      let themeData = body;
      
      // Si el body es un string directamente (tema predefinido), usarlo
      if (typeof body === 'string') {
        themeData = body;
      }
      // Si el body tiene una propiedad 'tema', usarla
      else if (body.tema !== undefined) {
        themeData = body.tema;
      }
      // Si el body es un objeto con type y data (tema personalizado), usarlo directamente
      else if (body.type === 'custom' && body.data) {
        themeData = body;
      }
      // Si el body es un objeto vacío o tiene propiedades desconocidas, intentar usarlo como tema
      else {
        themeData = body;
      }
      
      // Validar que sea un string (tema predefinido) o un objeto con estructura de tema personalizado
      if (typeof themeData !== 'string' && typeof themeData !== 'object') {
        throw new BadRequestException('El tema debe ser un string (tema predefinido) o un objeto (tema personalizado)');
      }
      
      console.log('Recibiendo tema para usuario', user.id, ':', JSON.stringify(themeData), 'Tipo:', typeof themeData);
      const result = await this.usuariosService.updateTheme(user.id, themeData);
      console.log('Tema actualizado correctamente');
      return result;
    } catch (error) {
      console.error('Error en updateTheme:', error);
      throw error;
    }
  }

  @Patch(':id/change-password')
  @Roles(Rol.ADMINISTRADOR)
  async adminChangePassword(@Param('id', ParseIntPipe) id: number, @Body() adminChangePasswordDto: AdminChangePasswordDto) {
    return this.usuariosService.adminChangePassword(id, adminChangePasswordDto);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }
}



