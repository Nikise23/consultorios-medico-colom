import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateCitaDto {
  @IsInt()
  @IsNotEmpty()
  pacienteId: number;

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

  @IsString()
  @IsOptional()
  notas?: string;

  /** Si true, pasa a CONFIRMADA y dispara notificaciones */
  @IsBoolean()
  @IsOptional()
  confirmar?: boolean;
}
