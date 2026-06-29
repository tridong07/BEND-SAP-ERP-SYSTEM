import { Controller, Post, Body, Res, HttpCode, HttpStatus, Get, UseGuards, Request, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { LoginDto } from '../users/dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard'; // Đảm bảo bạn đã có Guard này

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập vào hệ thống' })
  async login(
    @Body() loginDto: LoginDto, 
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

    return { success: true, message: 'Đăng nhập hệ thống thành công!' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    // Giả sử sau khi xác thực, bạn muốn truy vấn thêm thông tin từ DB dựa trên userId
    return await this.authService.getUserProfile(req.user.userId);
  }

  // Endpoint mới: Lấy quyền của user trên một Menu cụ thể
  @UseGuards(JwtAuthGuard) // Chỉ user đã login mới truy cập được
  @Get('permissions/:menuId')
  @ApiOperation({ summary: 'Lấy quyền của user trên một menu' })
  async getPermissions(
    @Request() req: any, 
    @Param('menuId') menuId: string
  ) {
    // req.user được gán từ JWT payload sau khi qua JwtAuthGuard
    const { userId } = req.user;
    return await this.authService.getPermissionsByRole(userId, menuId);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('username') username: string) {
    return await this.authService.requestPasswordReset(username);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    const { username, otp, newPassword } = body;
    return await this.authService.resetPassword(username, otp, newPassword);
  }
}