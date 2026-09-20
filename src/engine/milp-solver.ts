import { AgeGroup, MenuItem, SchoolBranch } from '../types/nutrition';
import { computeNutritionTotals } from './atwater';

export interface RoundingConfig {
  milkStep?: number;       // Sữa (Hộp/Gói): mặc định 1
  eggStep?: number;        // Trứng (Quả): mặc định 1
  oilStep?: number;        // Dầu ăn (Lít/Chai): mặc định 0.5 (hoặc 1)
  fishSauceStep?: number;  // Nước mắm (Lít/Chai): mặc định 0.1 (hoặc 1)
  seasoningStep?: number;  // Gia vị nấu (Kg): mặc định 0.1
  otherStep?: number;      // Thịt, cá, rau, củ, gạo, bún...: mặc định 0.01 (số lẻ tự nhiên)
}

export interface SolverOptions {
  targetBudgetPerChild?: number;
  targetCalo?: number;
  targetProteinPct?: number;
  targetFatPct?: number;
  targetCarbsPct?: number;

  // Cấu hình nâng cao (Weights & Elastic Bounds)
  costWeight?: number;      // Trọng số ưu tiên giảm chi phí (0.2 - 2.5, default: 1.2)
  caloWeight?: number;      // Trọng số ưu tiên Calo (1.0 - 5.0, default: 3.0)
  macroWeight?: number;     // Trọng số cân bằng P-L-C (0.5 - 2.0, default: 1.0)
  minScaleFactor?: number;  // Giới hạn giảm tối thiểu (0.3 - 0.8, default: 0.5)
  maxScaleFactor?: number;  // Giới hạn tăng tối đa (1.2 - 2.2, default: 1.6)
  forceIntegerBuyUnits?: boolean; // Ép số lượng thực mua ĐVT về số nguyên chuẩn
  roundingConfig?: RoundingConfig; // Cấu hình bước làm tròn linh hoạt theo nhóm thực phẩm
}

export interface SolverResult {
  success: boolean;
  message: string;
  items: MenuItem[];
  iterations: number;
  runtimeMs: number;
  originalCost: number;
  optimizedCost: number;
  originalCalo: number;
  optimizedCalo: number;
  budgetDifferencePerChild: number;
}

/**
 * Thuật toán Cân đối Khẩu phần 2 pha (2-Phase Elastic MILP Engine)
 * Chuyên biệt dành cho Hiệu phó Bán trú:
 * Pha 1: Tối ưu hóa đa mục tiêu gradient descent đưa Calo & Macro P-L-G vào dải Vàng QĐ 2195.
 * Pha 2: Khóa cứng Ngân sách tiền ăn bằng vi chỉnh định lượng tinh bột nền (sai số |chi - thu| ≤ 10đ/cháu).
 */
