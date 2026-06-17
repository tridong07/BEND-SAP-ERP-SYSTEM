import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Import decorator của Swagger

export class LoginDto {
  @ApiProperty({ description: 'Tên đăng nhập hệ thống', example: 'admin' })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({ description: 'Mật khẩu tài khoản', example: '123456' })
  @IsString()
  @MinLength(6)
  password!: string;
}