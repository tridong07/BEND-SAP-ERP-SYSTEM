export interface KpiStat {
  title: string;
  value: string;
  change: string;
  isUp: boolean;
  targetView: string;
}

export interface WorkflowItem {
  id: string;
  content: string;
  requester: string;
  date: string;
  status: 'pending' | 'approved';
}

export interface DashboardResponse {
  stats: KpiStat[];
  recentWorkflows: WorkflowItem[];
  infrastructure: {
    bufferCache: number;
    activeConnections: number;
    redoLogUsage: number;
  };
}

export interface ChartDataPoint {
  label: string; // "Thứ 2", "Thứ 4", v.v.
  value: number; // Giá trị để vẽ điểm trên biểu đồ
}

export interface DashboardResponse {
  // ... các trường cũ
  chartData: ChartDataPoint[]; 
}