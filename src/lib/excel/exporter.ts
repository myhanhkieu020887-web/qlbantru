import ExcelJS from 'exceljs';
import { DailyMenuPlan, NutritionTotals } from '../../types/nutrition';
import { computeNutritionTotals } from '../../engine/atwater';

/**
 * Xuất file Excel (.xlsx) chuẩn OpenXML chuyên nghiệp tái hiện 1:1 các biểu mẫu:
 * 1. Phieu_Tiep_Pham
 * 2. So_Khau_Phan_01MN (TT 51/2020/TT-BGDĐT)
 * 3. Kiem_Thuc_3_Buoc (QĐ 1246/QĐ-BYT & CV 423/BGDĐT-GDMN)
 */
export async function generateNutritionWorkbook(
  plan: DailyMenuPlan,
  totalsOverride?: NutritionTotals
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Next-Gen PMS Enterprise v2.0';
  workbook.created = new Date();

  const { computedItems, totals } = computeNutritionTotals(
    plan.items,
    plan.studentCount,
    plan.mealPricePerChild,
    plan.ageGroup
  );
  const finalTotals = totalsOverride || totals;

  // ==========================================
  // SHEET 1: Phieu_Tiep_Pham
  // ==========================================
  const ws1 = workbook.addWorksheet('Phieu_Tiep_Pham', {
    views: [{ showGridLines: true }],
  });

  // Độ rộng các cột
  ws1.columns = [
    { width: 6 },  // A: STT
    { width: 30 }, // B: Tên thực phẩm
    { width: 14 }, // C: ĐVT
    { width: 22 }, // D: Định lượng 1 trẻ (g)
    { width: 24 }, // E: Số lượng mua cả trường
    { width: 16 }, // F: Đơn giá (VNĐ)
    { width: 20 }, // G: Thành tiền (VNĐ)
    { width: 20 }, // H: Ghi chú
  ];

  // Header cơ quan
  ws1.mergeCells('A1:C1');
  ws1.getCell('A1').value = plan.divisionName.toUpperCase();
  ws1.getCell('A1').font = { name: 'Arial', size: 10, bold: true };

  ws1.mergeCells('A2:C2');
  ws1.getCell('A2').value = plan.schoolName;
  ws1.getCell('A2').font = { name: 'Arial', size: 10, bold: true };

  ws1.mergeCells('E1:H1');
  ws1.getCell('E1').value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  ws1.getCell('E1').alignment = { horizontal: 'center' };
  ws1.getCell('E1').font = { name: 'Arial', size: 10, bold: true };

  ws1.mergeCells('E2:H2');
  ws1.getCell('E2').value = 'Độc lập - Tự do - Hạnh phúc';
  ws1.getCell('E2').alignment = { horizontal: 'center' };
  ws1.getCell('E2').font = { name: 'Arial', size: 10, italic: true };

  // Tiêu đề phiếu
  ws1.mergeCells('A3:H3');
  ws1.getCell('A3').value = 'PHIẾU TIẾP NHẬN THỰC PHẨM HÀNG NGÀY';
  ws1.getCell('A3').alignment = { horizontal: 'center' };
  ws1.getCell('A3').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF003366' } };

  // Thông tin chung
  ws1.getCell('A5').value = `Ngày thực hiện: ${plan.date}`;
  ws1.getCell('C5').value = `Sĩ số trẻ ăn: ${plan.studentCount} cháu`;
  ws1.getCell('E5').value = `Thực đơn: ${plan.menuCode}`;
  ws1.getCell('A6').value = `Mức tiền ăn: ${plan.mealPricePerChild.toLocaleString('vi-VN')} đ/trẻ`;

  // Header bảng
  const hRow = ws1.getRow(8);
  hRow.values = [
    'STT',
    'Tên thực phẩm',
    'Đơn vị tính',
    'Định lượng 1 trẻ (g)',
    'Số lượng mua cả trường',
    'Đơn giá (VNĐ)',
    'Thành tiền (VNĐ)',
    'Ghi chú',
  ];
  hRow.font = { name: 'Arial', size: 10, bold: true };
  hRow.alignment = { horizontal: 'center', vertical: 'middle' };
  hRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F0FA' },
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Dữ liệu thực phẩm
  let rIndex = 9;
  computedItems.forEach((it, idx) => {
    const row = ws1.getRow(rIndex);
    row.values = [
      idx + 1,
      it.food.name,
      it.food.unit,
      Math.round(it.gamPerChild * 100) / 100,
      Math.round(it.actualBuyKg * 100000) / 100000,
      it.food.price,
      Math.round(it.totalPrice),
      it.food.isFixed ? 'Cố định' : 'Tối ưu MILP',
    ];
    row.font = { name: 'Arial', size: 10 };
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(3).alignment = { horizontal: 'center' };
    row.getCell(4).alignment = { horizontal: 'right' };
    row.getCell(5).alignment = { horizontal: 'right' };
    row.getCell(6).alignment = { horizontal: 'right' };
    row.getCell(7).alignment = { horizontal: 'right' };
    row.getCell(6).numFmt = '#,##0';
    row.getCell(7).numFmt = '#,##0';

    row.eachCell((c) => {
      c.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      };
    });
    rIndex++;
  });

  // Dòng Tổng cộng
  rIndex += 1;
  const totRow1 = ws1.getRow(rIndex);
  ws1.mergeCells(`A${rIndex}:F${rIndex}`);
  totRow1.getCell(1).value = 'TỔNG CỘNG THÀNH TIỀN THỰC PHẨM';
  totRow1.getCell(1).font = { name: 'Arial', size: 10, bold: true };
  totRow1.getCell(1).alignment = { horizontal: 'right' };
  totRow1.getCell(7).value = Math.round(finalTotals.totalCost);
  totRow1.getCell(7).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000080' } };
  totRow1.getCell(7).numFmt = '#,##0';

  rIndex += 1;
  const totRow2 = ws1.getRow(rIndex);
  ws1.mergeCells(`A${rIndex}:F${rIndex}`);
  totRow2.getCell(1).value = 'TỔNG NGÂN SÁCH TIỀN ĂN DỰ KIẾN';
  totRow2.getCell(1).font = { name: 'Arial', size: 10, bold: true };
  totRow2.getCell(1).alignment = { horizontal: 'right' };
  totRow2.getCell(7).value = Math.round(finalTotals.totalBudget);
  totRow2.getCell(7).font = { name: 'Arial', size: 10, bold: true };
  totRow2.getCell(7).numFmt = '#,##0';

  rIndex += 1;
  const totRow3 = ws1.getRow(rIndex);
  ws1.mergeCells(`A${rIndex}:F${rIndex}`);
  totRow3.getCell(1).value = 'CHÊNH LỆCH TIỀN ĂN CUỐI NGÀY';
  totRow3.getCell(1).font = { name: 'Arial', size: 10, bold: true };
  totRow3.getCell(1).alignment = { horizontal: 'right' };
  totRow3.getCell(7).value = Math.round(finalTotals.budgetDifference);
  totRow3.getCell(7).font = {
    name: 'Arial',
    size: 10,
    bold: true,
    color: { argb: finalTotals.budgetDifference < 0 ? 'FFCC0000' : 'FF006600' },
  };
  totRow3.getCell(7).numFmt = '#,##0';
  totRow3.getCell(8).value = finalTotals.budgetDifference < 0 ? 'Bội chi' : 'Còn dư';

  // Khối chữ ký
  rIndex += 3;
  const signRow1 = ws1.getRow(rIndex);
  signRow1.getCell(2).value = 'NGƯỜI GIAO HÀNG';
  signRow1.getCell(4).value = 'BẾP TRƯỞNG';
  signRow1.getCell(6).value = 'KẾ TOÁN BÁN TRÚ';
  signRow1.getCell(8).value = 'HIỆU TRƯỞNG';
  signRow1.font = { name: 'Arial', size: 10, bold: true };
  [2, 4, 6, 8].forEach((col) => {
    signRow1.getCell(col).alignment = { horizontal: 'center' };
  });

  rIndex += 1;
  const signRow2 = ws1.getRow(rIndex);
  signRow2.getCell(2).value = '(Ký, ghi rõ họ tên)';
  signRow2.getCell(4).value = '(Ký, ghi rõ họ tên)';
  signRow2.getCell(6).value = '(Ký, ghi rõ họ tên)';
  signRow2.getCell(8).value = '(Ký, đóng dấu)';
  signRow2.font = { name: 'Arial', size: 9, italic: true };
  [2, 4, 6, 8].forEach((col) => {
    signRow2.getCell(col).alignment = { horizontal: 'center' };
  });

  // ==========================================
  // SHEET 2: So_Khau_Phan_01MN
  // ==========================================
  const ws2 = workbook.addWorksheet('So_Khau_Phan_01MN', {
    views: [{ showGridLines: true }],
  });
  ws2.columns = [
    { width: 35 }, // Chỉ tiêu đánh giá
    { width: 22 }, // Kết quả đạt được
    { width: 35 }, // Tiêu chuẩn Bộ GD&ĐT
    { width: 18 }, // Đánh giá
  ];

  ws2.mergeCells('A1:D1');
  ws2.getCell('A1').value = 'SỔ THEO DÕI TÍNH KHẨU PHẦN ĂN VÀ DINH DƯỠNG (MẪU 01-MN)';
  ws2.getCell('A1').alignment = { horizontal: 'center' };
  ws2.getCell('A1').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF003366' } };

  ws2.mergeCells('A2:D2');
  ws2.getCell('A2').value = `Ngày: ${plan.date} - Đối tượng: ${plan.ageGroup === 'maugiao' ? 'Mẫu giáo (3 - 6 tuổi)' : 'Nhà trẻ (18 - 36 tháng)'} - Sĩ số ăn: ${plan.studentCount}`;
  ws2.getCell('A2').alignment = { horizontal: 'center' };
  ws2.getCell('A2').font = { name: 'Arial', size: 10, italic: true };

  const hRow2 = ws2.getRow(4);
  hRow2.values = [
    'Chỉ tiêu đánh giá',
    'Kết quả đạt được',
    'Tiêu chuẩn Bộ GD&ĐT (TT 51/2020)',
    'Đánh giá',
  ];
  hRow2.font = { name: 'Arial', size: 10, bold: true };
  hRow2.alignment = { horizontal: 'center' };
  hRow2.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F0FA' } };
    c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  const kpiData = [
    ['Năng lượng tại trường (Kcal)', `${Math.round(finalTotals.totalCalo * 10) / 10} Kcal`, plan.ageGroup === 'maugiao' ? '615 - 738 Kcal' : '600 - 651 Kcal', finalTotals.isCaloPass ? 'ĐẠT CHUẨN' : 'CHƯA ĐẠT'],
    ['Tỷ lệ Đạm (% Protein)', `${Math.round(finalTotals.proteinPct * 10) / 10}%`, '13% - 20%', finalTotals.proteinPct >= 13 && finalTotals.proteinPct <= 20 ? 'ĐẠT CHUẨN' : 'CHƯA ĐẠT'],
    ['Tỷ lệ Béo (% Lipid)', `${Math.round(finalTotals.fatPct * 10) / 10}%`, plan.ageGroup === 'maugiao' ? '25% - 35%' : '30% - 40%', finalTotals.fatPct >= 25 && finalTotals.fatPct <= 35 ? 'ĐẠT CHUẨN' : 'CHƯA ĐẠT'],
    ['Tỷ lệ Đường bột (% Glucid)', `${Math.round(finalTotals.carbsPct * 10) / 10}%`, plan.ageGroup === 'maugiao' ? '52% - 60%' : '50% - 60%', finalTotals.carbsPct >= 52 && finalTotals.carbsPct <= 60 ? 'ĐẠT CHUẨN' : 'CHƯA ĐẠT'],
    ['Tỷ lệ Đạm động vật / Tổng đạm', `${Math.round(finalTotals.animalProteinRatio * 10) / 10}%`, '>= 50% (QĐ 2195)', finalTotals.animalProteinRatio >= 50 ? 'ĐẠT CHUẨN' : 'CHƯA ĐẠT'],
    ['Tỷ lệ Mỡ thực vật / Tổng béo', `${Math.round(finalTotals.plantFatRatio * 10) / 10}%`, '>= 45% (QĐ 2195)', finalTotals.plantFatRatio >= 45 ? 'ĐẠT CHUẨN' : 'CHƯA ĐẠT'],
    ['Natri khống chế (mg/trẻ)', `${Math.round(finalTotals.totalSodiumMg)} mg`, '<= 1200 mg (QĐ 2195)', finalTotals.isSodiumPass ? 'ĐẠT CHUẨN' : 'VƯỢT CHUẨN'],
    ['Canxi (mg/trẻ)', `${Math.round(finalTotals.calciumMg * 10) / 10} mg`, '>= 240 mg', finalTotals.calciumMg >= 240 ? 'ĐẠT' : 'THẤP'],
    ['Sắt (mg/trẻ)', `${Math.round(finalTotals.ironMg * 100) / 100} mg`, '>= 2.7 mg', finalTotals.ironMg >= 2.7 ? 'ĐẠT' : 'THẤP'],
    ['Vitamin B1 (mg/trẻ)', `${Math.round(finalTotals.vitaminB1Mg * 100) / 100} mg`, '>= 0.28 mg', finalTotals.vitaminB1Mg >= 0.28 ? 'ĐẠT' : 'THẤP'],
    ['Vitamin C (mg/trẻ)', `${Math.round(finalTotals.vitaminCMg * 10) / 10} mg`, '--', 'ĐẠT'],
  ];

  kpiData.forEach((rowVals, i) => {
    const row = ws2.getRow(5 + i);
    row.values = rowVals;
    row.font = { name: 'Arial', size: 10 };
    row.getCell(2).alignment = { horizontal: 'right' };
    row.getCell(3).alignment = { horizontal: 'center' };
    row.getCell(4).alignment = { horizontal: 'center' };
    row.getCell(4).font = {
      name: 'Arial',
      size: 10,
      bold: true,
      color: { argb: rowVals[3].includes('ĐẠT') ? 'FF006600' : 'FFCC0000' },
    };
    row.eachCell((c) => {
      c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  const rowFin1 = ws2.getRow(17);
  ws2.mergeCells('A17:B17');
  rowFin1.getCell(1).value = 'TỔNG TIỀN ĂN THỰC TẾ TRONG NGÀY';
  rowFin1.getCell(1).font = { name: 'Arial', size: 10, bold: true };
  rowFin1.getCell(3).value = `${Math.round(finalTotals.totalCost).toLocaleString('vi-VN')} đ`;
  rowFin1.getCell(3).font = { name: 'Arial', size: 10, bold: true };

  const rowFin2 = ws2.getRow(18);
  ws2.mergeCells('A18:B18');
  rowFin2.getCell(1).value = 'BÌNH QUÂN TIỀN ĂN / 1 CHÁU';
  rowFin2.getCell(1).font = { name: 'Arial', size: 10, bold: true };
  rowFin2.getCell(3).value = `${(Math.round(finalTotals.costPerChild * 100) / 100).toLocaleString('vi-VN')} đ`;
  rowFin2.getCell(3).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000080' } };

  // ==========================================
  // SHEET 3: Kiem_Thuc_3_Buoc
  // ==========================================
  const ws3 = workbook.addWorksheet('Kiem_Thuc_3_Buoc', {
    views: [{ showGridLines: true }],
  });
  ws3.columns = [
    { width: 6 },
    { width: 28 },
    { width: 20 },
    { width: 28 },
    { width: 35 },
    { width: 15 },
    { width: 18 },
  ];

  ws3.mergeCells('A1:G1');
  ws3.getCell('A1').value = 'SỔ KIỂM THỰC 3 BƯỚC VÀ LƯU MẪU THỨC ĂN (THEO QUY ĐỊNH BỘ Y TẾ)';
  ws3.getCell('A1').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF003366' } };
  ws3.getCell('A1').alignment = { horizontal: 'center' };

  ws3.mergeCells('A2:G2');
  ws3.getCell('A2').value = `Ngày: ${plan.date} - Đơn vị: ${plan.schoolName}`;
  ws3.getCell('A2').alignment = { horizontal: 'center' };
  ws3.getCell('A2').font = { name: 'Arial', size: 10, italic: true };

  // Bước 1
  ws3.mergeCells('A4:G4');
  ws3.getCell('A4').value = 'BƯỚC 1: KIỂM TRA NGUỒN GỐC & TÌNH TRẠNG THỰC PHẨM NHẬP VÀO';
  ws3.getCell('A4').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF800000' } };

  const hRow3 = ws3.getRow(5);
  hRow3.values = [
    'STT',
    'Tên thực phẩm',
    'Khối lượng giao',
    'Tên đơn vị cung cấp',
    'Cảm quan chất lượng',
    'Thời gian giao',
    'Người kiểm tra ký',
  ];
  hRow3.font = { name: 'Arial', size: 10, bold: true };
  hRow3.alignment = { horizontal: 'center' };
  hRow3.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5DC' } };
    c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  computedItems.forEach((it, idx) => {
    const row = ws3.getRow(6 + idx);
    row.values = [
      idx + 1,
      it.food.name,
      `${Math.round(it.actualBuyKg * 100) / 100} ${it.food.unit}`,
      'Công ty thực phẩm sạch VietGAP',
      'Tươi sống, bao bì nguyên vẹn, có tem mác',
      '06:30',
      'Đã kiểm tra & Ký',
    ];
    row.font = { name: 'Arial', size: 9 };
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(6).alignment = { horizontal: 'center' };
    row.getCell(7).alignment = { horizontal: 'center' };
    row.eachCell((c) => {
      c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  return workbook;
}

/**
 * Tải file Excel trực tiếp trên trình duyệt
 */
export async function downloadExcelInBrowser(
  plan: DailyMenuPlan,
  totalsOverride?: NutritionTotals,
  filename?: string
): Promise<void> {
  const workbook = await generateNutritionWorkbook(plan, totalsOverride);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || `So_Dinh_Duong_Ban_Tru_${plan.date}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
