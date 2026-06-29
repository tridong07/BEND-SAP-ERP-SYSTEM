import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class CreateFullOrgDto {
  @IsInt()
  @IsNotEmpty()
  level?: number; // 1: Dept, 2: Class, 3: Sec

  @IsString()
  @IsNotEmpty()
  code?: string; // ID của đơn vị (DEPT_NO, CLASS_NO hoặc SEC_NO)

  @IsString()
  @IsOptional()
  code_main?: string; // DEPT_NO cha

  @IsString()
  @IsOptional()
  code_mid?: string; // CLASS_NO cha

  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsString()
  @IsOptional()
  name_vn?: string;

  @IsString()
  @IsNotEmpty()
  fact_no?: string;
}