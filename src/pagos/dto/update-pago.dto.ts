import { IsNumber, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { TipoPago } from '@prisma/client';

export class UpdatePagoDto {
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  monto?: number;

  @IsEnum(TipoPago)
  @IsOptional()
  tipoPago?: TipoPago;

  @IsString()
  @IsOptional()
  numeroComprobante?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}