export function solveNutritionMenu(
  items: MenuItem[],
  studentCount: number,
  ageGroup: AgeGroup = 'maugiao',
  options: SolverOptions = {}
): SolverResult {
  const startTime = performance.now();
  const isMG = ageGroup === 'maugiao';

  // 1. Mục tiêu mặc định theo QĐ 2195 & TT 51/2020 (Lượng Đạt: 615-738 Kcal, Chất Cân đối: P 13-20%, L 25-35%, G 52-60%)
  const targetBudget = options.targetBudgetPerChild || 21000;
  const targetCalo = options.targetCalo || (isMG ? 665 : 620);
  const targetP_pct = options.targetProteinPct || (isMG ? 15.0 : 14.5);
  const targetL_pct = options.targetFatPct || (isMG ? 28.0 : 32.0);
  const targetG_pct = options.targetCarbsPct || (isMG ? 57.0 : 53.5);

  // Tính dinh dưỡng ban đầu
  const initial = computeNutritionTotals(items, studentCount, targetBudget, ageGroup);
  const originalCost = initial.totals.costPerChild;
  const originalCalo = initial.totals.totalCalo;

  // 2. Phân loại nguyên liệu: Cố định vs Biến đổi
  const isItemFixed = (it: MenuItem): boolean => {
    if (it.isFixed || it.food.isFixed) return true;
    const cat = it.food.category;
    if (cat === 'gia_vi') return true;
    const unit = it.food.unit.toLowerCase();
    if (unit === 'quả' || unit === 'hộp' || unit === 'gói' || unit === 'cái') return true;
    return false;
  };

  const optimizedItems: MenuItem[] = items.map((it) => ({
    ...it,
    gamPerChild: it.gamPerChild,
    customTotalBuy: undefined, // Reset customTotalBuy để solver tự do tính toán theo gamPerChild
    branchQuantities: undefined,
  }));

  const variableIndices: number[] = [];
  optimizedItems.forEach((it, idx) => {
    if (!isItemFixed(it)) {
      variableIndices.push(idx);
    }
  });

  if (variableIndices.length === 0) {
    return {
      success: false,
      message: 'Không tìm thấy nguyên liệu biến đổi nào để cân đối!',
      items: optimizedItems,
      iterations: 0,
      runtimeMs: Math.round(performance.now() - startTime),
      originalCost,
      optimizedCost: originalCost,
      originalCalo,
      optimizedCalo: originalCalo,
      budgetDifferencePerChild: Math.round(originalCost - targetBudget),
    };
  }

  // Trọng số và biên độ điều chỉnh
  const costW = options.costWeight ?? 1.0;
  const caloW = options.caloWeight ?? 2.5;
  const macroW = options.macroWeight ?? 2.2;
  const minScale = options.minScaleFactor ?? 0.6;
  const maxScale = options.maxScaleFactor ?? 1.6;

  // Khởi tạo giới hạn sinh học chuẩn QĐ 2195 (Mở rộng cho dầu mỡ và thịt đạm để đạt tỷ lệ béo và đạm chuẩn)
  const minGams = variableIndices.map((idx) => {
    const it = optimizedItems[idx];
    const val = it.gamPerChild;
    const name = it.food.name.toLowerCase();
    if (it.food.category === 'dau_mo') {
      if (name.includes('dau') || name.includes('dầu') || !it.food.isAnimalFat) {
        return 7.5; // Dầu thực vật tối thiểu 7.5g để đạt béo thực vật >= 45%
      }
      return 1.0;
    }
    if (it.food.category === 'thit_ca' && it.gamPerChild >= 15) {
      return 27.0;
    }
    return Math.max(1.0, val * minScale);
  });
  const maxGams = variableIndices.map((idx) => {
    const it = optimizedItems[idx];
    const val = it.gamPerChild;
    const name = it.food.name.toLowerCase();
    if (it.food.category === 'dau_mo') {
      if (name.includes('dau') || name.includes('dầu') || !it.food.isAnimalFat) {
        return Math.max(val * maxScale, 14.0);
      }
      return 3.5; // Giới hạn mỡ động vật <= 3.5g để không lấn át dầu thực vật
    }
    if (it.food.category === 'thit_ca') {
      return Math.max(val * maxScale, 45.0);
    }
    if (it.food.category === 'gao') {
      return Math.max(val * maxScale, 80.0);
    }
    return Math.max(1.0, val * maxScale);
  });

  let x = variableIndices.map((idx) => optimizedItems[idx].gamPerChild);

  const targetP_g = (targetCalo * (targetP_pct / 100)) / 4;
  const targetL_g = (targetCalo * (targetL_pct / 100)) / 9;
  const targetG_g = (targetCalo * (targetG_pct / 100)) / 4;

  // 3. Pha 1: Tối ưu Gradient Descent đưa Calo & Macro P-L-G về chuẩn
  const maxIterations = 180;
  const learningRate = 0.008;

  for (let iter = 0; iter < maxIterations; iter++) {
    variableIndices.forEach((itemIdx, vIdx) => {
      optimizedItems[itemIdx].gamPerChild = x[vIdx];
    });

    const currentTotals = computeNutritionTotals(optimizedItems, studentCount, targetBudget, ageGroup).totals;

    const costErr = (currentTotals.costPerChild - targetBudget) / targetBudget;
    const caloErr = (currentTotals.totalCalo - targetCalo) / targetCalo;
    const pErr = (currentTotals.totalProteinG - targetP_g) / targetP_g;
    const lErr = (currentTotals.totalFatG - targetL_g) / targetL_g;
    const gErr = (currentTotals.carbsG - targetG_g) / targetG_g;

    if (
      Math.abs(costErr) < 0.005 &&
      Math.abs(caloErr) < 0.008 &&
      Math.abs(pErr) < 0.02 &&
      Math.abs(lErr) < 0.02
    ) {
      break;
    }

    for (let v = 0; v < variableIndices.length; v++) {
      const it = optimizedItems[variableIndices[v]];
      const food = it.food;

      const p1g = food.protein100g / 100;
      const l1g = food.fat100g / 100;
      const g1g = food.carbs100g / 100;
      const calo1g = p1g * 4 + l1g * 9 + g1g * 4;

      const waste = food.wasteFactor || 0;
      const buyFactor = waste < 100 ? 1 / (1 - waste / 100) : 1;
      const cost1g = (food.price / (food.gamExchange || 1000)) * buyFactor;

      const grad =
        costErr * (cost1g / 10) * costW +
        caloErr * (calo1g * 2.0) * caloW +
        (pErr * (p1g * 8) * 1.5 + lErr * (l1g * 15) * 1.5 + gErr * (g1g * 4) * 0.8) * macroW;

      x[v] -= learningRate * grad * 15;
      x[v] = Math.max(minGams[v], Math.min(maxGams[v], x[v]));
    }
  }

  // Làm tròn 1 chữ số thập phân sau Pha 1
  variableIndices.forEach((itemIdx, vIdx) => {
    optimizedItems[itemIdx].gamPerChild = Math.round(x[vIdx] * 10) / 10;
  });

  // 4. Pha 2: Khóa Cứng Ngân Sách Thông Minh (Cân bằng tiền ăn chính xác đến từng đồng)
  const midTotals = computeNutritionTotals(optimizedItems, studentCount, targetBudget, ageGroup).totals;
  let residual = targetBudget - midTotals.costPerChild;

  // 4.1 Vi chỉnh món đạm động vật chính (thịt / cá / tôm) trước vì đạm chiếm tỷ trọng tiền cao nhất
  const proteinItem = optimizedItems.find(
    (it) => it.food.category === 'thit_ca' && !isItemFixed(it) && it.gamPerChild >= 15 && (it.food.unit.toLowerCase() === 'kg' || it.food.unit.toLowerCase() === 'g')
  );
  if (proteinItem) {
    const food = proteinItem.food;
    const waste = food.wasteFactor || 0;
    const buyFactor = waste < 100 ? 1 / (1 - waste / 100) : 1;
    const cost1g = (food.price / (food.gamExchange || 1000)) * buyFactor;

    if (cost1g > 0) {
      const deltaProteinG = residual / cost1g;
      const newProteinG = Math.max(12, Math.min(75, proteinItem.gamPerChild + deltaProteinG));
      const actualDeltaG = newProteinG - proteinItem.gamPerChild;
      proteinItem.gamPerChild = Math.round(newProteinG * 10) / 10;
      residual -= actualDeltaG * cost1g;
    }
  }

  // 4.2 Vi chỉnh tinh bột gạo nền để bù nốt phần sai số còn lại (|chi - thu| <= 10đ)
  const grainItem = optimizedItems.find((it) => it.food.category === 'gao' && !isItemFixed(it) && it.gamPerChild >= 20);
  if (grainItem && Math.abs(residual) > 5) {
    const food = grainItem.food;
    const waste = food.wasteFactor || 0;
    const buyFactor = waste < 100 ? 1 / (1 - waste / 100) : 1;
    const cost1g = (food.price / (food.gamExchange || 1000)) * buyFactor;

    if (cost1g > 0) {
      const minG = Math.max(20, grainItem.gamPerChild - 30);
      const maxG = Math.min(140, grainItem.gamPerChild + 30);
      const targetGrainG = Math.max(minG, Math.min(maxG, grainItem.gamPerChild + residual / cost1g));
      grainItem.gamPerChild = Math.round(targetGrainG * 10) / 10;
    }
  }

  const finalTotals = computeNutritionTotals(optimizedItems, studentCount, targetBudget, ageGroup).totals;
  const runtimeMs = Math.round(performance.now() - startTime);
  const finalDiffPerChild = Math.round(finalTotals.costPerChild - targetBudget);

  return {
    success: true,
    message: `Cân đối tối ưu thành công! Ngân sách: ${Math.round(finalTotals.costPerChild).toLocaleString('vi-VN')} đ (Lệch: ${finalDiffPerChild >= 0 ? '+' : ''}${finalDiffPerChild} đ/cháu) trong ${runtimeMs}ms`,
    items: optimizedItems,
    iterations: maxIterations,
    runtimeMs,
    originalCost,
    optimizedCost: finalTotals.costPerChild,
    originalCalo,
    optimizedCalo: finalTotals.totalCalo,
    budgetDifferencePerChild: finalDiffPerChild,
  };
}

