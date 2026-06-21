import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as oracledb from 'oracledb';

@Injectable()
export class OracleService implements OnModuleInit, OnModuleDestroy {
  private pool!: oracledb.Pool;

  async onModuleInit() {
    // KÍCH HOẠT THICK MODE Ở ĐÂY
    try {
      oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_19_31' }); 
      console.log('✅ Đã kích hoạt Oracle Thick mode!');
    } catch (err) {
      console.error('❌ Không thể kích hoạt Thick mode. Hãy kiểm tra đường dẫn libDir:', err);
    }

    // Khởi tạo Pool khi ứng dụng khởi chạy
    this.pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING, // VD: "localhost:1521/xe"
    });
    console.log('✅ Oracle Connection Pool đã sẵn sàng!');
  }

  // Phương thức mới: Trả về một connection để bạn tự quản lý
  async getConnection(): Promise<oracledb.Connection> {
    return await this.pool.getConnection();
  }

  async executeQuery(sql: string, params: any = {}) {
    let connection: oracledb.Connection;
    try {
      connection = await this.pool.getConnection();
      const result = await connection.execute(sql, params, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      return result.rows;
    } catch (err) {
      throw err;
    } finally {
      if (connection!) await connection.close(); // Trả kết nối về Pool
    }
  }

  // Thêm phương thức commit nếu cần quản lý transaction thủ công
  async commit(connection: oracledb.Connection) {
    await connection.commit();
  }

  async onModuleDestroy() {
    await this.pool.close(); // Đóng Pool khi tắt server
  }
}