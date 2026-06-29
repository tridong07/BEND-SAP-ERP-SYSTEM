import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { OracleService } from '../../common/oracle.service';

@Injectable()
export class OrganizationService {
  constructor(private readonly oracleService: OracleService) {}

  // Lấy dữ liệu 3 cấp (Dept -> Class -> Sec)
  async getFullTree() {
    const sql = `
        SELECT C.FACT_NO, C.DEPT_NO, C.DEPT_NAME, C.DEPT_NAME_VN, B.CLASS_NO, B.CLASS_NAME, B.CLASS_NAME_VN, A.SEC_NO, A.SEC_NAME, A.SEC_NAME_VN
          FROM PER_SECM A, PER_CLASS B, PER_DEPTM C
         WHERE C.FACT_NO = B.FACT_NO(+)
           AND C.DEPT_NO = B.DEPT_NO(+)
           AND B.FACT_NO = A.FACT_NO(+)
           AND B.DEPT_NO = A.DEPT_NO(+)
           AND B.CLASS_NO = A.CLASS_NO(+)
         ORDER BY C.DEPT_NO, B.CLASS_NO, A.SEC_NO
    `;
    
    const rows = await this.oracleService.executeQuery(sql);
    // Logic: Vì SQL trả về danh sách phẳng (flat), bạn cần nhóm lại thành cấu trúc cây
    return this.transformToTree(rows ?? []);
  }

  // Helper để biến đổi danh sách phẳng thành cây
  private transformToTree(rows: any[]) {
    const tree: any[] = [];

    rows.forEach((row) => {
        // 1. Xử lý Dept (Cấp 1) - Key duy nhất là FACT_NO + DEPT_NO
        let dept = tree.find((d) => d.fact_no === row.FACT_NO && d.id === row.DEPT_NO);
        if (!dept) {
        dept = { 
            fact_no: row.FACT_NO,
            id: row.DEPT_NO, 
            name: row.DEPT_NAME, 
            name_vn: row.DEPT_NAME_VN, 
            level: 1, 
            children: [] 
        };
        tree.push(dept);
        }

        // 2. Xử lý Class (Cấp 2)
        if (row.CLASS_NO) {
        let cls = dept.children.find((c: any) => c.id === row.CLASS_NO);
        if (!cls) {
            cls = { 
            fact_no: row.FACT_NO,
            id: row.CLASS_NO, 
            code_main: row.DEPT_NO,
            name: row.CLASS_NAME, 
            name_vn: row.CLASS_NAME_VN,
            level: 2, 
            children: [] 
            };
            dept.children.push(cls);
        }

        // 3. Xử lý Section (Cấp 3)
        if (row.SEC_NO) {
            // Kiểm tra để tránh thêm trùng Section nếu query trả về dư thừa
            const exists = cls.children.find((s: any) => s.id === row.SEC_NO);
            if (!exists) {
            cls.children.push({
                fact_no: row.FACT_NO,
                id: row.SEC_NO,
                code_main: row.DEPT_NO,
                code_mid: row.CLASS_NO,
                name: row.SEC_NAME,
                name_vn: row.SEC_NAME_VN,
                level: 3
            });
            }
        }
        }
    });

    return tree;
    }

  // Tạo Section mới
  async createOrUpdateNode(dto: {mode: 'CREATE' | 'EDIT'; level: number; code: string, code_main : string, code_mid : string; name: string; name_vn: string; fact_no: string }) {
    const conn = await this.oracleService.getConnection();
    try {
        let sql = '';
        let params = {};

        // Sử dụng MERGE INTO cho từng cấp
        if (dto.level === 1) { // Dept
            sql = `
            MERGE INTO PER_DEPTM target
            USING (SELECT :fact as fact_no, :dept as dept_no FROM DUAL) source
            ON (target.FACT_NO = source.fact_no AND target.DEPT_NO = source.dept_no)
            WHEN MATCHED THEN UPDATE SET DEPT_NAME = :dName, DEPT_NAME_VN = :dvnName
            WHEN NOT MATCHED THEN INSERT (FACT_NO, DEPT_NO, DEPT_NAME, DEPT_NAME_VN, DEPT_KIND) 
            VALUES (:fact, :dept, :dName, :dvnName, '1')
            `;
            params = { fact: dto.fact_no, dept: dto.code, dName: dto.name, dvnName: dto.name_vn };
        } else if (dto.level === 2) { // Class
            sql = `
            MERGE INTO PER_CLASS target
            USING (SELECT :fact as fact_no, :dept as dept_no, :cls as cls_no FROM DUAL) source
            ON (target.FACT_NO = source.fact_no AND target.DEPT_NO = source.dept_no AND target.CLASS_NO = source.cls_no)
            WHEN MATCHED THEN UPDATE SET CLASS_NAME = :cName, CLASS_NAME_VN = :cvnName
            WHEN NOT MATCHED THEN INSERT (FACT_NO, DEPT_NO, CLASS_NO, CLASS_NAME, CLASS_NAME_VN) 
            VALUES (:fact, :dept, :cls, :cName, :cvnName)
            `;
            params = { fact: dto.fact_no, dept: dto.code_main, cls: dto.code, cName: dto.name, cvnName: dto.name_vn };
        } else { // Level 3 - Section
            sql = `
            MERGE INTO PER_SECM target
            USING (SELECT :fact as fact_no, :dept as dept, :cls as cls, :sec as sec_no FROM DUAL) source
            ON (target.FACT_NO = source.fact_no AND target.DEPT_NO = source.dept AND target.CLASS_NO = source.cls AND target.SEC_NO = source.sec_no)
            WHEN MATCHED THEN UPDATE SET SEC_NAME = :sName, SEC_NAME_VN = :svnName
            WHEN NOT MATCHED THEN INSERT (FACT_NO, DEPT_NO, CLASS_NO, SEC_NO, SEC_NAME, SEC_NAME_VN) 
            VALUES (:fact, :dept, :cls, :sec, :sName, :svnName)
            `;
            params = { fact: dto.fact_no, dept: dto.code_main, cls: dto.code_mid, sec: dto.code, sName: dto.name, svnName: dto.name_vn };
        }

        await conn.execute(sql, params, { autoCommit: false });
        await conn.commit();
        return { success: true, message: 'Dữ liệu đã được xử lý thành công (nếu trùng sẽ được bỏ qua)' };

    } catch (err) {
        await conn.rollback();
        // Kiểm tra xem err có phải là một Error object không
        const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
        // Nếu là lỗi của Oracle, nó thường có thuộc tính 'code'
        const errorCode = (err as any)?.code || 'UNKNOWN_ORACLE_ERROR';
        console.error(`❌ Oracle Error [${errorCode}]: ${errorMessage}`);
        throw new InternalServerErrorException(`Lỗi Database: ${errorMessage}`);
    } finally {
        await conn.close();
    }
  }

