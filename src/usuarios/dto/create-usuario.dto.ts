import { IsEmail, IsString, IsEnum, IsOptional, MinLength, IsNotEmpty } from 'class-validator';
import { Rol } from '@prisma/client';

export class CreateUsuarioDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(Rol)
  @IsNotEmpty()
  rol: Rol;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  // Campos opcionales para médicos
  @IsString()
  @IsOptional()
  matricula?: string;

  @IsString()
  @IsOptional()
  especialidad?: string;
}

