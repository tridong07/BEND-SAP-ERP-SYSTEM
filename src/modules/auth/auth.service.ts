import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../users/dto/login.dto';
import { OracleService } from '../../common/oracle.service'; // Import service vừa tạo

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  /*async validateUser(loginDto: LoginDto) {
    const sql = `
      SELECT MANV, TENNV, CHUCVU 
      FROM NHAN_VIEN 
      WHERE USERNAME = :user AND MATKHAU = :pass
    `;

    const result = await this.oracleService.executeQuery(sql, {
      user: loginDto.username,
      pass: loginDto.password, // Lưu ý: Nên dùng bcrypt để so sánh mật khẩu đã hash!
    });

    if (!result || result.length === 0) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    return result[0]; // Trả về thông tin nhân viên
  }*/

  async validateUser(loginDto: LoginDto) {
    // GIẢ LẬP: Thay vì gọi DB, ta kiểm tra cứng
    if (loginDto.username !== 'admin' || loginDto.password !== '123456') {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác.');
    }

    // Nếu đúng, trả về thông tin user
    return { userId: 'USR_001', role: 'ADMIN', username: loginDto.username };
  }

  async generateToken(user: any) {
    const payload = { userId: user.userId, role: user.role, username: user.username };
    return this.jwtService.sign(payload);
  }
}