  async deleteNode(level: number, fact_no: string, dept_no: string, cls_no?: string, sec_no?: string) {
    const conn = await this.oracleService.getConnection();
    try {
        let checkSql = `
            SELECT COUNT(*) AS CNT FROM DUAL WHERE EXISTS (
                SELECT 1 FROM PER_PNLM WHERE FACT_NO = :fact AND (
                    (:lvl = 3 AND SEC_NO = :sec) OR 
                    (:lvl = 2 AND CLASS_NO = :cls) OR 
                    (:lvl = 1 AND DEPT_NO = :dept)
                )
                UNION ALL
                SELECT 1 FROM PER_PNLM_DAILY_SEC_NO WHERE FACT_NO = :fact AND (
                    (:lvl = 3 AND SEC_NO = :sec) OR 
                    (:lvl = 2 AND CLASS_NO = :cls) OR 
                    (:lvl = 1 AND DEPT_NO = :dept)
                )
            )
        `;

        const params = { fact: fact_no || '0000', dept: dept_no, cls: cls_no || '0', sec: sec_no || '0', lvl: level };
        const result = await conn.execute(checkSql, params);
        
        if ((result.rows as any)[0].CNT > 0) {
            throw new Error("Đơn vị này đã có dữ liệu phát sinh, không thể xóa!");
        }

        // --- BƯỚC 2: XÓA THEO TẦNG ---
        if (level === 1) { // Xóa Bộ phận -> Xóa cả Khoa và Tổ bên trong
            await conn.execute(`DELETE FROM PER_SECM WHERE FACT_NO = :fact AND DEPT_NO = :dept`, { fact: fact_no, dept: dept_no });
            await conn.execute(`DELETE FROM PER_CLASS WHERE FACT_NO = :fact AND DEPT_NO = :dept`, { fact: fact_no, dept: dept_no });
            await conn.execute(`DELETE FROM PER_DEPTM WHERE FACT_NO = :fact AND DEPT_NO = :dept`, { fact: fact_no, dept: dept_no });
        } 
        else if (level === 2) { // Xóa Khoa -> Xóa cả Tổ bên trong
            await conn.execute(`DELETE FROM PER_SECM WHERE FACT_NO = :fact AND DEPT_NO = :dept AND CLASS_NO = :cls`, { fact: fact_no, dept: dept_no, cls: cls_no });
            await conn.execute(`DELETE FROM PER_CLASS WHERE FACT_NO = :fact AND DEPT_NO = :dept AND CLASS_NO = :cls`, { fact: fact_no, dept: dept_no, cls: cls_no });
        }
        else { // Xóa Tổ
            await conn.execute(`DELETE FROM PER_SECM WHERE FACT_NO = :fact AND DEPT_NO = :dept AND CLASS_NO = :cls AND SEC_NO = :sec`, { fact: fact_no, dept: dept_no, cls: cls_no, sec: sec_no });
        }

        await conn.commit(); // Hoàn tất nếu tất cả lệnh xóa thành công
        return { success: true, message: 'Đã xóa đơn vị và các đơn vị con thành công.' };

    } catch (err) {
        await conn.rollback();
        const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
        console.error(`❌ Delete Error: ${errorMessage}`);
        throw new InternalServerErrorException(errorMessage);
    } finally {
        await conn.close();
    }
  }
}