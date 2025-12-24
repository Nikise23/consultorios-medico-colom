import { IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchPacienteDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  dni?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  apellido?: string;
}



