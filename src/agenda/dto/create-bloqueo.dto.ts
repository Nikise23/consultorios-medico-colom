import {
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

export class CreateBloqueoDto {
  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  motivo?: string;

  /** Si se omite, bloquea el día completo. */
  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'horaInicio debe ser HH:mm' })
  horaInicio?: string;

  @ValidateIf((o) => !!o.horaInicio)
  @Matches(/^\d{2}:\d{2}$/, { message: 'horaFin debe ser HH:mm' })
  horaFin?: string;
}
