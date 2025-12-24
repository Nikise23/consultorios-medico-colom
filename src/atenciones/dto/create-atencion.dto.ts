import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAtencionDto {
  @IsInt()
  @IsNotEmpty()
  pacienteId: number;

  @IsInt()
  @IsNotEmpty()
  medicoId: number;

  @IsString()
  @IsOptional()
  observaciones?: string;
}




