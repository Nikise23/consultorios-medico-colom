import { IsInt, IsNotEmpty, IsOptional, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { TipoPago } from '@prisma/client';

export class CreatePagoDto {
  @IsInt()
  @IsNotEmpty()
  pacienteId: number;

  @IsInt()
  @IsOptional()
  historiaClinicaId?: number;

  @IsInt()
  @IsOptional()
  medicoId?: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  monto: number;

  @IsEnum(TipoPago)
  @IsNotEmpty()
  tipoPago: TipoPago;

  @IsString()
  @IsOptional()
  numeroComprobante?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}



