import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as oracledb from 'oracledb';

@Injectable()
export class OracleService implements OnModuleInit, OnModuleDestroy {
  private pool!: oracledb.Pool;

  async onModuleInit() {
    // Khởi tạo Pool khi ứng dụng khởi chạy
    this.pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING, // VD: "localhost:1521/xe"
    });
    console.log('✅ Oracle Connection Pool đã sẵn sàng!');
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

  async onModuleDestroy() {
    await this.pool.close(); // Đóng Pool khi tắt server
  }
}