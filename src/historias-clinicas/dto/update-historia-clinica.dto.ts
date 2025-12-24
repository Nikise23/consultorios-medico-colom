import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';

export class UpdateHistoriaClinicaDto {
  @IsString()
  @IsOptional()
  motivoConsulta?: string;

  @IsString()
  @IsOptional()
  sintomas?: string;

  @IsString()
  @IsOptional()
  diagnostico?: string;

  @IsString()
  @IsOptional()
  tratamiento?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsString()
  @IsOptional()
  presionArterial?: string;

  @IsString()
  @IsOptional()
  temperatura?: string;

  @IsNumber()
  @IsOptional()
  peso?: number;

  @IsNumber()
  @IsOptional()
  altura?: number;

  @IsDateString()
  @IsOptional()
  proximoControl?: string;
}




