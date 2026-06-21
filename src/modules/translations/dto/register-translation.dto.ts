import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterTranslationDto {
  @IsString()
  @IsNotEmpty()
  key?: string;

  @IsString()
  @IsNotEmpty()
  namespace?: string;

  @IsString()
  @IsOptional()
  defaultValue?: string;
}