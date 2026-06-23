import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
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

  @IsBoolean()
  @IsOptional()
  usaAgenda?: boolean;
}

