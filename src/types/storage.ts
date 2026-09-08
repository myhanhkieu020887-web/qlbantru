export interface StorageImportItem {
  id: string;
  foodName: string;
  foodCode?: string;          // Ví dụ: 49614, 48912, 803, 1178...
  storageLocation: string;    // "Kho trưa", "Kho sáng", "Kho phụ"
  quantity: number;           // Số lượng nhập
  unitPrice: number;          // Đơn giá nhập
  totalPrice: number;         // Thành tiền = quantity * unitPrice
  importDate: string;         // "06/09/2026"
  supplierName: string;       // "Ngô Thị Thu Thủy", "C.ty TNHH Kinh doanh tổng hợp Gia Khang"...
  unit: string;               // "Lít", "Kg", "Hộp", "Bao"...
  branchId: number | string;  // 1 (Điểm trường 1), 2 (Điểm trường 2)
  updatedAt: string;          // "07/09/2026, 14:33:06"
  notes?: string;
}

export interface StorageDateGroup {
  date: string;               // "06/09/2026"
  itemCount: number;          // 9
  totalGroupAmount: number;   // 57,061,000
  items: StorageImportItem[];
  isExpanded?: boolean;       // Trạng thái mở/đóng Accordion
}
