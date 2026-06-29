import { Module } from '@nestjs/common';
import { TranslationsController } from './translations.controller';
import { TranslationsService } from './translations.service';
import { DatabaseModule } from '../../database/database.module'; // 1. Import Module chứa Service

@Module({
  imports: [DatabaseModule], 
  controllers: [TranslationsController],
  providers: [TranslationsService],
  exports: [TranslationsService],
})
export class TranslationsModule {}