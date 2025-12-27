import { IsOptional, ValidateIf, IsString, IsObject } from 'class-validator';

export class UpdateThemeDto {
  // Puede ser un string (nombre del tema predefinido) o un objeto (tema personalizado)
  @IsOptional()
  @ValidateIf((o) => typeof o === 'string' || typeof o === 'object')
  tema?: string | { type: string; data: any };
}

