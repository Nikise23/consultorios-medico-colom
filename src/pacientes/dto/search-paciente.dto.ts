import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SearchPacienteDto {
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
  skip?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  take?: number;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  showAll?: boolean;
}



