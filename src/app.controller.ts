import { Controller, Get, HttpStatus, HttpCode } from '@nestjs/common';

@Controller('health') // Đổi đường dẫn thành /health
export class AppController {
  @Get()
  @HttpCode(HttpStatus.OK)
  checkHealth() {
    return {
      status: 'online',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}