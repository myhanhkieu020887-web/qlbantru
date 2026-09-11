import ExcelJS from 'exceljs';
import { AgeGroup } from '@/types/nutrition';
import { MenuCycleService } from './MenuCycleService';
import { computeNutritionTotals } from '@/engine/atwater';

export class NutritionReportService {
  private cycleService = new MenuCycleService();

  /**
   * Sinh Workbook Excel báo cáo dinh dưỡng 30 ngày trong tháng
   */
  async generateMonthlyNutritionReport(
    month: number,
    year: number,
    ageGroup: AgeGroup = 'maugiao',
    studentCount: number = 1210,
    budgetPerStudent: number = 21000
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PMS Next-Gen v2.5';
    workbook.created = new Date();

    const sheetName = `Bao_cao_T${month}_${year}`;
    const ws = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }],
    });

    // Cấu hình cột
    ws.columns = [
      { width: 6 },  // STT
      { width: 14 }, // Ngày
      { width: 12 }, // Thứ
      { width: 10 }, // Sĩ số
      { width: 14 }, // Mức thu
      { width: 16 }, // Chi phí thực
      { width: 14 }, // Chênh lệch
      { width: 14 }, // Năng lượng
      { width: 12 }, // % Protein
      { width: 12 }, // % Lipid
      { width: 12 }, // % Carbs
      { width: 14 }, // % Đạm ĐV
      { width: 14 }, // % Béo TV
      { width: 14 }, // Natri (mg)
      { width: 16 }, // Đánh giá
    ];

    // Header cơ quan
    ws.mergeCells('A1:E1');
    ws.getCell('A1').value = 'TRƯỜNG MẪU GIÁO HÀM THẮNG - TP. PHAN THIẾT';
    ws.getCell('A1').font = { name: 'Arial', size: 10, bold: true };

    ws.mergeCells('A2:E2');
    ws.getCell('A2').value = 'BỘ PHẬN BÁN TRÚ & DINH DƯỠNG HỌC ĐƯỜNG';
    ws.getCell('A2').font = { name: 'Arial', size: 9, italic: true };

    // Tiêu đề
    ws.mergeCells('A4:O4');
    ws.getCell('A4').value = `BẢNG THEO DÕI & TỔNG HỢP KHẨU PHẦN DINH DƯỠNG THÁNG ${month}/${year}`;
    ws.getCell('A4').alignment = { horizontal: 'center' };
    ws.getCell('A4').font = { name: 'Arial', size: 14, bold: true, color: { argb: '1E3A8A' } };

    ws.mergeCells('A5:O5');
    ws.getCell('A5').value = `Đối tượng: ${ageGroup === 'maugiao' ? 'Mẫu giáo (3 - 5 tuổi)' : 'Nhà trẻ'} • Tiêu chuẩn QĐ 2195/QĐ-BGDĐT & TT 51/2020/TT-BGDĐT`;
    ws.getCell('A5').alignment = { horizontal: 'center' };
    ws.getCell('A5').font = { name: 'Arial', size: 9, italic: true, color: { argb: '475569' } };

    // Header Bảng dữ liệu (Dòng 7)
    const headers = [
      'STT',
      'Ngày',
      'Thứ',
      'Sĩ số',
      'Mức thu (đ)',
      'Chi phí thực (đ)',
      'Chênh lệch',
      'Năng lượng (Kcal)',
      'Tỷ lệ P (%)',
      'Tỷ lệ L (%)',
      'Tỷ lệ C (%)',
      'Đạm ĐV (%)',
      'Béo TV (%)',
      'Natri (mg)',
      'Kết quả QĐ 2195',
    ];

    const headerRow = ws.addRow(headers);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E40AF' },
      };
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Lấy dữ liệu 30 ngày trong tháng từ MenuCycleService
    const monthPlan = this.cycleService.buildMonthPlan(
      month,
      year,
      ageGroup,
      studentCount,
      budgetPerStudent
    );

    let totalCaloSum = 0;
    let totalProteinSum = 0;
    let totalFatSum = 0;
    let totalCarbsSum = 0;
    let passedCount = 0;
    let validDays = 0;

    monthPlan.days.forEach((day, idx) => {
      if (!day.plan) return;

      const { totals } = computeNutritionTotals(
        day.plan.items,
        day.plan.studentCount,
        day.plan.mealPricePerChild,
        day.plan.ageGroup
      );

      validDays++;
      totalCaloSum += totals.totalCalo;
      totalProteinSum += totals.proteinPct;
      totalFatSum += totals.fatPct;
      totalCarbsSum += totals.carbsPct;
      if (totals.compliancePassed) passedCount++;

      const d = new Date(day.date);
      const dowNames = ['CN', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

      const row = ws.addRow([
        idx + 1,
        day.date.split('-').reverse().join('/'),
        dowNames[d.getDay()],
        day.plan.studentCount,
        day.plan.mealPricePerChild,
        Math.round(totals.costPerChild),
        Math.round(totals.budgetDifference),
        Math.round(totals.totalCalo),
        Number(totals.proteinPct.toFixed(1)),
        Number(totals.fatPct.toFixed(1)),
        Number(totals.carbsPct.toFixed(1)),
        Number((totals.animalProteinRatio ?? 0).toFixed(1)),
        Number((totals.plantFatRatio ?? 0).toFixed(1)),
        Math.round(totals.totalSodiumMg),
        totals.compliancePassed ? 'ĐẠT CHUẨN' : 'CHƯA ĐẠT',
      ]);

      row.height = 18;
      row.eachCell((cell, colNum) => {
        cell.font = { name: 'Arial', size: 9 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNum === 2 || colNum === 3 ? 'center' : colNum === 15 ? 'center' : colNum > 3 ? 'right' : 'center',
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'CBD5E1' } },
          left: { style: 'thin', color: { argb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
          right: { style: 'thin', color: { argb: 'CBD5E1' } },
        };

        if (colNum === 15) {
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: totals.compliancePassed ? '15803D' : 'B91C1C' } };
        }
      });
    });

    // Dòng trung bình tháng
    if (validDays > 0) {
      const avgRow = ws.addRow([
        '',
        'TRUNG BÌNH THÁNG',
        '',
        studentCount,
        budgetPerStudent,
        '',
        '',
        Math.round(totalCaloSum / validDays),
        Number((totalProteinSum / validDays).toFixed(1)),
        Number((totalFatSum / validDays).toFixed(1)),
        Number((totalCarbsSum / validDays).toFixed(1)),
        '',
        '',
        '',
        `ĐẠT ${Math.round((passedCount / validDays) * 100)}%`,
      ]);

      avgRow.height = 22;
      avgRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FEF3C7' },
        };
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '92400E' } };
        cell.border = {
          top: { style: 'medium', color: { argb: 'D97706' } },
          bottom: { style: 'medium', color: { argb: 'D97706' } },
        };
      });
    }

    return workbook;
  }
}
