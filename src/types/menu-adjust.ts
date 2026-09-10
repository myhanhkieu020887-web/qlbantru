export interface MenuAdjustRecord {
  id: string;
  stt: number;
  date: string;               // "30/09/2026" (Định dạng hiển thị)
  rawDate: string;            // "2026-09-30" (Dùng liên kết dữ liệu hệ thống)
  targetGroups: string[];     // ["Mẫu giáo", "Ăn sáng"] hoặc ["Nhà trẻ", "Mẫu giáo", "Ăn sáng"]
  targetGroupsDisplay: string;// "Mẫu giáo ; Ăn sáng"
  menuNamesDisplay: string;   // "TRƯA. 30/9/2026; SÁNG. 30/9/2026"
  studentCount: number;       // 800, 1206, 1194...
  mealPricesDisplay: string;  // "21000; 7000" hoặc "21000; 21000; 7000"
  createdAt: string;          // "31/08/2026, 15:05:33"
  updatedAt: string;          // "07/09/2026, 20:56:17"
  status?: 'DRAFT' | 'OPTIMIZED' | 'APPROVED' | 'LOCKED';
  notes?: string;
}
