import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const usuario = await this.usuariosService.findByEmail(email);
    
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, usuario.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { password: _, ...result } = usuario;
    return result;
  }

  async login(loginDto: LoginDto) {
    try {
      const usuario = await this.validateUser(loginDto.email, loginDto.password);
      
      const payload = {
        sub: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
      };

      // Intentar firmar el token
      let access_token: string;
      try {
        access_token = this.jwtService.sign(payload);
      } catch (jwtError) {
        console.error('Error al firmar JWT:', jwtError);
        throw new Error(`Error al generar token: ${jwtError.message}`);
      }

      return {
        access_token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          rol: usuario.rol,
          tema: usuario.tema,
        },
      };
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }
}




