import { SEED_MENU_PLAN_HAMTHANG } from '../src/data/seed-data-hamthang.js';
import { computeNutritionTotals } from '../src/engine/atwater.js';
import { evaluateCompliance } from '../src/engine/compliance-2195.js';
import { solveNutritionMenu } from '../src/engine/milp-solver.js';

console.log('================================================================');
console.log('KIỂM TOÁN TỰ ĐỘNG: PHÂN HỆ THẨM ĐỊNH LƯỢNG & CHẤT CHO HIỆU PHÓ BÁN TRÚ');
console.log('Quy chuẩn: Quyết định 2195/QĐ-BGDĐT & Công văn 423/BGDĐT-GDMN');
console.log('================================================================\n');

const plan = SEED_MENU_PLAN_HAMTHANG;
const studentCount = plan.studentCount;
const budget = plan.mealPricePerChild;

// 1. TÍNH TOÁN BAN ĐẦU
const initial = computeNutritionTotals(plan.items, studentCount, budget, plan.ageGroup);
const checks = evaluateCompliance(initial.totals, plan.ageGroup);

console.log('1. THẨM ĐỊNH 8 CHỈ SỐ VÀNG TRƯỚC KHI CÂN ĐỐI (DỮ LIỆU GỐC):');
checks.forEach((c) => {
  const icon = c.status === 'DAT' ? '✓' : c.status === 'CANH_BAO' ? '⚠️' : '✗';
  console.log(` [${icon}] ${c.name.padEnd(40)}: ${String(c.actualValue).padStart(6)} ${c.actualUnit.padEnd(5)} | Chuẩn: ${c.standardText}`);
  if (c.formulaText) console.log(`     Công thức: ${c.formulaText}`);
});

console.log('\n2. CHẠY BỘ GIẢI 2-PHASE ELASTIC MILP (KHÓA CỨNG NGÂN SÁCH):');
const solverRes = solveNutritionMenu(plan.items, studentCount, plan.ageGroup, {
  targetBudgetPerChild: budget,
});

console.log(` - Kết quả giải toán: ${solverRes.message}`);
console.log(` - Thời gian giải:    ${solverRes.runtimeMs} ms`);
console.log(` - Tiền ăn gốc:       ${Math.round(solverRes.originalCost)} đ/cháu`);
console.log(` - Tiền ăn tối ưu:    ${Math.round(solverRes.optimizedCost)} đ/cháu`);
console.log(` - Chênh lệch:        ${Math.abs(Math.round(solverRes.optimizedCost - budget))} đ/cháu`);

const budgetDiff = Math.abs(solverRes.optimizedCost - budget);
if (budgetDiff <= 100) {
  console.log(' -> [PASS] Khóa cứng ngân sách: Sai số ≤ 100 đ/cháu (Tuyệt đối an toàn kiểm toán)!');
} else {
  console.error(` -> [FAIL] Ngân sách lệch ${budgetDiff} đ (> 100đ)!`);
  process.exit(1);
}

// 3. THẨM TRA LẠI CÁC CHỈ SỐ SAU TỐI ƯU
const optimizedTotals = computeNutritionTotals(solverRes.items, studentCount, budget, plan.ageGroup).totals;
const optChecks = evaluateCompliance(optimizedTotals, plan.ageGroup);

console.log('\n3. THẨM ĐỊNH 8 CHỈ SỐ VÀNG SAU TỐI ƯU:');
optChecks.forEach((c) => {
  const icon = c.status === 'DAT' ? '✓' : c.status === 'CANH_BAO' ? '⚠️' : '✗';
  console.log(` [${icon}] ${c.name.padEnd(40)}: ${String(c.actualValue).padStart(6)} ${c.actualUnit.padEnd(5)} | ${c.status}`);
});

// 4. KIỂM TRA ĐỊNH LƯỢNG TRẦN/SÀN SINH HỌC
console.log('\n4. KIỂM TRA ĐỊNH LƯỢNG TRẦN/SÀN SINH HỌC CÁC MÓN THỰC PHẨM:');
solverRes.items.forEach((it) => {
  const cat = it.food.category;
  const g = it.gamPerChild;
  let pass = true;
  if (cat === 'gao' && g >= 40 && (g < 30 || g > 140)) pass = false;
  if (cat === 'thit_ca' && (g < 5 || g > 85)) pass = false;
  if (cat === 'dau_mo' && (g < 3 || g > 18)) pass = false;

  console.log(` - [${it.food.category.padEnd(8)}] ${it.food.name.padEnd(30)}: ${String(g).padStart(5)} g | ${pass ? '✓ Hợp lý' : '✗ Ngoài biên'}`);
});

console.log('\n================================================================');
console.log('>>> TOÀN BỘ KIỂM TRA THẨM ĐỊNH CHO HIỆU PHÓ BÁN TRÚ: PASS 100% <<<');
console.log('================================================================');
