export interface StudentMealAttendanceRecord {
  date: string; // '2026-09-01'
  attended: boolean; // Có ăn hay nghỉ
  hasNotice: boolean; // Nghỉ có phép (được trừ tiền ăn) hay không phép
}

export interface StudentMealSettlement {
  id: string;
  studentCode: string; // VD: 'HT2-LA1-01'
  fullName: string;
  dob: string; // '15/05/2021'
  gender: 'Nam' | 'Nữ';
  className: string; // 'Lớp Lá 1'
  gradeGroup: 'maugiao' | 'nhatre';
  initialAdvanceAmount: number; // Tiền đóng đầu tháng (VD: 22 ngày * 21.000đ = 462.000đ)
  plannedDays: number; // 22 ngày
  actualAttendedDays: number; // Số ngày ăn thực tế
  excusedAbsenceDays: number; // Nghỉ có báo trước (được hoàn tiền)
  unexcusedAbsenceDays: number; // Nghỉ không phép
  mealRatePerDay: number; // 21.000đ hoặc 24.000đ
  actualMealCost: number; // Tiền ăn thực tế = actualAttendedDays * mealRatePerDay
  refundAmount: number; // Tiền thừa hoàn trả hoặc chuyển tháng sau
  deficitAmount: number; // Tiền thiếu cần thu thêm (nếu có)
  attendanceHistory: StudentMealAttendanceRecord[];
  note?: string;
}

export interface ClassMealLedgerSummary {
  className: string;
  gradeGroup: 'maugiao' | 'nhatre';
  teacherName: string;
  totalStudents: number;
  dailyMealRate: number;
  totalAdvanceCollected: number;
  totalActualCost: number;
  totalRefundAmount: number;
  totalDeficitAmount: number;
  monthYear: string; // '09/2026'
  students: StudentMealSettlement[];
}
