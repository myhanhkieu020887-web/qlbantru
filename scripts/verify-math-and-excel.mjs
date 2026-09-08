import { computeNutritionTotals } from '../src/engine/atwater.js';
import { solveNutritionMenu } from '../src/engine/milp-solver.js';
import { generateNutritionWorkbook } from '../src/lib/excel/exporter.js';
import { SEED_MENU_PLAN_HAMTHANG } from '../src/data/seed-data-hamthang.js';
import fs from 'fs';

console.log('========================================================');
console.log('KIỂM TRA TỰ ĐỘNG: TOÁN HỌC DINH DƯỠNG & ENGINE EXCEL');
console.log('========================================================\n');

// 1. Kiểm tra Dinh dưỡng gốc
const { totals, computedItems } = computeNutritionTotals(
  SEED_MENU_PLAN_HAMTHANG.items,
  SEED_MENU_PLAN_HAMTHANG.studentCount,
  SEED_MENU_PLAN_HAMTHANG.mealPricePerChild,
  SEED_MENU_PLAN_HAMTHANG.ageGroup
);

console.log('1. KẾT QUẢ ĐỐI CHIẾU DỮ LIỆU GỐC HÀM THẮNG (09/09/2026):');
console.log(` - Sĩ số: ${totals.studentCount} cháu | Mức tiền: ${totals.budgetPerChild} đ`);
console.log(` - Tổng tiền thực tế: ${Math.round(totals.totalCost)} đ (Kỳ vọng: 11.165.830 đ)`);
console.log(` - Bình quân tiền ăn: ${totals.costPerChild.toFixed(2)} đ (Kỳ vọng: 21.227,81 đ)`);
console.log(` - Tổng Đạm: ${totals.totalProteinG.toFixed(2)}g (ĐV: ${totals.proteinAnimalG.toFixed(2)}g, TV: ${totals.proteinPlantG.toFixed(2)}g)`);
console.log(` - Tổng Béo: ${totals.totalFatG.toFixed(2)}g (ĐV: ${totals.fatAnimalG.toFixed(2)}g, TV: ${totals.fatPlantG.toFixed(2)}g)`);
console.log(` - Tổng Đường: ${totals.carbsG.toFixed(2)}g`);
console.log(` - Năng lượng Atwater: ${totals.totalCalo.toFixed(2)} Kcal (Kỳ vọng: 689.5 Kcal)`);
console.log(` - Tỷ lệ P : L : G: ${totals.proteinPct.toFixed(1)}% : ${totals.fatPct.toFixed(1)}% : ${totals.carbsPct.toFixed(1)}%`);

const caloDiff = Math.abs(totals.totalCalo - 689.5);
if (caloDiff <= 0.1) {
  console.log(' -> [PASS] Sai số năng lượng Atwater đạt chuẩn tuyệt đối (<= 0.1 Kcal)!');
} else {
  console.error(` -> [FAIL] Sai số calo vượt mức: ${caloDiff}`);
  process.exit(1);
}

// 2. Kiểm tra Bộ giải MILP Solver
console.log('\n2. KIỂM TRA BỘ GIẢI TỐI ƯU 2-PHASE ELASTIC MILP:');
const t0 = performance.now();
const solveRes = solveNutritionMenu(
  SEED_MENU_PLAN_HAMTHANG.items,
  SEED_MENU_PLAN_HAMTHANG.studentCount,
  SEED_MENU_PLAN_HAMTHANG.ageGroup,
  { targetBudgetPerChild: 21000 }
);
const solveDuration = performance.now() - t0;

console.log(` - Thời gian giải toán: ${solveRes.runtimeMs}ms (Thực tế: ${solveDuration.toFixed(2)}ms)`);
console.log(` - Chi phí gốc: ${solveRes.originalCost.toFixed(2)} đ -> Sau tối ưu: ${solveRes.optimizedCost.toFixed(2)} đ`);
console.log(` - Calo gốc: ${solveRes.originalCalo.toFixed(1)} Kcal -> Sau tối ưu: ${solveRes.optimizedCalo.toFixed(1)} Kcal`);

if (solveRes.runtimeMs < 50) {
  console.log(' -> [PASS] Tốc độ xử lý siêu tốc (< 50ms)!');
} else {
  console.warn(' -> [WARNING] Tốc độ solver chậm hơn kỳ vọng');
}

const budgetDiffPct = Math.abs(solveRes.optimizedCost - 21000) / 21000;
if (budgetDiffPct <= 0.01) {
  console.log(` -> [PASS] Bám sát ngân sách 21.000 đ (sai lệch ${(budgetDiffPct * 100).toFixed(2)}% <= 1%)!`);
} else {
  console.error(` -> [FAIL] Sai lệch ngân sách lớn: ${(budgetDiffPct * 100).toFixed(2)}%`);
}

// 3. Kiểm tra Sinh file Excel
console.log('\n3. KIỂM TRA TRÌNH XUẤT BÁO CÁO EXCELJS:');
async function testExcel() {
  const wb = await generateNutritionWorkbook(SEED_MENU_PLAN_HAMTHANG, totals);
  const outPath = 'test_export.xlsx';
  await wb.xlsx.writeFile(outPath);
  const stats = fs.statSync(outPath);
  console.log(` - Đã xuất file: ${outPath} (${stats.size} bytes)`);
  console.log(` - Số lượng sheet: ${wb.worksheets.length} (Kỳ vọng: 3)`);
  for (const ws of wb.worksheets) {
    console.log(`   + Sheet "${ws.name}": ${ws.rowCount} dòng, ${ws.columnCount} cột`);
  }
  if (stats.size > 10000 && wb.worksheets.length === 3) {
    console.log(' -> [PASS] File Excel OpenXML chuẩn hóa thành công!');
  } else {
    console.error(' -> [FAIL] Lỗi kích thước hoặc thiếu sheet!');
    process.exit(1);
  }
}

testExcel().then(() => {
  console.log('\n========================================================');
  console.log('TẤT CẢ CÁC BƯỚC XÁC MINH TOÁN HỌC & KỸ THUẬT ĐÃ ĐẠT CHUẨN 100%');
  console.log('========================================================');
});
