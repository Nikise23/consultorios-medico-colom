import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class ReservarTurnoDto {
  @IsString()
  @IsOptional()
  pacienteToken?: string;

  @IsString()
  @ValidateIf((o: ReservarTurnoDto) => !o.pacienteToken)
  @IsNotEmpty()
  dni?: string;

  @IsString()
  @ValidateIf((o: ReservarTurnoDto) => !o.pacienteToken)
  @IsNotEmpty()
  nombre?: string;

  @IsString()
  @ValidateIf((o: ReservarTurnoDto) => !o.pacienteToken)
  @IsNotEmpty()
  apellido?: string;

  @IsString()
  @ValidateIf((o: ReservarTurnoDto) => !o.pacienteToken)
  @IsNotEmpty()
  obraSocial?: string;

  @IsString()
  @ValidateIf((o: ReservarTurnoDto) => !o.pacienteToken)
  @IsNotEmpty()
  telefono?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsDateString()
  @ValidateIf((o: ReservarTurnoDto) => !o.pacienteToken)
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
