import { IsInt, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoPago } from '@prisma/client';

export class SearchPagoDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  pacienteId?: number;

  @IsDateString()
  @IsOptional()
  fechaDesde?: string;

  @IsDateString()
  @IsOptional()
  fechaHasta?: string;

  @IsEnum(TipoPago)
  @IsOptional()
  tipoPago?: TipoPago;
}



