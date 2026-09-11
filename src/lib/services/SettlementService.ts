import { SEED_CLASS_ATTENDANCE } from '@/data/seed-attendance';

export interface ClassSettlementItem {
  classId: string;
  className: string;
  grade: string;
  studentCount: number;
  totalMealDays: number;         // Số ngày ăn trong tháng (vd: 20)
  totalAbsentExcusedDays: number;// Tổng ngày vắng có phép được hoàn tiền
  mealPricePerDay: number;       // Đơn giá ngày ăn (21.000đ)
  totalCollected: number;        // Tổng tiền đã thu đầu tháng
  totalRefund: number;           // Tiền hoàn trả trẻ nghỉ phép
  actualExpense: number;         // Tiền ăn thực tế đã sử dụng
  balanceRemaining: number;      // Số tiền còn thừa chuyển tháng sau
}

export interface MonthSettlementSummary {
  month: number;
  year: number;
  schoolName: string;
  totalClasses: number;
  totalStudents: number;
  totalRevenue: number;          // Tổng thu
  totalExpense: number;          // Tổng chi tiền ăn thực tế
  totalRefund: number;           // Tổng tiền hoàn trả
  surplusDeficit: number;        // Thừa (+) hoặc Thiếu (-)
  classes: ClassSettlementItem[];
}

export class SettlementService {
  /**
   * Tính toán bảng quyết toán tiền ăn cuối tháng
   */
  calculateMonthSettlement(
    month: number = 9,
    year: number = 2026,
    mealPricePerDay: number = 21000,
    workingDays: number = 20
  ): MonthSettlementSummary {
    const classes: ClassSettlementItem[] = SEED_CLASS_ATTENDANCE.map((c) => {
      const studentCount = c.registeredCount;
      const excusedDays = Math.round(c.absentCount * 3.5); // Giả lập tỷ lệ vắng có phép cả tháng
      const totalCollected = studentCount * mealPricePerDay * workingDays;
      const totalRefund = excusedDays * mealPricePerDay;
      const actualDays = studentCount * workingDays - excusedDays;
      const actualExpense = actualDays * mealPricePerDay;
      const balanceRemaining = totalCollected - actualExpense - totalRefund;

      return {
        classId: c.id,
        className: c.className,
        grade: c.grade,
        studentCount,
        totalMealDays: workingDays,
        totalAbsentExcusedDays: excusedDays,
        mealPricePerDay,
        totalCollected,
        totalRefund,
        actualExpense,
        balanceRemaining,
      };
    });

    const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
    const totalRevenue = classes.reduce((sum, c) => sum + c.totalCollected, 0);
    const totalRefund = classes.reduce((sum, c) => sum + c.totalRefund, 0);
    const totalExpense = classes.reduce((sum, c) => sum + c.actualExpense, 0);
    const surplusDeficit = totalRevenue - totalExpense - totalRefund;

    return {
      month,
      year,
      schoolName: 'Trường Mẫu Giáo Hàm Thắng',
      totalClasses: classes.length,
      totalStudents,
      totalRevenue,
      totalExpense,
      totalRefund,
      surplusDeficit,
      classes,
    };
  }
}
