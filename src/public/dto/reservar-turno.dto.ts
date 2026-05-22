import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ReservarTurnoDto {
  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsString()
  @IsNotEmpty()
  obraSocial: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsDateString()
  @IsOptional()
  fechaNacimiento?: string;

  @IsInt()
  @IsNotEmpty()
  medicoId: number;

  @IsDateString()
  @IsNotEmpty()
  fechaHora: string;

  @IsInt()
  @IsOptional()
  @Min(5)
  @Max(480)
  duracionMinutos?: number;

  @IsString()
  @IsOptional()
  motivo?: string;
}
