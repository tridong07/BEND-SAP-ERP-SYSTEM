import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { DatabaseModule } from '../../database/database.module'; // 1. Import Module chứa Service

@Module({
  imports: [DatabaseModule],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}