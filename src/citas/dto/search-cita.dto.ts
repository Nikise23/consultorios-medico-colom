import { IsInt, IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';
import { EstadoCita } from '@prisma/client';
import { Type } from 'class-transformer';

export class SearchCitaDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  medicoId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pacienteId?: number;

  @IsDateString()
  @IsOptional()
  desde?: string;

  @IsDateString()
  @IsOptional()
  hasta?: string;

  @IsEnum(EstadoCita)
  @IsOptional()
  estado?: EstadoCita;

  @IsString()
  @IsOptional()
  dni?: string;

  /** DNI, nombre o apellido del paciente */
  @IsString()
  @IsOptional()
  busqueda?: string;
}
