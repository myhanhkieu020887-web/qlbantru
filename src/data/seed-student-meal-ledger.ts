import { ClassMealLedgerSummary, StudentMealSettlement } from '../types/student-meal-ledger';

// Helper tạo danh sách học sinh cho 1 lớp
function generateStudentsForClass(
  classCode: string,
  className: string,
  gradeGroup: 'maugiao' | 'nhatre',
  count: number,
  dailyRate: number
): StudentMealSettlement[] {
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Huỳnh', 'Hoàng', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô'];
  const middleNames = ['Văn', 'Thị', 'Minh', 'Gia', 'Bảo', 'Ngọc', 'Hải', 'Thanh', 'Tuấn', 'Quỳnh', 'Phương', 'Đức'];
  const lastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Em', 'Giang', 'Hà', 'Huy', 'Khoa', 'Linh', 'Mai', 'Nam', 'Oanh', 'Phúc', 'Quân', 'Sơn', 'Tâm', 'Uyên', 'Vy', 'Yến'];

  const plannedDays = 22;
  const initialAdvance = plannedDays * dailyRate;

  return Array.from({ length: count }, (_, i) => {
    const fn = firstNames[i % firstNames.length];
    const mn = middleNames[i % middleNames.length];
    const ln = lastNames[i % lastNames.length];
    const isGirl = i % 2 === 1;
    const gender = isGirl ? 'Nữ' : 'Nam';
    const fullName = `${fn} ${mn} ${ln}`;
    const studentCode = `HT2-${classCode}-${(i + 1).toString().padStart(2, '0')}`;

    // Giả lập số ngày nghỉ có phép (0, 1, 2, 3 ngày)
    const excusedAbsenceDays = i % 7 === 0 ? 3 : i % 5 === 0 ? 2 : i % 3 === 0 ? 1 : 0;
    const unexcusedAbsenceDays = i === 12 ? 1 : 0;
    const actualAttendedDays = plannedDays - excusedAbsenceDays - unexcusedAbsenceDays;
    const actualMealCost = actualAttendedDays * dailyRate;
    const refundAmount = excusedAbsenceDays * dailyRate; // Hoàn trả ngày nghỉ có phép
    const deficitAmount = 0;

    return {
      id: `stud_${classCode}_${i + 1}`,
      studentCode,
      fullName,
      dob: `${10 + (i % 18)}/0${1 + (i % 9)}/${gradeGroup === 'maugiao' ? 2021 : 2023}`,
      gender,
      className,
      gradeGroup,
      initialAdvanceAmount: initialAdvance,
      plannedDays,
      actualAttendedDays,
      excusedAbsenceDays,
      unexcusedAbsenceDays,
      mealRatePerDay: dailyRate,
      actualMealCost,
      refundAmount,
      deficitAmount,
      attendanceHistory: [],
      note: excusedAbsenceDays > 0 ? `Nghỉ ốm ${excusedAbsenceDays} ngày có phép` : 'Đi học đủ tháng',
    };
  });
}

