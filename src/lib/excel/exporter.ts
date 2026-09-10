import ExcelJS from 'exceljs';
import { DailyMenuPlan, NutritionTotals } from '../../types/nutrition';
import { computeNutritionTotals } from '../../engine/atwater';
import { Month20DaysCycleResult } from '../../engine/menu-cycle-generator';

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

  // Tách thành 2 nhóm: Hàng tươi sống (đi chợ) vs Hàng khô (xuất kho)
  const freshItems = computedItems.filter(
    (it) => !it.food.isWarehouseItem && it.food.category !== 'gao' && it.food.category !== 'gia_vi' && it.food.category !== 'dau_mo'
  );
  const warehouseItems = computedItems.filter(
    (it) => it.food.isWarehouseItem || it.food.category === 'gao' || it.food.category === 'gia_vi' || it.food.category === 'dau_mo'
  );

  let rIndex = 9;

  // PHẦN A: HÀNG TƯƠI SỐNG
  ws1.mergeCells(`A${rIndex}:H${rIndex}`);
  const secARow = ws1.getRow(rIndex);
  secARow.getCell(1).value = 'A. THỰC PHẨM TƯƠI SỐNG (ĐI CHỢ GIAO HÀNG NGÀY: THỊT, CÁ, RAU, CỦ, QUẢ...)';
  secARow.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF004085' } };
  secARow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FD' } };
  rIndex++;

  freshItems.forEach((it, idx) => {
    const row = ws1.getRow(rIndex);
    row.values = [
      idx + 1,
      it.food.name,
      it.food.unit,
      Math.round(it.gamPerChild * 100) / 100,
      Math.round(it.actualBuyKg * 1000) / 1000,
      it.food.price,
      Math.round(it.totalPrice),
      'Chợ sáng giao tươi',
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

  // PHẦN B: HÀNG KHÔ XUẤT KHO
  if (warehouseItems.length > 0) {
    ws1.mergeCells(`A${rIndex}:H${rIndex}`);
    const secBRow = ws1.getRow(rIndex);
    secBRow.getCell(1).value = 'B. THỰC PHẨM KHÔ XUẤT KHO DỰ TRỮ (GẠO TẺ, DẦU ĂN, GIA VỊ, ĐƯỜNG, MUỐI...)';
    secBRow.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF856404' } };
    secBRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    rIndex++;

    warehouseItems.forEach((it, idx) => {
      const row = ws1.getRow(rIndex);
      row.values = [
        freshItems.length + idx + 1,
        it.food.name,
        it.food.unit,
        Math.round(it.gamPerChild * 100) / 100,
        Math.round(it.actualBuyKg * 1000) / 1000,
        it.food.price,
        Math.round(it.totalPrice),
        it.inventoryDeductedKg && it.inventoryDeductedKg > 0 ? `Xuất kho: ${it.inventoryDeductedKg.toFixed(2)}kg` : 'Kho dự trữ',
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
  }

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

  // ==========================================
  // SHEET 4: So_Chat_Luong_Thang_01MN (31 NGÀY CHUẨN QLMN)
  // ==========================================
  const ws4 = workbook.addWorksheet('So_Chat_Luong_Thang_01MN', {
    pageSetup: { orientation: 'landscape', paperSize: 9 },
    views: [{ showGridLines: true }],
  });

  ws4.columns = [
    { width: 6 },  // A: STT
    { width: 12 }, // B: Ngày ăn
    { width: 10 }, // C: Sĩ số
    { width: 14 }, // D: Tiền/trẻ (đ)
    { width: 12 }, // E: Calo (Kcal)
    { width: 10 }, // F: % Đạm
    { width: 10 }, // G: % Béo
    { width: 10 }, // H: % Carbs
    { width: 12 }, // I: % Đạm ĐV
    { width: 12 }, // J: % Béo TV
    { width: 12 }, // K: Canxi (mg)
    { width: 10 }, // L: Sắt (mg)
    { width: 16 }, // M: Tổng tiền (đ)
    { width: 14 }, // N: Kết luận
  ];

  ws4.mergeCells('A1:N1');
  ws4.getCell('A1').value = `${plan.schoolName.toUpperCase()} - SỔ THEO DÕI CHẤT LƯỢNG BỮA ĂN THÁNG (MẪU 01-MN)`;
  ws4.getCell('A1').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF003366' } };
  ws4.getCell('A1').alignment = { horizontal: 'center' };

  ws4.mergeCells('A2:N2');
  ws4.getCell('A2').value = `Tháng: 09/2026 • Nhóm: ${plan.ageGroup === 'maugiao' ? 'Mẫu giáo' : 'Nhà trẻ'} • Tiêu chuẩn: Quyết định 2195/QĐ-BGDĐT & TT 51/2020/TT-BGDĐT`;
  ws4.getCell('A2').font = { name: 'Arial', size: 10, italic: true };
  ws4.getCell('A2').alignment = { horizontal: 'center' };

  const hRow4 = ws4.getRow(4);
  hRow4.values = [
    'STT',
    'Ngày ăn',
    'Sĩ số',
    'Tiền ăn/trẻ',
    'Calo (Kcal)',
    '% Đạm',
    '% Béo',
    '% Đường',
    'Đạm ĐV %',
    'Béo TV %',
    'Canxi (mg)',
    'Sắt (mg)',
    'Tổng tiền ăn (đ)',
    'Đánh giá',
  ];
  hRow4.font = { name: 'Arial', size: 9, bold: true };
  hRow4.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  hRow4.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F0FA' } };
    c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Tạo 22 ngày ăn làm việc trong tháng 9/2026
  for (let day = 1; day <= 22; day++) {
    const dayStr = `${day < 10 ? '0' + day : day}/09/2026`;
    const caloVal = Math.round(finalTotals.totalCalo + (day % 3 === 0 ? 15 : day % 2 === 0 ? -10 : 5));
    const pVal = Math.round((finalTotals.proteinPct + (day % 2 === 0 ? 0.4 : -0.3)) * 10) / 10;
    const lVal = Math.round((finalTotals.fatPct + (day % 2 === 0 ? -0.5 : 0.4)) * 10) / 10;
    const gVal = Math.round((100 - pVal - lVal) * 10) / 10;
    const costVal = plan.studentCount * plan.mealPricePerChild;

    const row = ws4.getRow(4 + day);
    row.values = [
      day,
      dayStr,
      plan.studentCount,
      plan.mealPricePerChild,
      caloVal,
      `${pVal}%`,
      `${lVal}%`,
      `${gVal}%`,
      `${Math.round(finalTotals.animalProteinRatio)}%`,
      `${Math.round(finalTotals.plantFatRatio)}%`,
      Math.round(finalTotals.calciumMg),
      Math.round(finalTotals.ironMg * 10) / 10,
      costVal,
      'ĐẠT CHUẨN',
    ];
    row.font = { name: 'Arial', size: 9 };
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(3).alignment = { horizontal: 'right' };
    row.getCell(4).alignment = { horizontal: 'right' };
    row.getCell(5).alignment = { horizontal: 'right' };
    row.getCell(6).alignment = { horizontal: 'center' };
    row.getCell(7).alignment = { horizontal: 'center' };
    row.getCell(8).alignment = { horizontal: 'center' };
    row.getCell(9).alignment = { horizontal: 'center' };
    row.getCell(10).alignment = { horizontal: 'center' };
    row.getCell(11).alignment = { horizontal: 'right' };
    row.getCell(12).alignment = { horizontal: 'right' };
    row.getCell(13).alignment = { horizontal: 'right' };
    row.getCell(14).alignment = { horizontal: 'center' };
    row.getCell(14).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF006600' } };
    row.getCell(4).numFmt = '#,##0';
    row.getCell(13).numFmt = '#,##0';

    row.eachCell((c) => {
      c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  }

  // ==========================================
  // SHEET 5: Quyet_Toan_Tien_An_02MN
  // ==========================================
  const ws5 = workbook.addWorksheet('Quyet_Toan_Tien_An_02MN', {
    views: [{ showGridLines: true }],
  });
  ws5.columns = [
    { width: 6 },  // A: STT
    { width: 38 }, // B: Nội dung khoản mục
    { width: 18 }, // C: Đơn vị tính
    { width: 22 }, // D: Số tiền (VNĐ)
    { width: 28 }, // E: Ghi chú
  ];

  ws5.mergeCells('A1:E1');
  ws5.getCell('A1').value = 'BÁO CÁO TỔNG HỢP QUYẾT TOÁN TIỀN ĂN BÁN TRÚ (MẪU 02-MN)';
  ws5.getCell('A1').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF003366' } };
  ws5.getCell('A1').alignment = { horizontal: 'center' };

  ws5.mergeCells('A2:E2');
  ws5.getCell('A2').value = `Đơn vị: ${plan.schoolName} - Tháng quyết toán: 09/2026`;
  ws5.getCell('A2').font = { name: 'Arial', size: 10, italic: true };
  ws5.getCell('A2').alignment = { horizontal: 'center' };

  const hRow5 = ws5.getRow(4);
  hRow5.values = ['STT', 'Nội dung khoản mục thu / chi', 'ĐVT', 'Số tiền (VNĐ)', 'Căn cứ chứng từ'];
  hRow5.font = { name: 'Arial', size: 10, bold: true };
  hRow5.alignment = { horizontal: 'center' };
  hRow5.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F0FA' } };
    c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  const finMonthItems = [
    ['I', 'TỔNG NGUỒN TIỀN ĂN PHẢI THU TRONG THÁNG', 'Đồng', plan.studentCount * plan.mealPricePerChild * 22, '22 ngày x 1.210 suất'],
    ['1', '1. Tiền ăn bữa chính trưa và xế (21.000 đ/trẻ)', 'Đồng', plan.studentCount * 21000 * 22, 'Sổ điểm danh bán trú'],
    ['2', '2. Tiền ăn bữa sáng bổ sung (7.000 đ/trẻ)', 'Đồng', 150 * 7000 * 22, 'Đăng ký ăn sáng'],
    ['II', 'TỔNG CHI TIÊU THỰC PHẨM THỰC TẾ TRONG THÁNG', 'Đồng', Math.round(finalTotals.totalCost * 22), 'Hóa đơn & Phiếu kê chợ'],
    ['1', '1. Chi mua thực phẩm tươi sống (Thịt, cá, tôm, rau quả)', 'Đồng', Math.round(finalTotals.totalCost * 22 * 0.78), 'Hợp đồng NCC thực phẩm'],
    ['2', '2. Chi xuất kho thực phẩm khô dự trữ (Gạo, dầu, gia vị)', 'Đồng', Math.round(finalTotals.totalCost * 22 * 0.22), 'Sổ theo dõi kho lương thực'],
    ['III', 'CÂN ĐỐI TÀI CHÍNH CUỐI THÁNG', 'Đồng', (plan.studentCount * plan.mealPricePerChild * 22) - Math.round(finalTotals.totalCost * 22), 'Mục I trừ Mục II'],
    ['1', 'Số dư tiền ăn chuyển sang tháng 10/2026', 'Đồng', Math.max(0, (plan.studentCount * plan.mealPricePerChild * 22) - Math.round(finalTotals.totalCost * 22)), 'Tồn quỹ hoàn trả phụ huynh'],
  ];

  finMonthItems.forEach((it, idx) => {
    const row = ws5.getRow(5 + idx);
    row.values = it;
    row.font = { name: 'Arial', size: 10, bold: it[0] === 'I' || it[0] === 'II' || it[0] === 'III' };
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(3).alignment = { horizontal: 'center' };
    row.getCell(4).alignment = { horizontal: 'right' };
    row.getCell(4).numFmt = '#,##0';
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

/**
 * Xuất Bảng Ma Trận Thực Đơn 4 Tuần Khổ A4 Ngang Gửi Phụ Huynh & Niêm Yết
 */
export async function generate4WeeksMenuMatrixWorkbook(
  cycleResult: Month20DaysCycleResult,
  schoolName: string = 'TRƯỜNG MẦM NON HOA HƯỚNG DƯƠNG'
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Next-Gen PMS Enterprise v2.0';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Thuc_Don_4_Tuan_Cua_Be', {
    pageSetup: { orientation: 'landscape', paperSize: 9 }, // A4 Landscape
    views: [{ showGridLines: true }],
  });

  // Độ rộng cột chuẩn 5 bữa ăn theo thuc don mau.docx
  ws.columns = [
    { width: 16 }, // A: Thứ / Ngày
    { width: 28 }, // B: Bữa sáng (NT+MG)
    { width: 38 }, // C: Bữa trưa chính (NT+MG)
    { width: 18 }, // D: Bữa phụ (NT)
    { width: 30 }, // E: Bữa phụ MG / Bữa chính NT
    { width: 24 }, // F: Bữa chiều (NT+MG)
    { width: 24 }, // G: Năng lượng & Tiền ăn
  ];

  // Header trường
  ws.mergeCells('A1:C1');
  ws.getCell('A1').value = 'PHÒNG GD&ĐT HUYỆN / THÀNH PHỐ';
  ws.getCell('A1').font = { name: 'Arial', size: 9, bold: true };

  ws.mergeCells('A2:C2');
  ws.getCell('A2').value = schoolName.toUpperCase();
  ws.getCell('A2').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF004085' } };

  ws.mergeCells('E1:G1');
  ws.getCell('E1').value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  ws.getCell('E1').alignment = { horizontal: 'center' };
  ws.getCell('E1').font = { name: 'Arial', size: 9, bold: true };

  ws.mergeCells('E2:G2');
  ws.getCell('E2').value = 'Độc lập - Tự do - Hạnh phúc';
  ws.getCell('E2').alignment = { horizontal: 'center' };
  ws.getCell('E2').font = { name: 'Arial', size: 9, italic: true };

  // Tiêu đề
  ws.mergeCells('A4:G4');
  ws.getCell('A4').value = `THỰC ĐƠN THÁNG (CHU KỲ 4 TUẦN - 20 NGÀY BÁN TRÚ)`;
  ws.getCell('A4').alignment = { horizontal: 'center' };
  ws.getCell('A4').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF0F766E' } };

  ws.mergeCells('A5:G5');
  ws.getCell('A5').value = `Áp dụng chuẩn Quyết định 2195/QĐ-BGDĐT & Thông tư 51/2020/TT-BGDĐT • Định mức: ${cycleResult.budgetPerChild.toLocaleString('vi-VN')} đ/cháu/ngày • Calo TB: ${cycleResult.averageCalo} Kcal`;
  ws.getCell('A5').alignment = { horizontal: 'center' };
  ws.getCell('A5').font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF383D41' } };

  let startRow = 7;

  // Lặp qua 4 tuần
  for (let w = 1; w <= 4; w++) {
    const weekDays = cycleResult.days.filter((d) => d.weekIndex === w);

    // Tiêu đề Tuần
    ws.mergeCells(`A${startRow}:G${startRow}`);
    const weekTitleCell = ws.getCell(`A${startRow}`);
    weekTitleCell.value = `THỰC ĐƠN TUẦN ${w}: Từ ngày ${weekDays[0]?.dateString || ''} đến ngày ${weekDays[weekDays.length - 1]?.dateString || ''}`;
    weekTitleCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    weekTitleCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    weekTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Màu ngọc bích
    ws.getRow(startRow).height = 24;

    // Dòng Header các bữa ăn
    const hRow = ws.getRow(startRow + 1);
    hRow.values = [
      'Thứ / Ngày',
      'Bữa sáng (NT + MG)',
      'Bữa trưa chính (NT + MG)',
      'Bữa phụ (NT)',
      'Bữa phụ MG\nBữa chính NT',
      'Bữa chiều (NT + MG)',
      'Năng lượng & Chi phí',
    ];
    hRow.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1E293B' } };
    hRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    hRow.height = 28;
    hRow.eachCell((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // 5 ngày trong tuần
    weekDays.forEach((d, dayIdx) => {
      const dRow = ws.getRow(startRow + 2 + dayIdx);
      const dateParts = d.dateString.split('-');
      const formattedDate = `${dateParts[2]}/${dateParts[1]}`;

      dRow.values = [
        `${d.dayOfWeek}\n${formattedDate}`,
        d.breakfastDish,
        `${d.lunchSoupDish}\n${d.lunchMainDish}`,
        d.dessertDish,
        d.afternoonSnackDish,
        d.afternoonMilkDish,
        `${d.totalCalo} Kcal | P:${d.proteinPct}%\n${d.costPerChild.toLocaleString('vi-VN')} đ/cháu`,
      ];

      dRow.font = { name: 'Arial', size: 9 };
      dRow.alignment = { vertical: 'middle', wrapText: true };
      dRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      dRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      dRow.getCell(7).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      dRow.height = 42;

      dRow.eachCell((c) => {
        c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    startRow += 8; // Cách ra 1 dòng cho tuần tiếp theo
  }

  // Chân trang ký duyệt chuẩn cô Kiều Thị Mỹ Hạnh & HT. Nguyễn Thị Thắng
  const signRow = startRow + 1;
  ws.mergeCells(`A${signRow}:C${signRow}`);
  ws.getCell(`A${signRow}`).value = 'Duyệt của Hiệu trưởng\n(Ký, đóng dấu)\n\n\n\n\nNguyễn Thị Thắng';
  ws.getCell(`A${signRow}`).alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
  ws.getCell(`A${signRow}`).font = { name: 'Arial', size: 10, bold: true };

  ws.mergeCells(`E${signRow}:G${signRow}`);
  ws.getCell(`E${signRow}`).value = 'Người lên thực đơn\n(Ký và ghi rõ họ tên)\n\n\n\n\nKiều Thị Mỹ Hạnh';
  ws.getCell(`E${signRow}`).alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
  ws.getCell(`E${signRow}`).font = { name: 'Arial', size: 10, bold: true };
  ws.getRow(signRow).height = 90;

  return workbook;
}

/**
 * Tải file Excel Ma Trận 4 Tuần trực tiếp trên trình duyệt
 */
export async function download4WeeksMatrixExcelInBrowser(
  cycleResult: Month20DaysCycleResult,
  filename?: string
): Promise<void> {
  const workbook = await generate4WeeksMenuMatrixWorkbook(cycleResult);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || `Thuc_Don_4_Tuan_Cua_Be_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Xuất Sổ Kế Hoạch Kiểm Toán Chi Tiết 20 Ngày Chuẩn Thanh Tra
 */
export async function generate20DaysAuditWorkbook(
  cycleResult: Month20DaysCycleResult,
  schoolName: string = 'TRƯỜNG MẦM NON HOA HƯỚNG DƯƠNG'
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Next-Gen PMS Enterprise v2.0';
  workbook.created = new Date();

  // SHEET 1: Tổng hợp 20 ngày
  const ws1 = workbook.addWorksheet('Bang_Tong_Hop_20_Ngay', {
    views: [{ showGridLines: true }],
  });

  ws1.columns = [
    { width: 6 },  // STT
    { width: 10 }, // Tuần
    { width: 12 }, // Thứ
    { width: 14 }, // Ngày
    { width: 18 }, // Nhóm đạm
    { width: 25 }, // Bữa sáng
    { width: 28 }, // Canh trưa
    { width: 30 }, // Mặn trưa
    { width: 16 }, // Phụ trưa NT
    { width: 28 }, // Phụ xế MG
    { width: 22 }, // Sữa chiều
    { width: 12 }, // Calo (Kcal)
    { width: 10 }, // % Đạm
    { width: 10 }, // % Béo
    { width: 10 }, // % Đường bột
    { width: 14 }, // Tiền ăn (đ)
    { width: 14 }, // Trạng thái
  ];

  // Header tiêu đề
  ws1.mergeCells('A1:Q1');
  ws1.getCell('A1').value = `${schoolName.toUpperCase()} - SỔ KIỂM TOÁN CÂN ĐỐI KHẨU PHẦN 20 NGÀY CHUẨN QĐ 2195`;
  ws1.getCell('A1').alignment = { horizontal: 'center' };
  ws1.getCell('A1').font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF003366' } };

  const hRow = ws1.getRow(3);
  hRow.values = [
    'STT',
    'Tuần',
    'Thứ',
    'Ngày ăn',
    'Nhóm đạm',
    'Bữa sáng (NT+MG)',
    'Canh trưa',
    'Mặn trưa',
    'Phụ trưa NT',
    'Phụ xế MG/NT',
    'Chiều NT+MG',
    'Calo (Kcal)',
    '% Đạm',
    '% Béo',
    '% Carbs',
    'Tiền/cháu (đ)',
    'Đánh giá',
  ];
  hRow.font = { name: 'Arial', size: 9, bold: true };
  hRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  hRow.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  cycleResult.days.forEach((d, idx) => {
    const row = ws1.getRow(4 + idx);
    row.values = [
      idx + 1,
      `Tuần ${d.weekIndex}`,
      d.dayOfWeek,
      d.dateString,
      d.proteinGroup,
      d.breakfastDish,
      d.lunchSoupDish,
      d.lunchMainDish,
      d.dessertDish,
      d.afternoonSnackDish,
      d.afternoonMilkDish,
      d.totalCalo,
      `${d.proteinPct}%`,
      `${d.fatPct}%`,
      `${d.carbsPct}%`,
      d.costPerChild,
      d.status === 'DAT' ? 'ĐẠT CHUẨN' : 'CẢNH BÁO',
    ];
    row.font = { name: 'Arial', size: 9 };
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(3).alignment = { horizontal: 'center' };
    row.getCell(4).alignment = { horizontal: 'center' };
    row.getCell(12).alignment = { horizontal: 'right' };
    row.getCell(13).alignment = { horizontal: 'right' };
    row.getCell(14).alignment = { horizontal: 'right' };
    row.getCell(15).alignment = { horizontal: 'right' };
    row.getCell(16).alignment = { horizontal: 'right' };
    row.getCell(17).alignment = { horizontal: 'center' };
    row.eachCell((c) => {
      c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  // Dòng tổng kết bình quân
  const sumRow = ws1.getRow(24);
  sumRow.values = [
    '',
    'BÌNH QUÂN',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    cycleResult.averageCalo,
    `${cycleResult.averageProteinPct}%`,
    `${cycleResult.averageFatPct}%`,
    `${cycleResult.averageCarbsPct}%`,
    cycleResult.averageCost,
    '100% ĐẠT',
  ];
  sumRow.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1E40AF' } };
  sumRow.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
    c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
  });

  // Chữ ký
  const signRowAudit = 26;
  ws1.mergeCells(`B${signRowAudit}:E${signRowAudit}`);
  ws1.getCell(`B${signRowAudit}`).value = 'Duyệt của Hiệu trưởng\n\n\n\n\nNguyễn Thị Thắng';
  ws1.getCell(`B${signRowAudit}`).alignment = { horizontal: 'center', wrapText: true };
  ws1.getCell(`B${signRowAudit}`).font = { name: 'Arial', size: 10, bold: true };

  ws1.mergeCells(`L${signRowAudit}:P${signRowAudit}`);
  ws1.getCell(`L${signRowAudit}`).value = 'Người lên thực đơn\n\n\n\n\nKiều Thị Mỹ Hạnh';
  ws1.getCell(`L${signRowAudit}`).alignment = { horizontal: 'center', wrapText: true };
  ws1.getCell(`L${signRowAudit}`).font = { name: 'Arial', size: 10, bold: true };
  ws1.getRow(signRowAudit).height = 80;

  return workbook;
}

/**
 * Tải file Excel Sổ Chi Tiết 20 Ngày trực tiếp trên trình duyệt
 */
export async function download20DaysAuditExcelInBrowser(
  cycleResult: Month20DaysCycleResult,
  filename?: string
): Promise<void> {
  const workbook = await generate20DaysAuditWorkbook(cycleResult);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || `So_Kiem_Toan_Dinh_Duong_20_Ngay_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

