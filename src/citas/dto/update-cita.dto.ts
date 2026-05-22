import {
  IsInt,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { EstadoCita } from '@prisma/client';

export class UpdateCitaDto {
  @IsInt()
  @IsOptional()
  medicoId?: number;

  @IsDateString()
  @IsOptional()
  fechaHora?: string;

  @IsInt()
  @IsOptional()
  @Min(5)
  @Max(480)
  duracionMinutos?: number;

  @IsEnum(EstadoCita)
  @IsOptional()
  estado?: EstadoCita;

  @IsString()
  @IsOptional()
  motivo?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}
