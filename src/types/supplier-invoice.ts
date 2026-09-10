import { SupplierType } from './nutrition';

export interface SupplierItemPrice {
  foodCode: string;
  foodName: string;
  unit: string;
  contractPrice: number;
  marketPrice?: number;
  effectiveDate: string;
}

export interface SupplierContract {
  id: string;
  contractNumber: string; // VD: 'HĐ-01/2026/CP'
  supplierId: SupplierType;
  supplierName: string;
  taxCode: string; // Mã số thuế
  address: string;
  phone: string;
  representative: string; // Người đại diện
  bankAccount: string;
  bankName: string;
  startDate: string;
  endDate: string;
  totalContractValue: number;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  items: SupplierItemPrice[];
}

// BƯỚC 1: PHIẾU GIAO NHẬN THỰC PHẨM HÀNG NGÀY
export interface SupplierDeliveryItem {
  foodCode: string;
  foodName: string;
  unit: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  unitPrice: number;
  totalAmount: number;
  qualityPassed: boolean;
  temperature?: string;
  note?: string;
}

export interface SupplierDeliveryNote {
  id: string;
  deliveryCode: string; // VD: 'PGN-CP-20260908'
  date: string;
  supplierId: SupplierType;
  supplierName: string;
  branchId: string; // 'branch_1' | 'branch_2' | 'all'
  branchName: string;
  deliveryTime: string;
  delivererName: string;
  receiverName: string; // Bếp trưởng/Thủ kho nhận
  items: SupplierDeliveryItem[];
  totalAmount: number;
  status: 'DELIVERED' | 'CHECKED' | 'RECONCILED';
}

// BƯỚC 2: BẢNG KÊ ĐỐI CHIẾU HÓA ĐƠN CUỐI THÁNG
export interface MonthlyReconciliationInvoice {
  invoiceNumber: string; // Số hóa đơn VAT
  invoiceDate: string;
  deliveryNoteCodes: string[]; // Các phiếu giao nhận gộp vào
  rawAmount: number; // Tiền trước thuế
  taxAmount: number; // Tiền thuế VAT
  totalAmount: number; // Tổng tiền thanh toán
}

export interface SupplierMonthlyReconciliation {
  id: string;
  code: string; // VD: 'DC-09/2026/CP'
  monthYear: string; // '09/2026'
  supplierId: SupplierType;
  supplierName: string;
  totalDeliveredAmount: number; // Tổng tiền theo phiếu giao hàng
  invoices: MonthlyReconciliationInvoice[];
  reconciledAmount: number;
  difference: number; // Chênh lệch (nếu có)
  status: 'DRAFT' | 'CONFIRMED' | 'APPROVED';
  confirmedBy?: string;
  confirmedAt?: string;
}

// BƯỚC 3: PHIẾU CHI / ỦY NHIỆM CHI THANH TOÁN
export interface SupplierPaymentVoucher {
  id: string;
  voucherNumber: string; // VD: 'UNC-KB-0926-01'
  paymentDate: string;
  supplierId: SupplierType;
  supplierName: string;
  reconciliationCode: string;
  paymentAmount: number;
  paymentMethod: 'KHO_BAC' | 'NGAN_HANG' | 'TIEN_MAT';
  treasurySubItem?: string; // Mã tiểu mục kho bạc (VD: 7049)
  sourceFund: string; // Nguồn kinh phí (Tiền ăn bán trú của phụ huynh)
  paidBy: string; // Kế toán lập
  approvedBy: string; // Hiệu trưởng ký duyệt
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  note?: string;
}
