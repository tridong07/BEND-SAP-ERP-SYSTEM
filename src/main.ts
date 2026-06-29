import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // Import các thành phần của Swagger
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // 1. Cấu hình CORS
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
  });

  // 2. Kích hoạt ValidationPipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // 3. Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('SAP ERP API')                                 // Tiêu đề của trang tài liệu
    .setDescription('Tài liệu API cho hệ thống ERP Backend')  // Mô tả ngắn
    .setVersion('1.0')                                       // Phiên bản API
    .addCookieAuth('sap_session_token')
    .addTag('auth')                                          // Tag nhóm API
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);            // Đường dẫn truy cập: /api-docs
  await app.listen(3001);
}
bootstrap();