// 9 LỚP HỌC TRƯỜNG MN HÀM THẮNG 2
export const SEED_CLASS_MEAL_LEDGERS: ClassMealLedgerSummary[] = [
  {
    className: 'Lớp Lá 1 (5-6T)',
    gradeGroup: 'maugiao',
    teacherName: 'Cô Nguyễn Thị Hoa & Cô Lê Thị Mai',
    totalStudents: 36,
    dailyMealRate: 21000,
    totalAdvanceCollected: 36 * 22 * 21000,
    totalActualCost: 36 * 22 * 21000 - 18 * 21000,
    totalRefundAmount: 18 * 21000,
    totalDeficitAmount: 0,
    monthYear: '09/2026',
    students: generateStudentsForClass('LA1', 'Lớp Lá 1 (5-6T)', 'maugiao', 36, 21000),
  },
  {
    className: 'Lớp Lá 2 (5-6T)',
    gradeGroup: 'maugiao',
    teacherName: 'Cô Trần Thị Thu & Cô Phạm Thị Lan',
    totalStudents: 35,
    dailyMealRate: 21000,
    totalAdvanceCollected: 35 * 22 * 21000,
    totalActualCost: 35 * 22 * 21000 - 14 * 21000,
    totalRefundAmount: 14 * 21000,
    totalDeficitAmount: 0,
    monthYear: '09/2026',
    students: generateStudentsForClass('LA2', 'Lớp Lá 2 (5-6T)', 'maugiao', 35, 21000),
  },
  {
    className: 'Lớp Lá 3 (5-6T)',
    gradeGroup: 'maugiao',
    teacherName: 'Cô Đỗ Thị Hạnh',
    totalStudents: 34,
    dailyMealRate: 21000,
    totalAdvanceCollected: 34 * 22 * 21000,
    totalActualCost: 34 * 22 * 21000 - 12 * 21000,
    totalRefundAmount: 12 * 21000,
    totalDeficitAmount: 0,
    monthYear: '09/2026',
    students: generateStudentsForClass('LA3', 'Lớp Lá 3 (5-6T)', 'maugiao', 34, 21000),
  },
  {
    className: 'Lớp Chồi 1 (4-5T)',
    gradeGroup: 'maugiao',
    teacherName: 'Cô Vũ Thị Ngọc & Cô Hoàng Thị Oanh',
    totalStudents: 32,
    dailyMealRate: 21000,
    totalAdvanceCollected: 32 * 22 * 21000,
    totalActualCost: 32 * 22 * 21000 - 15 * 21000,
    totalRefundAmount: 15 * 21000,
    totalDeficitAmount: 0,
    monthYear: '09/2026',
    students: generateStudentsForClass('CH1', 'Lớp Chồi 1 (4-5T)', 'maugiao', 32, 21000),
  },
  {
    className: 'Lớp Chồi 2 (4-5T)',
    gradeGroup: 'maugiao',
    teacherName: 'Cô Huỳnh Thị Thảo',
    totalStudents: 32,
    dailyMealRate: 21000,
    totalAdvanceCollected: 32 * 22 * 21000,
    totalActualCost: 32 * 22 * 21000 - 10 * 21000,
    totalRefundAmount: 10 * 21000,
    totalDeficitAmount: 0,
    monthYear: '09/2026',
    students: generateStudentsForClass('CH2', 'Lớp Chồi 2 (4-5T)', 'maugiao', 32, 21000),
  },
  {
    className: 'Lớp Mầm 1 (3-4T)',
    gradeGroup: 'maugiao',
    teacherName: 'Cô Phan Thị Diễm & Cô Bùi Thị Tuyết',
    totalStudents: 28,
    dailyMealRate: 21000,
    totalAdvanceCollected: 28 * 22 * 21000,
    totalActualCost: 28 * 22 * 21000 - 20 * 21000,
    totalRefundAmount: 20 * 21000,
    totalDeficitAmount: 0,
    monthYear: '09/2026',
    students: generateStudentsForClass('MAM1', 'Lớp Mầm 1 (3-4T)', 'maugiao', 28, 21000),
  },
  {
    className: 'Lớp Mầm 2 (3-4T)',
    gradeGroup: 'maugiao',
    teacherName: 'Cô Lê Thị Kim Ngân',
    totalStudents: 27,
    dailyMealRate: 21000,
    totalAdvanceCollected: 27 * 22 * 21000,
    totalActualCost: 27 * 22 * 21000 - 16 * 21000,
    totalRefundAmount: 16 * 21000,
    totalDeficitAmount: 0,
    monthYear: '09/2026',
    students: generateStudentsForClass('MAM2', 'Lớp Mầm 2 (3-4T)', 'maugiao', 27, 21000),
  },
  {
    className: 'Lớp Nhà trẻ 1 (24-36T)',
    gradeGroup: 'nhatre',
    teacherName: 'Cô Nguyễn Thị Bích & Cô Trịnh Thị Loan',
    totalStudents: 25,
    dailyMealRate: 24000,
    totalAdvanceCollected: 25 * 22 * 24000,
    totalActualCost: 25 * 22 * 24000 - 22 * 24000,
    totalRefundAmount: 22 * 24000,
    totalDeficitAmount: 0,
    monthYear: '09/2026',
    students: generateStudentsForClass('NT1', 'Lớp Nhà trẻ 1 (24-36T)', 'nhatre', 25, 24000),
  },
  {
    className: 'Lớp Nhà trẻ 2 (18-24T)',
    gradeGroup: 'nhatre',
    teacherName: 'Cô Đặng Thị Hường',
    totalStudents: 23,
    dailyMealRate: 24000,
    totalAdvanceCollected: 23 * 22 * 24000,
    totalActualCost: 23 * 22 * 24000 - 18 * 24000,
    totalRefundAmount: 18 * 24000,
    totalDeficitAmount: 0,
    monthYear: '09/2026',
    students: generateStudentsForClass('NT2', 'Lớp Nhà trẻ 2 (18-24T)', 'nhatre', 23, 24000),
  },
];
