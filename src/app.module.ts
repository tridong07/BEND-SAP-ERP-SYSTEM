import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Import thêm
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module'; // 1. Import AuthModule vào đây
import { DashboardModule } from './modules/dashboard/dashboard.module'; // 1. Import AuthModule vào đây
import { TranslationsModule } from './modules/translations/translations.module'; // 1. Import AuthModule vào đây

@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true, 
    }), AuthModule, DashboardModule, TranslationsModule],
  controllers: [AppController],
  providers: [AppService],
  
})
export class AppModule {}
