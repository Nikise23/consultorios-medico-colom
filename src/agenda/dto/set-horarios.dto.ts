import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HorarioItemDto {
  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'horaInicio debe tener formato HH:mm',
  })
  horaInicio: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'horaFin debe tener formato HH:mm',
  })
  horaFin: string;

  @IsInt()
  @Min(5)
  @Max(120)
  slotMinutos: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class SetHorariosDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => HorarioItemDto)
  horarios: HorarioItemDto[];
}
