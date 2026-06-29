import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../auth/dto/auth.dto';
import { OracleService } from '../../common/oracle.service';
import { MailerService } from '@nestjs-modules/mailer';

interface UserPermissionRow {
  LMT_INS: 'Y' | 'N';
  LMT_UPD: 'Y' | 'N';
  LMT_DEL: 'Y' | 'N';
}

interface SaUserRow {
  USER_ID: string;
  USER_PWD: string;
  USER_NAME: string;
  USER_EMAIL: string;
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService, private oracleService: OracleService, private mailerService: MailerService) {}

  async validateUser(loginDto: LoginDto) {
    const sql = `
      SELECT USER_ID, USER_PWD, USER_NAME 
        FROM SA_USER_M 
       WHERE USER_NO = :username
         AND NVL(USE_STATUS, 'N') = 'N'
    `;

    // Truyền username vào để lấy bản ghi user (tránh truyền password vào SQL nếu có thể)
    const result = await this.oracleService.executeQuery(sql, { username: loginDto.username }) as SaUserRow[];

    if (!result || result.length === 0) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc bị khóa.');
    }

    const user = result[0];

    // Kiểm tra mật khẩu (So sánh với USER_PWD lấy từ database)
    if (loginDto.password !== user.USER_PWD) {
      throw new UnauthorizedException('Mật khẩu không chính xác.');
    }

    // Trả về thông tin user đã xác thực
    return { 
      userId: user.USER_ID, 
      username: user.USER_NAME,
      role: 'USER' 
    };
  }

  async generateToken(user: any) {
    const payload = { userId: user.userId, role: user.role, username: user.username };
    return this.jwtService.sign(payload);
  }

  async getUserProfile(userId: string) {
    const sql = `
      SELECT USER_ID AS "id", 
        USER_NAME AS "name", 
        USER_EMAIL AS "email", 
        DEPT_ID AS "department",
        DECODE(ADMIN_MK, 'Y', 'Quản trị viên', 'NHÂN VIÊN') AS "role" -- Hoặc lấy từ bảng mapping role
      FROM SA_USER_M 
      WHERE USER_ID = :userId
    `;

    const result = await this.oracleService.executeQuery(sql, { userId });

    if (!result || result.length === 0) {
      throw new Error('Không tìm thấy thông tin người dùng.');
    }

    return result[0];
  }

  async requestPasswordReset(username: string) {
    // 1. Kiểm tra user tồn tại VÀ lấy email (giả sử bảng SA_USER_M có cột USER_EMAIL)
    const sqlCheck = `SELECT USER_ID, USER_EMAIL FROM SA_USER_M WHERE USER_NO = :username`;
    const result = await this.oracleService.executeQuery(sqlCheck, { username }) as SaUserRow[];

    if (!result || result.length === 0) {
      throw new UnauthorizedException('Người dùng không tồn tại.');
    }
    
    const user = result[0];
    // 1. Kiểm tra tồn tại
    if (!user.USER_EMAIL || user.USER_EMAIL.trim() === '') {
      throw new UnauthorizedException('Tài khoản của bạn chưa được cập nhật email, vui lòng liên hệ quản trị viên.');
    }
    // 2. Kiểm tra định dạng email bằng Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.USER_EMAIL.trim())) {
      throw new UnauthorizedException('Email trong hệ thống không đúng định dạng, vui lòng liên hệ quản trị viên.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 2. Lưu OTP vào DB
    const sqlUpdate = `
      UPDATE SA_USER_M 
      SET RESET_OTP = :otp, 
          RESET_EXPIRE = SYSDATE + (5/1440) 
      WHERE USER_NO = :username
    `;
    await this.oracleService.executeQuery(sqlUpdate, { otp, username });

    // 3. Gửi email
    try {
      await this.mailerService.sendMail({
        to: user.USER_EMAIL, // Dùng email lấy từ DB
        subject: 'Mã xác thực đổi mật khẩu SAP ERP',
        text: `Chào bạn, mã xác thực của bạn là: ${otp}. Mã này có hiệu lực trong 5 phút.`,
      });
    } catch (error) {
      console.error('Lỗi gửi email:', error);
      throw new Error('Không thể gửi email xác thực.');
    }

    return { message: 'Mã xác thực đã được gửi đến email của bạn.' };
  }

  async resetPassword(username: string, otp: string, newPassword: string) {
    // 1. Kiểm tra OTP hợp lệ và chưa hết hạn
    const sqlCheck = `
      SELECT USER_ID FROM SA_USER_M 
      WHERE USER_NO = :username AND RESET_OTP = :otp AND RESET_EXPIRE > SYSDATE
    `;
    const result = await this.oracleService.executeQuery(sqlCheck, { username, otp });

    if (!result || result.length === 0) {
      throw new UnauthorizedException('Mã xác thực không hợp lệ hoặc đã hết hạn.');
    }

    // 2. Cập nhật mật khẩu mới
    const sqlUpdate = `
      UPDATE SA_USER_M 
      SET USER_PWD = :newPassword, 
          RESET_OTP = NULL, 
          RESET_EXPIRE = NULL 
      WHERE USER_NO = :username
    `;
    await this.oracleService.executeQuery(sqlUpdate, { newPassword, username });

    return { message: 'Đổi mật khẩu thành công.' };
  }

  async getPermissionsByRole(userId: string, menuId: string) {
    const sql = `
      SELECT LMT_INS, LMT_UPD, LMT_DEL 
      FROM V_USER_SAFE 
      WHERE MENU_ID = :menuId AND USER_ID = :userId
    `;

    const result = await this.oracleService.executeQuery(sql, { menuId, userId }) as UserPermissionRow[];
  
    if (!result || result.length === 0) {
      return { canAdd: false, canEdit: false, canDelete: false };
    }

    const row = result[0];
    return {
      canAdd: row.LMT_INS === 'Y',
      canEdit: row.LMT_UPD === 'Y',
      canDelete: row.LMT_DEL === 'Y'
    };
  }
}