import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      console.error('Error en AuthController.login:', error);
      // Si es un UnauthorizedException, mantenerlo
      if (error.status === 401) {
        throw error;
      }
      // Para otros errores, devolver 500 con mensaje genérico
      throw new HttpException(
        error.message || 'Error interno del servidor',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}




