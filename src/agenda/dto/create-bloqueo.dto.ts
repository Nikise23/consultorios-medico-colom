import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateBloqueoDto {
  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  motivo?: string;
}
