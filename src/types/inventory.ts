import { FoodCategory } from './nutrition';

// ==========================================
// 1. QUẢN LÝ KHO BÁN TRÚ (INVENTORY & FIFO)
// ==========================================

export interface InventoryBatch {
  batchId: string;
  batchCode: string;          // Ví dụ: "LO-20260901-01"
  importDate: string;         // "2026-09-01"
  initialQuantity: number;    // Số lượng ban đầu
  remainingQuantity: number;  // Số lượng còn lại trong lô
  unitPrice: number;          // Đơn giá nhập của lô (VNĐ)
  expiryDate: string;         // Hạn sử dụng ("2026-12-31")
  supplierName: string;       // Nhà cung cấp
  storageLocation?: string;   // Vị trí kệ kho (Kệ A1, Kệ B2...)
}

export interface InventoryItem {
  foodId: string;
  foodName: string;
  category: FoodCategory;
  unit: string;               // Kg, Lít, Gói, Chai, Bao...
  gamExchange: number;        // Gam/ĐVT (vd: 1000g/Kg, 5000g/Bao 5kg)
  currentStock: number;       // Tổng tồn kho hiện tại (tổng remainingQuantity của các batches)
  minStockAlert: number;      // Ngưỡng cảnh báo tồn tối thiểu
  averagePrice: number;       // Đơn giá bình quân gia quyền (VNĐ)
  batches: InventoryBatch[];  // Danh sách các lô hàng đang quản lý theo FIFO
  notes?: string;
}

export type TransactionType = 'IMPORT' | 'EXPORT_MENU' | 'EXPORT_MANUAL' | 'ADJUSTMENT';

export interface StockTransaction {
  id: string;
  transactionCode: string;    // "NK-20260909-01" hoặc "XK-20260909-01"
  date: string;
  type: TransactionType;
  foodId: string;
  foodName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  batchId?: string;
  menuDate?: string;          // Ngày của thực đơn nếu xuất tự động
  reason: string;             // "Xuất phục vụ thực đơn ngày 09/09", "Nhập hàng đợt 1 tháng 9"...
  performer: string;          // Người thực hiện (Kế toán/Thủ kho)
}

// ==========================================
// 2. KẾ TOÁN QUYẾT TOÁN TIỀN ĂN (MẪU C38-HD)
// ==========================================

export interface StudentDailyAttendance {
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  status: 'PRESENT' | 'ABSENT_PERMITTED' | 'ABSENT_UNPERMITTED'; // Có mặt, Nghỉ có phép (hoàn tiền), Nghỉ không phép
  breakfast: boolean;
}

export interface StudentSettlementC38 {
  studentId: string;
  studentName: string;
  className: string;
  ageGroup: 'maugiao' | 'nhatre';
  totalSchoolDays: number;     // Tổng số ngày bán trú trong kỳ (vd: 22 ngày)
  actualAttendedDays: number;  // Số ngày ăn thực tế
  excusedAbsenceDays: number;  // Số ngày nghỉ có phép (được hoàn tiền)
  unexcusedAbsenceDays: number;// Số ngày nghỉ không phép (vẫn tính tiền ăn)
  dailyFee: number;            // Mức tiền ăn/ngày (21.000 đ)
  initialAdvancePaid: number;  // Tiền ăn tạm nộp đầu tháng (22 * 21.000 = 462.000 đ)
  actualFoodCost: number;      // Tiền ăn thực tế (actualAttendedDays + unexcusedAbsenceDays) * 21.000 đ
  refundAmount: number;        // Tiền thừa hoàn trả hoặc kết chuyển tháng sau (excusedAbsenceDays * 21.000 đ)
  status: 'PENDING' | 'REFUNDED' | 'CARRIED_FORWARD'; // Chưa xử lý, Đã hoàn tiền mặt, Kết chuyển tháng sau
  parentPhone?: string;
}

export interface ClassSettlementSummary {
  classId: string;
  className: string;
  teacherName: string;
  studentCount: number;
  totalAdvancePaid: number;
  totalActualCost: number;
  totalRefund: number;
}

// ==========================================
// 3. ĐỐI CHIẾU CÔNG NỢ NHÀ CUNG CẤP (MẪU 02-TT)
// ==========================================

export interface SupplierDebtRecord {
  supplierId: string;
  supplierName: string;
  category: string;            // Nhóm hàng phụ trách
  phone: string;
  taxCode?: string;
  bankAccount?: string;
  openingBalance: number;      // Nợ kỳ trước mang sang
  periodPurchases: number;     // Tổng mua trong kỳ (từ các đơn tiếp phẩm PO)
  periodPayments: number;      // Tổng số tiền đã thanh toán/tạm ứng
  closingBalance: number;      // Nợ còn lại cuối kỳ = openingBalance + periodPurchases - periodPayments
  invoiceCount: number;        // Số hóa đơn/chứng từ giao nhận
  status: 'RECONCILED' | 'PENDING_PAYMENT' | 'OVERDUE';
}
