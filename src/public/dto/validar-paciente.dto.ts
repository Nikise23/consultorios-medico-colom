import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class ValidarPacienteDto {
  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsDateString()
  @IsNotEmpty()
  fechaNacimiento: string;
}