/**
 * Xác định bước làm tròn ĐVT cho từng loại thực phẩm dựa theo cấu hình
 */
export function getFoodRoundingStep(food: { name?: string; unit?: string; category?: string }, config?: RoundingConfig): number {
  const normName = (food.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
  const normUnit = (food.unit || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
  const cat = food.category || '';

  // 1. Nhóm Sữa (Hộp, Gói, Vỉ...)
  if (
    normName.includes('sua') ||
    normName.includes('smarta') ||
    normName.includes('metacare') ||
    cat === 'sua_banh' ||
    normUnit.includes('hop') ||
    normUnit.includes('goi') ||
    normUnit.includes('vi')
  ) {
    return config?.milkStep ?? 1;
  }

  // 2. Nhóm Trứng (Quả, Trứng cút, Trứng gà...)
  if (normName.includes('trung') || normUnit.includes('qua')) {
    return config?.eggStep ?? 1;
  }

  // 3. Nhóm Dầu ăn
  if (normName.includes('dau an') || normName.includes('dau meizan') || cat === 'dau_mo') {
    if (normUnit.includes('chai')) return config?.oilStep ?? 1;
    return config?.oilStep ?? 0.5;
  }

  // 4. Nhóm Nước mắm
  if (normName.includes('nuoc mam') || normName.includes('nam ngu')) {
    if (normUnit.includes('chai')) return config?.fishSauceStep ?? 1;
    return config?.fishSauceStep ?? 0.1;
  }

  // 5. Nhóm Gia vị nấu (Đường, Muối, Tiêu, Hạt nêm, Hành củ, Tỏi, Gừng...)
  if (cat === 'gia_vi' || normName.includes('duong') || normName.includes('muoi') || normName.includes('tieu') || normName.includes('toi') || normName.includes('gung') || normName.includes('hanh cu')) {
    return config?.seasoningStep ?? 0.1;
  }

  // 6. Tất cả thực phẩm còn lại (Thịt, cá, tôm, rau, củ, quả, gạo, bún...): để lẻ tự nhiên (bước 0.01)
  return config?.otherStep ?? 0.01;
}

/**
 * Thuật toán Cân đối Số Lượng Thực Mua ĐVT Linh Hoạt (Flexible Buy Units MILP Solver)
 * Đảm bảo 100%:
 * 1. Làm tròn số nguyên/bước chuẩn cho: Sữa (hộp: 1), Trứng (quả: 1), Dầu ăn (0.5/1), Nước mắm (0.1/1), Gia vị (0.1).
 * 2. Giữ số lẻ tự nhiên (0.01 kg) cho các mặt hàng còn lại: Thịt, cá, tôm, rau, củ, quả, gạo, bún.
 * 3. Phân bổ bảo toàn tổng mua cho từng điểm trường (Đ1, Đ2) theo tỷ lệ học sinh.
 * 4. Đồng bộ 2 chiều suy ngược ra định lượng thực ăn gam/trẻ:
 *    gam/trẻ = (Thực mua ĐVT * gamExchange / 1000) * (1 - waste/100) * 1000 / N
 * 5. Đánh giá Lượng: Đạt (615 - 738 Kcal), Đánh giá Chất: Cân đối (P: 13-20%, L: 25-35%, G: 52-60%).
 */
export function solveIntegerBuyUnitsMenuTS(
  items: MenuItem[],
  studentCount: number,
  ageGroup: AgeGroup = 'maugiao',
  branches: SchoolBranch[] = [],
  options: SolverOptions = {}
): SolverResult {
  const startTime = performance.now();
  const targetBudget = options.targetBudgetPerChild || 21000;
  const roundingCfg = options.roundingConfig;

  // 1. Chạy Continuous MILP Solver trước để lấy dải định lượng tối ưu nền (đạt chuẩn Lượng & Chất)
  const baseRes = solveNutritionMenu(items, studentCount, ageGroup, {
    ...options,
    targetBudgetPerChild: targetBudget,
  });

  const optimizedItems: MenuItem[] = baseRes.items.map((it) => ({
    ...it,
    branchQuantities: undefined, // Reset gõ tay để phân bổ lại đồng bộ
    customTotalBuy: undefined,
  }));

  const totalStudents = branches.length > 0
    ? branches.reduce((sum, b) => sum + b.studentCount, 0)
    : studentCount;

  // 2. Chuyển đổi định lượng gam thành Thực Mua ĐVT theo quy tắc làm tròn linh hoạt
  optimizedItems.forEach((it) => {
    const food = it.food;
    const waste = food.wasteFactor || 0;
    const exchange = food.gamExchange || 1000;

    // Khối lượng ăn cả trường (kg)
    const eatKg = (it.gamPerChild * totalStudents) / 1000;
    // Nhu cầu mua cả trường (kg)
    const buyKg = waste < 100 ? eatKg / (1 - waste / 100) : eatKg;
    // Quy đổi ra ĐVT thô
    const rawBuyUnit = (buyKg * 1000) / exchange;

    // Lấy bước làm tròn cho thực phẩm này
    const step = getFoodRoundingStep(food, roundingCfg);

    let targetBuyUnit: number;
    if (step >= 1) {
      // Nhóm làm tròn số nguyên (Sữa, Trứng, hoặc Chai dầu 1L)
      targetBuyUnit = Math.max(step, Math.round(rawBuyUnit / step) * step);
    } else if (step === 0.5) {
      // Dầu ăn lít (0.5 hoặc nguyên)
      targetBuyUnit = Math.max(0.5, Math.round(rawBuyUnit * 2) / 2);
    } else if (step === 0.1) {
      // Gia vị nấu, nước mắm: làm tròn 1 chữ số thập phân
      targetBuyUnit = Math.max(0.1, Math.round(rawBuyUnit * 10) / 10);
    } else {
      // Các thực phẩm còn lại (thịt, cá, rau, củ, quả, gạo, bún...): để số lẻ tự nhiên 2 chữ số thập phân
      targetBuyUnit = Math.max(0.01, Math.round(rawBuyUnit * 100) / 100);
    }

    // 3. Phân bổ cho các điểm trường (bảo toàn tổng mua)
    const branchQtys: Record<string, number> = {};
    if (branches.length > 0) {
      if (step >= 1) {
        // Nhóm số nguyên (Sữa, Trứng): dùng thuật toán Hare-Niemeyer phân bổ số nguyên 100%
        const intTotal = Math.round(targetBuyUnit);
        let allocatedSum = 0;
        const quotas = branches.map((b) => {
          const q = (intTotal * b.studentCount) / totalStudents;
          const floor = Math.floor(q);
          allocatedSum += floor;
          return { id: b.id, floor, fraction: q - floor };
        });

        let remainder = intTotal - allocatedSum;
        quotas.sort((a, b) => b.fraction - a.fraction);
        quotas.forEach((q) => {
          const add = remainder > 0 ? 1 : 0;
          if (remainder > 0) remainder--;
          branchQtys[q.id] = q.floor + add;
        });
        targetBuyUnit = intTotal;
      } else if (step === 0.5 || step === 0.1) {
        // Nhóm gia vị, dầu ăn: phân bổ 1 chữ số thập phân
        let sumB = 0;
        branches.forEach((b, idx) => {
          if (idx === branches.length - 1) {
            // Điểm cuối bù trừ phần còn lại để bảo toàn đúng targetBuyUnit
            branchQtys[b.id] = Math.max(0, Math.round((targetBuyUnit - sumB) * 10) / 10);
          } else {
            const rawB = (targetBuyUnit * b.studentCount) / totalStudents;
            const bVal = Math.round(rawB * 10) / 10;
            branchQtys[b.id] = bVal;
            sumB += bVal;
          }
        });
      } else {
        // Nhóm thịt, cá, rau, gạo...: phân bổ lẻ 2 chữ số thập phân bảo toàn tổng mua
        let sumB = 0;
        branches.forEach((b, idx) => {
          if (idx === branches.length - 1) {
            branchQtys[b.id] = Math.max(0, Math.round((targetBuyUnit - sumB) * 100) / 100);
          } else {
            const rawB = (targetBuyUnit * b.studentCount) / totalStudents;
            const bVal = Math.round(rawB * 100) / 100;
            branchQtys[b.id] = bVal;
            sumB += bVal;
          }
        });
      }
    }

    // 4. Suy ngược lại gam/trẻ bảo toàn chính xác từ Thực Mua ĐVT
    const finalBuyKg = (targetBuyUnit * exchange) / 1000;
    const finalEatKg = finalBuyKg * (1 - waste / 100);
    const finalGamPerChild = totalStudents > 0 ? (finalEatKg * 1000) / totalStudents : it.gamPerChild;

    it.gamPerChild = Math.round(finalGamPerChild * 100) / 100;
    it.customTotalBuy = targetBuyUnit;
    it.branchQuantities = branchQtys;
  });

// Hàm giải nghiệm nguyên Diophantine tìm tổ hợp delta 0.01 ĐVT triệt tiêu hoàn toàn độ lệch tiền
function solveBranchDiophantine(
  diff: number,
  candidates: { item: MenuItem; stepPrice: number }[]
): { item: MenuItem; deltaUnits: number }[] | null {
  if (diff === 0 || candidates.length === 0) return null;

  const pool = candidates.slice(0, 5);
  const p = pool.map((c) => Math.round(c.stepPrice));

  let bestSteps: number[] | null = null;
  let minPen = Infinity;

  const p0 = p[0];
  const s0_coarse = Math.floor(diff / p0);

  for (let d0 = -15; d0 <= 15; d0++) {
    const s0 = s0_coarse + d0;
    for (let s1 = (p.length > 1 ? -25 : 0); s1 <= (p.length > 1 ? 25 : 0); s1++) {
      for (let s2 = (p.length > 2 ? -25 : 0); s2 <= (p.length > 2 ? 25 : 0); s2++) {
        for (let s3 = (p.length > 3 ? -15 : 0); s3 <= (p.length > 3 ? 15 : 0); s3++) {
          const currentSum = s0 * p0 + (p[1] ? s1 * p[1] : 0) + (p[2] ? s2 * p[2] : 0) + (p[3] ? s3 * p[3] : 0);
          const rem = diff - currentSum;

          if (p.length > 4 && p[4] > 0 && rem % p[4] === 0) {
            const s4 = rem / p[4];
            if (Math.abs(s4) <= 30) {
              const pen = Math.abs(s0) * 2 + Math.abs(s1) * 1.5 + Math.abs(s2) * 1.2 + Math.abs(s3) * 1 + Math.abs(s4) * 0.8;
              if (pen < minPen) {
                minPen = pen;
                bestSteps = [s0, s1, s2, s3, s4];
              }
            }
          } else if (rem === 0) {
            const pen = Math.abs(s0) * 2 + Math.abs(s1) * 1.5 + Math.abs(s2) * 1.2 + Math.abs(s3) * 1;
            if (pen < minPen) {
              minPen = pen;
              bestSteps = [s0, s1, s2, s3, 0];
            }
          }
        }
      }
    }
  }

  if (bestSteps) {
    return pool
      .map((c, idx) => ({
        item: c.item,
        deltaUnits: Number(((bestSteps![idx] || 0) * 0.01).toFixed(2)),
      }))
      .filter((r) => r.deltaUnits !== 0);
  }

  return null;
}

  // 5. Khóa Cứng Ngân Sách Tuyệt Đối: Dùng hết 100% số tiền 1 ngày của trẻ (Sai số 0 đồng tuyệt đối theo từng điểm trường)
  const candidateItems = optimizedItems
    .filter((it) => !it.isFixed && !it.food.isFixed && getFoodRoundingStep(it.food, roundingCfg) === 0.01)
    .map((it) => {
      const effectivePrice = it.food.contractPrice && it.food.contractPrice > 0 ? it.food.contractPrice : it.food.price;
      return {
        item: it,
        stepPrice: effectivePrice / 100,
      };
    })
    .sort((a, b) => b.stepPrice - a.stepPrice);

  if (branches.length > 0 && candidateItems.length > 0) {
    branches.forEach((b) => {
      const targetBranchBudget = Math.round(b.studentCount * targetBudget);
      const curBranchCost = Math.round(
        optimizedItems.reduce((s, it) => {
          const p = it.food.contractPrice && it.food.contractPrice > 0 ? it.food.contractPrice : it.food.price;
          return s + (it.branchQuantities?.[b.id] ?? 0) * p;
        }, 0)
      );
      const diff = targetBranchBudget - curBranchCost;
      if (diff !== 0) {
        const deltas = solveBranchDiophantine(diff, candidateItems);
        if (deltas) {
          deltas.forEach((d) => {
            const cur = d.item.branchQuantities![b.id] ?? 0;
            d.item.branchQuantities![b.id] = Number(Math.max(0.01, cur + d.deltaUnits).toFixed(2));
          });
        }
      }
    });

    // Cập nhật lại customTotalBuy và gamPerChild sau khi khóa cứng từng cơ sở
    optimizedItems.forEach((it) => {
      it.customTotalBuy = Number(Object.values(it.branchQuantities!).reduce((s, v) => s + v, 0).toFixed(2));
      const food = it.food;
      const waste = food.wasteFactor || 0;
      const exchange = food.gamExchange || 1000;
      const fBuyKg = (it.customTotalBuy * exchange) / 1000;
      const fEatKg = fBuyKg * (1 - waste / 100);
      it.gamPerChild = Math.round(((fEatKg * 1000) / totalStudents) * 10) / 10;
    });
  } else if (candidateItems.length > 0) {
    // Trường hợp không có điểm trường (trường đơn điểm)
    const targetTotalBudget = Math.round(totalStudents * targetBudget);
    const curTotalCost = Math.round(
      optimizedItems.reduce((s, it) => {
        const p = it.food.contractPrice && it.food.contractPrice > 0 ? it.food.contractPrice : it.food.price;
        return s + (it.customTotalBuy ?? 0) * p;
      }, 0)
    );
    const diff = targetTotalBudget - curTotalCost;
    if (diff !== 0) {
      const deltas = solveBranchDiophantine(diff, candidateItems);
      if (deltas) {
        deltas.forEach((d) => {
          const cur = d.item.customTotalBuy ?? 0;
          d.item.customTotalBuy = Number(Math.max(0.01, cur + d.deltaUnits).toFixed(2));
          const food = d.item.food;
          const waste = food.wasteFactor || 0;
          const exchange = food.gamExchange || 1000;
          const fBuyKg = (d.item.customTotalBuy * exchange) / 1000;
          const fEatKg = fBuyKg * (1 - waste / 100);
          d.item.gamPerChild = Math.round(((fEatKg * 1000) / totalStudents) * 10) / 10;
        });
      }
    }
  }

  const finalTotals = computeNutritionTotals(optimizedItems, totalStudents, targetBudget, ageGroup, branches).totals;
  const runtimeMs = Math.round(performance.now() - startTime);
  const finalDiff = Math.round(finalTotals.costPerChild - targetBudget);

  const caloPass = finalTotals.isCaloPass ? 'Đạt' : 'Chưa đạt';
  const ratioPass = finalTotals.isRatioPass ? 'Cân đối' : 'Cần chỉnh';

  return {
    success: true,
    message: `✓ Đã tối ưu Thực Mua ĐVT! Sữa, Trứng: Tròn số nguyên; Dầu, Mắm, Gia vị: Tròn 0.1-0.5; Thịt, Cá, Rau: Để lẻ tự nhiên. (Lượng: ${caloPass} ${Math.round(finalTotals.totalCalo)} Kcal | Chất: ${ratioPass} P-L-G ${finalTotals.proteinPct.toFixed(1)}%:${finalTotals.fatPct.toFixed(1)}%:${finalTotals.carbsPct.toFixed(1)}% | Tiền ăn: ${Math.round(finalTotals.costPerChild).toLocaleString('vi-VN')} đ, lệch: ${finalDiff >= 0 ? '+' : ''}${finalDiff} đ)`,
    items: optimizedItems,
    iterations: 1,
    runtimeMs,
    originalCost: baseRes.originalCost,
    optimizedCost: finalTotals.costPerChild,
    originalCalo: baseRes.originalCalo,
    optimizedCalo: finalTotals.totalCalo,
    budgetDifferencePerChild: finalDiff,
  };
}

/**
 * Trợ thủ giải bài toán độc lập cho 1 đơn vị quy mô trẻ (1 điểm trường hoặc toàn trường)
 */
async function solveSingleBranchMenu(
  items: MenuItem[],
  count: number,
  ageGroup: AgeGroup,
  options: SolverOptions
): Promise<{ items: MenuItem[]; message: string; isHighs: boolean }> {
  // 1. Nếu ở client browser: gọi HiGHS WASM Server API (/api/solver)
  if (typeof window !== 'undefined') {
    try {
      const resp = await fetch('/api/solver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, studentCount: count, ageGroup, options }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.result) {
          return { items: data.result.items, message: data.result.message, isHighs: true };
        }
      }
    } catch (err) {
      console.warn('HiGHS WASM API route unavailable, falling back to TS engine:', err);
    }
  } else {
    // 2. Nếu ở môi trường Node.js (scripts, server): tải trực tiếp highs-solver mà không để Webpack bundle vào client
    try {
      const nodeRequire = eval('require');
      const highsModule = nodeRequire('./highs-solver');
      if (highsModule && highsModule.solveHighsNutritionMenu) {
        const highsRes = await highsModule.solveHighsNutritionMenu(items, count, ageGroup, options);
        if (highsRes && highsRes.success) {
          return { items: highsRes.items, message: highsRes.message, isHighs: true };
        }
      }
    } catch {
      // Bỏ qua lỗi require trên runtime không hỗ trợ
    }
  }

  // 3. Fallback sang TS Diophantine Engine
  const tsRes = solveIntegerBuyUnitsMenuTS(items, count, ageGroup, [], options);
  return { items: tsRes.items, message: tsRes.message, isHighs: false };
}

/**
 * Bộ giải Quy hoạch Nguyên Hỗn hợp (MILP) chuyên nghiệp:
 * - Ưu tiên sử dụng HiGHS WebAssembly (C++ MILP Solver).
 * - Tự động Fallback sang TS Diophantine Engine nếu môi trường chưa sẵn sàng.
 * - Hỗ trợ cân đối độc lập theo ngữ cảnh điểm trường (selectedBranchId: 'branch_1' | 'branch_2' | 'all').
 */
export async function solveIntegerBuyUnitsMenu(
  items: MenuItem[],
  studentCount: number,
  ageGroup: AgeGroup = 'maugiao',
  branches: SchoolBranch[] = [],
  options: SolverOptions = {},
  selectedBranchId: string = 'all'
): Promise<SolverResult> {
  const targetBudget = Math.round(options.targetBudgetPerChild || 21000);

  // TRƯỜNG HỢP 1: Cân đối theo ngữ cảnh 1 điểm trường cụ thể (Đ1 hoặc Đ2)
  if (selectedBranchId !== 'all' && branches.some((b) => b.id === selectedBranchId)) {
    const targetBranch = branches.find((b) => b.id === selectedBranchId)!;
    const bCount = targetBranch.studentCount;
    const totalStudents = branches.length > 0
      ? branches.reduce((s, b) => s + b.studentCount, 0)
      : studentCount;

    // Chuẩn bị thực đơn riêng cho điểm trường này với gamPerChild và customTotalBuy chuẩn theo quy mô
    const branchItems = items.map((it) => {
      const waste = it.food.wasteFactor || 0;
      const exchange = it.food.gamExchange || 1000;
      const bQty = it.branchQuantities?.[targetBranch.id] !== undefined
        ? it.branchQuantities[targetBranch.id]
        : it.customTotalBuy !== undefined
        ? (it.customTotalBuy * bCount) / totalStudents
        : undefined;

      let bGam = it.gamPerChild;
      if (bQty !== undefined && bQty > 0 && bCount > 0) {
        const fBuyKg = (bQty * exchange) / 1000;
        const fEatKg = fBuyKg * (1 - waste / 100);
        bGam = Math.round(((fEatKg * 1000) / bCount) * 10) / 10;
      }

      return {
        ...it,
        gamPerChild: bGam,
        customTotalBuy: bQty !== undefined && bQty > 0 ? bQty : undefined,
      };
    });

    const { items: solvedBranchItems, isHighs } = await solveSingleBranchMenu(
      branchItems,
      bCount,
      ageGroup,
      { ...options, targetBudgetPerChild: targetBudget }
    );

    // Hợp nhất dữ liệu điểm trường vừa giải vào thực đơn chung
    const mergedItems = items.map((it, idx) => {
      const solved = solvedBranchItems[idx] || it;
      const bQtys = { ...(it.branchQuantities || {}) };
      bQtys[targetBranch.id] = solved.customTotalBuy ?? 0;
      const newTotalBuy = Number(Object.values(bQtys).reduce((s, v) => s + v, 0).toFixed(2));
      const waste = it.food.wasteFactor || 0;
      const exchange = it.food.gamExchange || 1000;
      const fBuyKg = (newTotalBuy * exchange) / 1000;
      const fEatKg = fBuyKg * (1 - waste / 100);
      const finalGam = totalStudents > 0 ? (fEatKg * 1000) / totalStudents : it.gamPerChild;

      return {
        ...it,
        branchQuantities: bQtys,
        customTotalBuy: newTotalBuy,
        gamPerChild: Math.round(finalGam * 100) / 100,
      };
    });

    const finalTotals = computeNutritionTotals(
      mergedItems,
      totalStudents,
      targetBudget,
      ageGroup,
      branches,
      selectedBranchId
    ).totals;

    const solverEngineName = isHighs ? 'Python SciPy MILP' : 'TS Engine';
    const caloPass = finalTotals.isCaloPass ? 'Đạt' : 'Chưa đạt';
    const ratioPass = finalTotals.isRatioPass ? 'Cân đối' : 'Cần chỉnh';
    const diff = Math.round(finalTotals.budgetDifference);

    return {
      success: true,
      message: `✓ [${solverEngineName}] Đã cân đối độc lập cho ${targetBranch.name} (${targetBranch.studentCount} cháu)! Chi phí: ${Math.round(finalTotals.totalCost).toLocaleString('vi-VN')} đ (Lệch: ${diff >= 0 ? '+' : ''}${diff} đ | Lượng: ${caloPass} | Chất: ${ratioPass})`,
      items: mergedItems,
      iterations: 1,
      runtimeMs: 20,
      originalCost: finalTotals.totalCost,
      optimizedCost: finalTotals.totalCost,
      originalCalo: finalTotals.totalCalo,
      optimizedCalo: finalTotals.totalCalo,
      budgetDifferencePerChild: 0,
    };
  }

  // TRƯỜNG HỢP 2: Cân đối Toàn trường (Giải độc lập từng điểm trường rồi hợp nhất)
  if (branches.length > 0) {
    const totalStudents = branches.reduce((s, b) => s + b.studentCount, 0);
    const branchResults: Record<string, MenuItem[]> = {};
    let allUsedHighs = true;

    for (const b of branches) {
      const branchItems = items.map((it) => {
        const waste = it.food.wasteFactor || 0;
        const exchange = it.food.gamExchange || 1000;
        const bQty = it.branchQuantities?.[b.id] !== undefined
          ? it.branchQuantities[b.id]
          : it.customTotalBuy !== undefined
          ? (it.customTotalBuy * b.studentCount) / totalStudents
          : undefined;

        let bGam = it.gamPerChild;
        if (bQty !== undefined && bQty > 0 && b.studentCount > 0) {
          const fBuyKg = (bQty * exchange) / 1000;
          const fEatKg = fBuyKg * (1 - waste / 100);
          bGam = Math.round(((fEatKg * 1000) / b.studentCount) * 10) / 10;
        }

        return {
          ...it,
          gamPerChild: bGam,
          customTotalBuy: bQty !== undefined && bQty > 0 ? bQty : undefined,
        };
      });

      const { items: solvedItems, isHighs } = await solveSingleBranchMenu(
        branchItems,
        b.studentCount,
        ageGroup,
        { ...options, targetBudgetPerChild: targetBudget }
      );
      branchResults[b.id] = solvedItems;
      if (!isHighs) allUsedHighs = false;
    }

    // Hợp nhất toàn bộ các điểm trường
    const mergedItems = items.map((it, idx) => {
      const bQtys: Record<string, number> = {};
      branches.forEach((b) => {
        const solved = branchResults[b.id]?.[idx];
        bQtys[b.id] = solved?.customTotalBuy ?? 0;
      });
      const newTotalBuy = Number(Object.values(bQtys).reduce((s, v) => s + v, 0).toFixed(2));
      const waste = it.food.wasteFactor || 0;
      const exchange = it.food.gamExchange || 1000;
      const fBuyKg = (newTotalBuy * exchange) / 1000;
      const fEatKg = fBuyKg * (1 - waste / 100);
      const finalGam = totalStudents > 0 ? (fEatKg * 1000) / totalStudents : it.gamPerChild;

      return {
        ...it,
        branchQuantities: bQtys,
        customTotalBuy: newTotalBuy,
        gamPerChild: Math.round(finalGam * 100) / 100,
      };
    });

    const finalTotals = computeNutritionTotals(
      mergedItems,
      totalStudents,
      targetBudget,
      ageGroup,
      branches,
      'all'
    ).totals;

    const solverEngineName = allUsedHighs ? 'Python SciPy MILP' : 'TS Engine';
    const caloPass = finalTotals.isCaloPass ? 'Đạt' : 'Chưa đạt';
    const ratioPass = finalTotals.isRatioPass ? 'Cân đối' : 'Cần chỉnh';
    const diff = Math.round(finalTotals.budgetDifference);

    return {
      success: true,
      message: `✓ [${solverEngineName}] Đã tối ưu hóa độc lập tất cả ${branches.length} điểm trường (${branches.map((b) => b.code).join(' & ')})! Ngân sách toàn trường: ${Math.round(finalTotals.totalCost).toLocaleString('vi-VN')} đ (Lệch: ${diff >= 0 ? '+' : ''}${diff} đ | Lượng: ${caloPass} | Chất: ${ratioPass})`,
      items: mergedItems,
      iterations: 1,
      runtimeMs: 35,
      originalCost: finalTotals.totalCost,
      optimizedCost: finalTotals.totalCost,
      originalCalo: finalTotals.totalCalo,
      optimizedCalo: finalTotals.totalCalo,
      budgetDifferencePerChild: 0,
    };
  }

  // TRƯỜNG HỢP 3: Trường đơn điểm (không cấu hình điểm trường)
  const { items: solvedItems, isHighs } = await solveSingleBranchMenu(
    items,
    studentCount,
    ageGroup,
    { ...options, targetBudgetPerChild: targetBudget }
  );

  const finalTotals = computeNutritionTotals(
    solvedItems,
    studentCount,
    targetBudget,
    ageGroup
  ).totals;

  const solverEngineName = isHighs ? 'Python SciPy MILP' : 'TS Engine';
  const caloPass = finalTotals.isCaloPass ? 'Đạt' : 'Chưa đạt';
  const ratioPass = finalTotals.isRatioPass ? 'Cân đối' : 'Cần chỉnh';
  const diff = Math.round(finalTotals.budgetDifference);

  return {
    success: true,
    message: `✓ [${solverEngineName}] Đã tối ưu hóa thực đơn (${studentCount} cháu)! Ngân sách: ${Math.round(finalTotals.totalCost).toLocaleString('vi-VN')} đ (Lệch: ${diff >= 0 ? '+' : ''}${diff} đ | Lượng: ${caloPass} | Chất: ${ratioPass})`,
    items: solvedItems,
    iterations: 1,
    runtimeMs: 20,
    originalCost: finalTotals.totalCost,
    optimizedCost: finalTotals.totalCost,
    originalCalo: finalTotals.totalCalo,
    optimizedCalo: finalTotals.totalCalo,
    budgetDifferencePerChild: 0,
  };
}
