import { Injectable } from '@nestjs/common';
import { OracleService } from '../../common/oracle.service'; // Đường dẫn tới service Oracle của bạn

export interface MenuNode {
  menuNo: string;
  menuName: string;
  winNo?: string;
  iconName?: string;
  children: MenuNode[];
}

@Injectable()
export class MenuService {
  constructor(private readonly oracleService: OracleService) {}

  async getMenuTree(): Promise<MenuNode[]> {
    const sql = `SELECT menu_no, menu_name, up_menu_no, win_no, icon_name 
                FROM sa_sysmenu WHERE USE_MK = 'Y' ORDER BY menu_no ASC`;
    const result = await this.oracleService.executeQuery(sql);
    const rows: any[] = Array.isArray(result) ? result : [];

    const menuMap: Record<string, MenuNode> = {};
    const tree: MenuNode[] = [];

    // 1. Tạo Map tất cả các node trước
    rows.forEach((r) => {
      menuMap[r.MENU_NO] = {
        menuNo: r.MENU_NO,
        menuName: r.MENU_NAME,
        winNo: r.WIN_NO,
        iconName: r.ICON_NAME,
        children: [], // Khởi tạo mảng con
      };
    });

    // 2. Liên kết các node con vào cha
    rows.forEach((r) => {
      const node = menuMap[r.MENU_NO];
      // Chú ý: Cần đảm bảo r.UP_MENU_NO khớp với MENU_NO của cha
      if (r.UP_MENU_NO && menuMap[r.UP_MENU_NO]) {
        menuMap[r.UP_MENU_NO].children.push(node);
      } else {
        // Nếu không có cha, nó là node gốc
        tree.push(node);
      }
    });

    return tree;
  }
}