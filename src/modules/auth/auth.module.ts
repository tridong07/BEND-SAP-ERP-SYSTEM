import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import để dùng biến môi trường
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
// import { OracleModule } from '../../common/oracle.module'; // Nếu bạn tách Oracle ra module riêng

@Module({
  imports: [
    // 1. Dùng ConfigModule để lấy JWT_SECRET từ file .env
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    // 2. Import các module khác nếu cần (ví dụ: UsersModule, DatabaseModule)
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService], // Export nếu các module khác cần gọi AuthService
})
export class AuthModule {}