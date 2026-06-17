import { Controller, Post, Body, Res, HttpCode, HttpStatus } from '@nestjs/common'; // Thêm HttpCode, HttpStatus
import { AuthService } from './auth.service';
import { Response } from 'express';
import * as DTOs from '../users/dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('auth') // Gắn tag này để nhóm lại trong Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {} // Thêm readonly để bảo mật class member

  @Post('login')
  @HttpCode(HttpStatus.OK) // Định nghĩa rõ mã phản hồi 200
  @ApiOperation({ summary: 'Đăng nhập vào hệ thống' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiBody({ type: DTOs.LoginDto }) // Khai báo rõ kiểu DTO cho Swagger
  async login(
    @Body() loginDto: DTOs.LoginDto, 
    @Res({ passthrough: true }) response: Response
  ) {
    const user = await this.authService.validateUser(loginDto);
    const token = await this.authService.generateToken(user);

    response.cookie('sap_session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    return { 
      success: true, 
      message: 'Đăng nhập hệ thống thành công!' 
    };
  }
}