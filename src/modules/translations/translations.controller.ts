import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TranslationsService } from './translations.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('translations')
@Controller('translations')
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  @Get('version')
  @ApiOperation({ summary: 'Kiểm tra phiên bản dữ liệu dịch thuật' })
  async getVersion() {
    return await this.translationsService.getVersion();
  }

  @Get()
  @ApiOperation({ summary: 'Lấy dữ liệu dịch thuật' })
  async getTranslations(@Query('lang') lang?: 'vi' | 'en') {
    const allTranslations = await this.translationsService.getAllTranslations();
    if (lang === 'en') return allTranslations.en;
    if (lang === 'vi') return allTranslations.vi;
    return allTranslations;
  }

  @Post('register')
  @ApiOperation({ summary: 'Tự động đăng ký key mới' })
  async registerKey(@Body() dto: { key: string, namespace: string, defaultValue?: string }) {
    return await this.translationsService.registerKey(dto);
  }
}