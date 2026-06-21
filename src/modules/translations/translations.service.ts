import { Injectable } from '@nestjs/common';
import { OracleService } from '../../common/oracle.service';
import { RegisterTranslationDto } from './dto/register-translation.dto';
import OpenAI from 'openai';

@Injectable()
export class TranslationsService {
  private openai: OpenAI;

  constructor(private readonly oracleService: OracleService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? '', // Sử dụng ?? để tránh undefined
    });
  }

  private async translateWithAI(text: string, targetLang: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: `Dịch sang ${targetLang}. Chỉ trả về nội dung.` },
          { role: "user", content: text },
        ],
        temperature: 0.3,
      });
      return response.choices[0].message.content?.trim() ?? text;
    } catch (err) {
      // Nếu gặp lỗi 429 (Rate Limit) hoặc lỗi khác, log lỗi và trả về văn bản gốc
      console.error("⚠️ AI Translation skipped (Error/Quota):", err instanceof Error ? err.message : err);
      return text; // Vẫn trả về giá trị gốc để hệ thống không bị lỗi
    }
  }

  async getAllTranslations() {
    const sql = `SELECT namespace, key, lang, value FROM translations`;
    const rows: any = await this.oracleService.executeQuery(sql);
    
    const result: { [key: string]: any } = { vi: {}, en: {} };
    rows.forEach((r: any) => {
      const ns = r.NAMESPACE;
      const key = r.KEY;
      const lang = r.LANG;
      const val = r.VALUE;

      if (!result[lang][ns]) result[lang][ns] = {};
      result[lang][ns][key] = val;
    });
    return result;
  }

  async registerKey(dto: RegisterTranslationDto) {
    // Ép kiểu chắc chắn là string bằng cách dùng ?? (Nullish Coalescing)
    const key = dto.key ?? 'unknown_key';
    const namespace = dto.namespace ?? 'common';
    const defaultValue = dto.defaultValue ?? key;

    // 1. Dịch bằng AI
    const translatedVal = await this.translateWithAI(defaultValue, "Vietnamese");

    // 2. Lấy kết nối từ Pool
    const conn = await this.oracleService.getConnection();

    try {
      const sql = `
        MERGE INTO translations t
        USING (SELECT :ns AS ns, :k AS k, :l AS l, :v AS v FROM DUAL) src
        ON (t.namespace = src.ns AND t.key = src.k AND t.lang = src.l)
        WHEN NOT MATCHED THEN
          INSERT (namespace, key, lang, value) VALUES (src.ns, src.k, src.l, src.v)
      `;

      // 3. Thực thi lưu
      // Truyền đúng các giá trị đã được đảm bảo là string
      await conn.execute(sql, { ns: namespace, k: key, l: 'en', v: defaultValue }, { autoCommit: false });
      await conn.execute(sql, { ns: namespace, k: key, l: 'vi', v: translatedVal }, { autoCommit: false });
      
      await conn.commit();
      console.log(`✅ Đã đăng ký key: ${key}`);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      if (conn) await conn.close();
    }
  }

  async getVersion() {
    const sql = `SELECT MAX(updated_at) as VER FROM translations`;
    const result: any = await this.oracleService.executeQuery(sql);
    const ver = result?.[0]?.VER ?? new Date().getTime();
    return { version: ver.toString() };
  }
}