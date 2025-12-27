import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret) {
          throw new Error('JWT_SECRET no está definido en las variables de entorno. Por favor, crea un archivo .env con JWT_SECRET.');
        }
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN');
        // Validar que expiresIn sea un string válido o usar el default
        const validExpiresIn = expiresIn && typeof expiresIn === 'string' && expiresIn.trim() !== '' 
          ? expiresIn.trim() 
          : '24h';
        
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: validExpiresIn,
          },
        };
      },
    }),
    UsuariosModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}




