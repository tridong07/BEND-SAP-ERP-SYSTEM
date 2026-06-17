import { Module } from '@nestjs/common';
import { TranslationsController } from './translations.controller';
import { TranslationsService } from './translations.service';
import { OracleService } from '../../common/oracle.service'; 

@Module({
  imports: [], 
  controllers: [TranslationsController],
  providers: [
    TranslationsService, 
    OracleService // ĐÂY LÀ DÒNG BẠN CẦN THÊM VÀO
  ],
  exports: [TranslationsService],
})
export class TranslationsModule {}