import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEmail } from 'class-validator';

export class CreatePacienteDto {
  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsDateString()
  @IsOptional()
  fechaNacimiento?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsNotEmpty()
  obraSocial: string;

  @IsString()
  @IsOptional()
  numeroAfiliado?: string;
}




