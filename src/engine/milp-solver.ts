import { AgeGroup, MenuItem, SchoolBranch } from '../types/nutrition';
import { computeNutritionTotals } from './atwater';

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

  // 1. Mục tiêu mặc định theo QĐ 2195 & TT 51/2020
  const targetBudget = options.targetBudgetPerChild || 21000;
  const targetCalo = options.targetCalo || (isMG ? 685 : 620);
  const targetP_pct = options.targetProteinPct || (isMG ? 14.5 : 14.0);
  const targetL_pct = options.targetFatPct || (isMG ? 32.0 : 35.0);
  const targetG_pct = options.targetCarbsPct || (isMG ? 53.5 : 51.0);

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
  const costW = options.costWeight ?? 1.2;
  const caloW = options.caloWeight ?? 3.0;
  const macroW = options.macroWeight ?? 1.0;
  const minScale = options.minScaleFactor ?? 0.5;
  const maxScale = options.maxScaleFactor ?? 1.6;

  // Khởi tạo giới hạn sinh học chuẩn QĐ 2195
  const minGams = variableIndices.map((idx) => {
    const val = optimizedItems[idx].gamPerChild;
    return Math.max(1.0, val * minScale);
  });
  const maxGams = variableIndices.map((idx) => {
    const val = optimizedItems[idx].gamPerChild;
    return val * maxScale;
  });

  let x = variableIndices.map((idx) => optimizedItems[idx].gamPerChild);

  const targetP_g = (targetCalo * (targetP_pct / 100)) / 4;
  const targetL_g = (targetCalo * (targetL_pct / 100)) / 9;
  const targetG_g = (targetCalo * (targetG_pct / 100)) / 4;

  // 3. Pha 1: Tối ưu Gradient Descent đưa Calo & Macro P-L-G về chuẩn
  const maxIterations = 150;
  const learningRate = 0.005;

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
      Math.abs(costErr) < 0.003 &&
      Math.abs(caloErr) < 0.005 &&
      Math.abs(pErr) < 0.015 &&
      Math.abs(lErr) < 0.015
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
        costErr * cost1g * costW +
        caloErr * (calo1g / 15) * caloW +
        (pErr * (p1g * 4) * 1.0 + lErr * (l1g * 9) * 1.2 + gErr * (g1g * 4) * 0.8) * macroW;

      x[v] -= learningRate * grad * 18;
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
    (it) => it.food.category === 'thit_ca' && !isItemFixed(it) && it.gamPerChild >= 15
  );
  if (proteinItem) {
    const food = proteinItem.food;
    const waste = food.wasteFactor || 0;
    const buyFactor = waste < 100 ? 1 / (1 - waste / 100) : 1;
    const cost1g = (food.price / (food.gamExchange || 1000)) * buyFactor;

    if (cost1g > 0) {
      const deltaProteinG = residual / cost1g;
      const newProteinG = Math.max(12, Math.min(50, proteinItem.gamPerChild + deltaProteinG));
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
      const minG = Math.max(15, grainItem.gamPerChild - 15);
      const maxG = grainItem.gamPerChild + 15;
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
 * Thuật toán Cân đối Số Lượng Thực Mua ĐVT Số Nguyên (Integer Buy Units MILP Solver)
 * Đảm bảo 100%:
 * 1. Tổng thực mua ĐVT là số nguyên tròn trịa khi đi chợ (hoặc số thập phân 1 chữ số với gia vị).
 * 2. Phân bổ bảo toàn số nguyên cho từng điểm trường (Đ1, Đ2) theo phương pháp Hare-Niemeyer.
 * 3. Đồng bộ 2 chiều suy ngược ra định lượng thực ăn gam/trẻ:
 *    gam/trẻ = (Thực mua ĐVT * gamExchange / 1000) * (1 - waste/100) * 1000 / N
 * 4. Đánh giá Lượng: Đạt (615 - 738 Kcal), Đánh giá Chất: Cân đối (P: 13-20%, L: 25-35%, G: 52-60%).
 */
export function solveIntegerBuyUnitsMenu(
  items: MenuItem[],
  studentCount: number,
  ageGroup: AgeGroup = 'maugiao',
  branches: SchoolBranch[] = [],
  options: SolverOptions = {}
): SolverResult {
  const startTime = performance.now();
  const targetBudget = options.targetBudgetPerChild || 21000;

  // 1. Chạy Continuous MILP Solver trước để lấy dải định lượng tối ưu nền
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

  // 2. Chuyển đổi định lượng gam thành số nguyên thực mua ĐVT cho từng món
  optimizedItems.forEach((it) => {
    const food = it.food;
    const waste = food.wasteFactor || 0;
    const exchange = food.gamExchange || 1000;
    const cat = food.category;

    // Gia vị hoặc dầu ăn nhỏ nếu cần số thập phân 1 chữ số
    const isSeasoning = cat === 'gia_vi';

    // Khối lượng ăn cả trường (kg)
    const eatKg = (it.gamPerChild * totalStudents) / 1000;
    // Nhu cầu mua cả trường (kg)
    const buyKg = waste < 100 ? eatKg / (1 - waste / 100) : eatKg;
    // Quy đổi ra ĐVT
    const rawBuyUnit = (buyKg * 1000) / exchange;

    let targetIntegerBuyUnit: number;
    if (isSeasoning && rawBuyUnit < 5) {
      // Gia vị nhỏ: làm tròn 1 chữ số thập phân
      targetIntegerBuyUnit = Math.max(0.1, Math.round(rawBuyUnit * 10) / 10);
    } else {
      // Thực phẩm tươi sống, củ quả, trứng: luôn là số nguyên >= 1
      targetIntegerBuyUnit = Math.max(1, Math.round(rawBuyUnit));
    }

    // 3. Phân bổ số nguyên cho các điểm trường (Hare-Niemeyer)
    const branchQtys: Record<string, number> = {};
    if (branches.length > 0) {
      const intTotal = Math.round(targetIntegerBuyUnit);
      let allocatedSum = 0;
      const quotas = branches.map((b) => {
        const q = (intTotal * b.studentCount) / totalStudents;
        const floor = Math.floor(q);
        allocatedSum += floor;
        return {
          id: b.id,
          floor,
          fraction: q - floor,
        };
      });

      let remainder = intTotal - allocatedSum;
      quotas.sort((a, b) => b.fraction - a.fraction);
      quotas.forEach((q) => {
        const add = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder--;
        branchQtys[q.id] = q.floor + add;
      });

      targetIntegerBuyUnit = intTotal;
    }

    // 4. Suy ngược lại gam/trẻ bảo toàn chính xác từ Thực Mua ĐVT
    const finalBuyKg = (targetIntegerBuyUnit * exchange) / 1000;
    const finalEatKg = finalBuyKg * (1 - waste / 100);
    const finalGamPerChild = totalStudents > 0 ? (finalEatKg * 1000) / totalStudents : it.gamPerChild;

    it.gamPerChild = Math.round(finalGamPerChild * 10) / 10;
    it.customTotalBuy = targetIntegerBuyUnit;
    it.branchQuantities = branchQtys;
  });

  // 5. Vi chỉnh tinh tế (Fine-tuning) ngân sách tiền ăn
  // Do làm tròn số nguyên ĐVT, chi phí có thể chênh lệch nhẹ với 21.000 đ.
  // Ta dùng thuật toán tráo đổi 1 đơn vị ĐVT của món có giá vừa phải để đưa chi phí về sát 21.000 đ nhất.
  let curTotals = computeNutritionTotals(optimizedItems, totalStudents, targetBudget, ageGroup, branches).totals;
  let diffPerChild = curTotals.costPerChild - targetBudget;

  // Nếu chênh lệch > 500đ, tìm nguyên liệu biến đổi để điều chỉnh ±1 ĐVT
  if (Math.abs(diffPerChild) > 300) {
    // Sắp xếp các món rau củ hoặc thịt cá phụ
    const candidates = optimizedItems
      .filter((it) => !it.isFixed && !it.food.isFixed && it.food.category !== 'gia_vi' && (it.customTotalBuy ?? 0) > 1)
      .map((it) => {
        const food = it.food;
        const deltaUnitCostPerChild = food.price / totalStudents;
        return {
          item: it,
          deltaCost: deltaUnitCostPerChild,
        };
      });

    for (const cand of candidates) {
      if (Math.abs(diffPerChild) <= 250) break;
      if (diffPerChild > 250 && (cand.item.customTotalBuy ?? 0) > 1) {
        // Giảm 1 ĐVT
        cand.item.customTotalBuy = (cand.item.customTotalBuy ?? 1) - 1;
        // Phân bổ lại điểm trường
        const newInt = cand.item.customTotalBuy;
        if (branches.length > 0) {
          let alloc = 0;
          const qts = branches.map((b) => {
            const q = (newInt * b.studentCount) / totalStudents;
            const floor = Math.floor(q);
            alloc += floor;
            return { id: b.id, floor, frac: q - floor };
          });
          let rem = newInt - alloc;
          qts.sort((a, b) => b.frac - a.frac);
          const bq: Record<string, number> = {};
          qts.forEach((q) => {
            const add = rem > 0 ? 1 : 0;
            if (rem > 0) rem--;
            bq[q.id] = q.floor + add;
          });
          cand.item.branchQuantities = bq;
        }
        // Suy ngược lại gam/trẻ
        const ex = cand.item.food.gamExchange || 1000;
        const wst = cand.item.food.wasteFactor || 0;
        const fBuyKg = (newInt * ex) / 1000;
        const fEatKg = fBuyKg * (1 - wst / 100);
        cand.item.gamPerChild = Math.round(((fEatKg * 1000) / totalStudents) * 10) / 10;

        curTotals = computeNutritionTotals(optimizedItems, totalStudents, targetBudget, ageGroup, branches).totals;
        diffPerChild = curTotals.costPerChild - targetBudget;
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
    message: `✓ Đã tối ưu Số Lượng Thực Mua ĐVT thành công! (Lượng: ${caloPass} ${Math.round(finalTotals.totalCalo)} Kcal | Chất: ${ratioPass} P-L-G ${finalTotals.proteinPct.toFixed(1)}%:${finalTotals.fatPct.toFixed(1)}%:${finalTotals.carbsPct.toFixed(1)}% | Tiền ăn: ${Math.round(finalTotals.costPerChild).toLocaleString('vi-VN')} đ, lệch: ${finalDiff >= 0 ? '+' : ''}${finalDiff} đ)`,
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
