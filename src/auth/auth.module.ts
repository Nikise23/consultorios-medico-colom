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
        let validExpiresIn = '24h'; // Default seguro
        
        if (expiresIn) {
          const trimmed = String(expiresIn).trim();
          if (trimmed !== '' && (trimmed.match(/^\d+[smhd]$/) || trimmed.match(/^\d+$/))) {
            validExpiresIn = trimmed;
          } else {
            console.warn(`JWT_EXPIRES_IN tiene un valor inválido: "${expiresIn}". Usando default: "24h"`);
          }
        } else {
          console.log('JWT_EXPIRES_IN no está configurado. Usando default: "24h"');
        }
        
        console.log(`JWT configurado con expiresIn: "${validExpiresIn}"`);
        
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




