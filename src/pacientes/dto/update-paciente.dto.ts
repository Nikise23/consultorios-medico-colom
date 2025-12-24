import { IsString, IsOptional, IsDateString, IsEmail } from 'class-validator';

export class UpdatePacienteDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  apellido?: string;

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
  @IsOptional()
  obraSocial?: string;

  @IsString()
  @IsOptional()
  numeroAfiliado?: string;
}




