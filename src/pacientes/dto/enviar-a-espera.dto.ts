import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEmail, IsInt, IsBoolean, IsNumber, IsEnum, Min } from 'class-validator';
import { TipoPago } from '@prisma/client';

export class EnviarAEsperaDto {
  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsDateString()
  @IsOptional()
  fechaNacimiento?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsNotEmpty()
  obraSocial: string;

  @IsString()
  @IsOptional()
  numeroAfiliado?: string;

  @IsInt()
  @IsNotEmpty()
  medicoId: number;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsBoolean()
  @IsOptional()
  actualizarDatos?: boolean;

  // Datos del pago (obligatorio, puede ser 0 si obra social cubre)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  monto: number;

  @IsEnum(TipoPago)
  @IsNotEmpty()
  tipoPago: TipoPago;

  @IsString()
  @IsOptional()
  numeroComprobante?: string;

  @IsString()
  @IsOptional()
  observacionesPago?: string;

  @IsBoolean()
  @IsOptional()
  prioridad?: boolean;
}


