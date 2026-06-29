import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigService
import { MailerModule } from '@nestjs-modules/mailer'; // Import MailerModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TranslationsModule } from './modules/translations/translations.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrganizationModule } from './modules/organization/organization.module';

@Module({
  imports: [
    // 1. Cấu hình ConfigModule global
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Cấu hình MailerModule bất đồng bộ
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST') || 'smtp.gmail.com',
          port: 587,
          secure: false, // true cho port 465, false cho port 587
          auth: {
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASS'),
          },
        },
        defaults: {
          from: '"SAP ERP System" <no-reply@yourcompany.com>',
        },
      }),
    }),

    // 3. Các module nghiệp vụ
    DatabaseModule,
    AuthModule,
    DashboardModule,
    TranslationsModule,
    MenuModule,
    OrganizationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}