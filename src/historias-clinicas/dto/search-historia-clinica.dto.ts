import { IsInt, IsOptional, IsDateString, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SearchHistoriaClinicaDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pacienteId?: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  dni?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  apellido?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  medicoId?: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  especialidad?: string;

  @IsDateString()
  @IsOptional()
  fechaDesde?: string;

  @IsDateString()
  @IsOptional()
  fechaHasta?: string;
}


