import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Rol } from '@prisma/client';

export class UpdateUsuarioDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  apellido?: string;

  @IsEnum(Rol)
  @IsOptional()
  rol?: Rol;

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

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  activo?: boolean;
}

