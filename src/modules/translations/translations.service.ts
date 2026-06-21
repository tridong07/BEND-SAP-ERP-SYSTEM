import { Injectable } from '@nestjs/common';
import { OracleService } from '../../common/oracle.service';
import { RegisterTranslationDto } from './dto/register-translation.dto';
import OpenAI from 'openai';

@Injectable()
export class TranslationsService {
  private openai: OpenAI;
  // Cache in-memory để tránh gọi DB/AI cho các key đã tồn tại
  private static registeredKeysCache = new Set<string>();

  constructor(private readonly oracleService: OracleService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? '',
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
      console.error("⚠️ AI Translation skipped:", err instanceof Error ? err.message : err);
      return text;
    }
  }

  async getAllTranslations() {
    const sql = `SELECT namespace, key, lang, value FROM translations`;
    const rows: any = await this.oracleService.executeQuery(sql);
    
    // Nạp toàn bộ key hiện có vào cache khi khởi động hệ thống
    rows.forEach((r: any) => {
      TranslationsService.registeredKeysCache.add(`${r.NAMESPACE}:${r.KEY}`);
    });

    const result: { [key: string]: any } = { vi: {}, en: {} };
    rows.forEach((r: any) => {
      if (!result[r.LANG][r.NAMESPACE]) result[r.LANG][r.NAMESPACE] = {};
      result[r.LANG][r.NAMESPACE][r.KEY] = r.VALUE;
    });
    return result;
  }

  async registerKey(dto: RegisterTranslationDto) {
    const key = dto.key ?? 'unknown_key';
    const namespace = dto.namespace ?? 'common';
    const cacheKey = `${namespace}:${key}`;

    // Kiểm tra Cache: Nếu đã có thì không làm gì cả
    if (TranslationsService.registeredKeysCache.has(cacheKey)) {
      return;
    }

    const defaultValue = dto.defaultValue ?? key;
    const translatedVal = await this.translateWithAI(defaultValue, "Vietnamese");

    const conn = await this.oracleService.getConnection();

    try {
      const sql = `
        MERGE INTO translations t
        USING (SELECT :ns AS ns, :k AS k, :l AS l, :v AS v FROM DUAL) src
        ON (t.namespace = src.ns AND t.key = src.k AND t.lang = src.l)
        WHEN NOT MATCHED THEN
          INSERT (namespace, key, lang, value) VALUES (src.ns, src.k, src.l, src.v)
      `;

      await conn.execute(sql, { ns: namespace, k: key, l: 'en', v: defaultValue }, { autoCommit: false });
      await conn.execute(sql, { ns: namespace, k: key, l: 'vi', v: translatedVal }, { autoCommit: false });
      
      await conn.commit();
      
      // Thêm vào Cache sau khi đã lưu DB thành công
      TranslationsService.registeredKeysCache.add(cacheKey);
      console.log(`✅ Đã đăng ký key mới: ${cacheKey}`);
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