import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 

@ApiTags('dashboard')
@Controller('dashboard') // BẮT BUỘC PHẢI BỎ COMMENT DÒNG NÀY
export class DashboardController {
  
  @Get('summary')
  @ApiOperation({ summary: 'Lấy dữ liệu tổng quan cho Dashboard' })
  @ApiResponse({ status: 200, description: 'Trả về thành công dữ liệu Dashboard' })
  // @UseGuards(JwtAuthGuard) 
  getDashboardSummary() {
    return {
      stats: [
        { title: 'Doanh thu', value: '$142,500', change: '+12.4%', isUp: true, targetView: 'DASHBOARD' },
        { title: 'Nhân sự', value: '32', change: '+4.8%', isUp: true, targetView: 'HR_EMPLOYEES' },
        { title: 'Đơn ký', value: '09', change: '-2 chủ nhật', isUp: false, targetView: 'WF_MONITOR' },
        { title: 'Tỷ lệ', value: '94.2%', change: '+1.5%', isUp: true, targetView: 'DASHBOARD' },
      ],
      recentWorkflows: [
        { id: 'WF-092', content: 'Phê duyệt ngân sách dự án SAP Cloud v4', requester: 'Nguyễn Trung Kiên (IT)', date: '14/06/2026', status: 'pending' },
        { id: 'WF-091', content: 'Yêu cầu cấp phát Laptop Dev', requester: 'Trần Thị Hồng (HR)', date: '14/06/2026', status: 'approved' },
        { id: 'WF-089', content: 'Đề xuất tăng ca Oracle DB', requester: 'Phạm Minh Hoàng (Ops)', date: '13/06/2026', status: 'approved' },
      ],
      chartData: [
        { label: 'Thứ 2', value: 30 },
        { label: 'Thứ 3', value: 45 },
        { label: 'Thứ 4', value: 70 },
        { label: 'Thứ 5', value: 50 },
        { label: 'Thứ 6', value: 85 },
        { label: 'Thứ 7', value: 60 },
        { label: 'Chủ nhật', value: 95 },
      ],
      infrastructure: {
        bufferCache: 99.2,
        activeConnections: 42,
        redoLogUsage: 65,
      }
    };
  }
}