import { IsString, MinLength } from 'class-validator';

export class AdminChangePasswordDto {
  @IsString()
  @MinLength(6)
  newPassword: string;
}


