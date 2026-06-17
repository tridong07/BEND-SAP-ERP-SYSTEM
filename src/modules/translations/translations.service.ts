import { Injectable } from '@nestjs/common';
import { OracleService } from '../../common/oracle.service';

@Injectable()
export class TranslationsService {
  constructor(private readonly oracleService: OracleService) {}

  async getAllTranslations() {
    const sql = `SELECT namespace, key, lang, value FROM translations`;
    const rows: any = await this.oracleService.executeQuery(sql);
    
    const result = { vi: {}, en: {} };
    
    // Oracle thường trả về tên cột viết hoa, ta cần chuyển về object chuẩn
    rows.forEach((r: any) => {
      const ns = r.NAMESPACE;
      const key = r.KEY;
      const lang = r.LANG; // 'vi' hoặc 'en'
      const val = r.VALUE;

      if (!result[lang][ns]) result[lang][ns] = {};
      result[lang][ns][key] = val;
    });
    return result;
  }

  async registerKey(dto: { key: string, namespace: string, defaultValue?: string }) {
    const { key, namespace, defaultValue } = dto;
    const val = defaultValue || key;

    // Sử dụng MERGE INTO để Upsert (Insert nếu chưa có, bỏ qua nếu đã có)
    const sql = `
      MERGE INTO translations t
      USING (SELECT :ns AS ns, :k AS k, :l AS l, :v AS v FROM DUAL) src
      ON (t.namespace = src.ns AND t.key = src.k AND t.lang = src.l)
      WHEN NOT MATCHED THEN
        INSERT (namespace, key, lang, value) VALUES (src.ns, src.k, src.l, src.v)
    `;

    // Đăng ký cho cả tiếng Việt và tiếng Anh
    await this.oracleService.executeQuery(sql, { ns: namespace, k: key, l: 'vi', v: val });
    await this.oracleService.executeQuery(sql, { ns: namespace, k: key, l: 'en', v: val });
  }

  async getVersion() {
    // Lấy timestamp mới nhất
    const sql = `SELECT MAX(updated_at) as VER FROM translations`;
    const result: any = await this.oracleService.executeQuery(sql);
    const ver = result[0]?.VER || new Date().getTime();
    return { version: ver.toString() };
  }
}