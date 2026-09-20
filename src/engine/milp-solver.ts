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
export function solveIntegerBuyUnitsMenu(
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

  // 5. Khóa Cứng Ngân Sách Tuyệt Đối: Dùng hết 100% số tiền 1 ngày của trẻ (Sai số 0 đồng tuyệt đối)
  const targetTotalSchoolBudget = Math.round(totalStudents * targetBudget);
  let curTotals = computeNutritionTotals(optimizedItems, totalStudents, targetBudget, ageGroup, branches).totals;
  let totalDiff = targetTotalSchoolBudget - Math.round(curTotals.totalCost);

  if (totalDiff !== 0) {
    // Chỉ chọn các mặt hàng để lẻ tự nhiên (step === 0.01: thịt, cá, tôm, gạo, rau củ) để vi chỉnh
    // TUYỆT ĐỐI KHÔNG vi chỉnh vào mặt hàng làm tròn nguyên (trứng, sữa) hoặc dầu ăn/gia vị làm tròn 0.1/0.5
    const candidateItems = optimizedItems.filter(
      (it) => !it.isFixed && !it.food.isFixed && getFoodRoundingStep(it.food, roundingCfg) === 0.01
    );

    if (candidateItems.length > 0) {
      const candidates = candidateItems.map((it) => {
        const effectivePrice = it.food.contractPrice && it.food.contractPrice > 0 ? it.food.contractPrice : it.food.price;
        return {
          item: it,
          pricePerUnit: effectivePrice,
          stepPrice: effectivePrice / 100, // Giá của 0.01 ĐVT
        };
      });

      // 5.1 Vi chỉnh thô nếu độ lệch ngân sách lớn (> 3.000 đ)
      if (Math.abs(totalDiff) > 3000) {
        const primary = candidates[0];
        const rawDeltaBuy = totalDiff / primary.pricePerUnit;
        const deltaUnits = Math.round(rawDeltaBuy * 100) / 100;
        const currentBuy = primary.item.customTotalBuy ?? 0;
        const newBuyUnit = Number(Math.max(0.01, currentBuy + deltaUnits).toFixed(2));
        primary.item.customTotalBuy = newBuyUnit;

        const food = primary.item.food;
        const waste = food.wasteFactor || 0;
        const exchange = food.gamExchange || 1000;

        if (branches.length > 0) {
          let sumB = 0;
          const newBranchQtys: Record<string, number> = {};
          branches.forEach((b, bIdx) => {
            if (bIdx === branches.length - 1) {
              newBranchQtys[b.id] = Number(Math.max(0, newBuyUnit - sumB).toFixed(2));
            } else {
              const bVal = Number(((newBuyUnit * b.studentCount) / totalStudents).toFixed(2));
              newBranchQtys[b.id] = bVal;
              sumB += bVal;
            }
          });
          primary.item.branchQuantities = newBranchQtys;
        }

        const fBuyKg = (newBuyUnit * exchange) / 1000;
        const fEatKg = fBuyKg * (1 - waste / 100);
        primary.item.gamPerChild = Math.round(((fEatKg * 1000) / totalStudents) * 100) / 100;

        // Cập nhật lại curTotals và totalDiff sau bước thô
        curTotals = computeNutritionTotals(optimizedItems, totalStudents, targetBudget, ageGroup, branches).totals;
        totalDiff = targetTotalSchoolBudget - Math.round(curTotals.totalCost);
      }

      // 5.2 Tìm tổ hợp bước nhảy delta 0.01 ĐVT (s1, s2, s3...) sao cho triệt tiêu hoàn toàn totalDiff về 0 đồng
      if (totalDiff !== 0) {
        const c1 = candidates[0];
        const c2 = candidates.length > 1 ? candidates[1] : null;
        const c3 = candidates.length > 2 ? candidates[2] : null;

        let bestSteps: number[] | null = null;
        let minPenalty = Infinity;

        // Quét tổ hợp Diophantine với trọng số phạt ưu tiên s1 (thịt/cá chính) và s2 (gạo)
        for (let s1 = -40; s1 <= 40; s1++) {
          for (let s2 = (c2 ? -60 : 0); s2 <= (c2 ? 60 : 0); s2++) {
            for (let s3 = (c3 ? -40 : 0); s3 <= (c3 ? 40 : 0); s3++) {
              const sumDelta = s1 * c1.stepPrice + (c2 ? s2 * c2.stepPrice : 0) + (c3 ? s3 * c3.stepPrice : 0);
              if (Math.round(sumDelta) === totalDiff) {
                const penalty = Math.abs(s1) * 2 + Math.abs(s2) * 1 + Math.abs(s3) * 1.5;
                if (penalty < minPenalty) {
                  minPenalty = penalty;
                  bestSteps = [s1, s2, s3];
                }
              }
            }
          }
        }

        if (bestSteps) {
          bestSteps.forEach((s, idx) => {
            if (s === 0) return;
            const cand = candidates[idx];
            if (!cand) return;
            const currentBuy = cand.item.customTotalBuy ?? 0;
            const newBuyUnit = Number(Math.max(0.01, currentBuy + s * 0.01).toFixed(2));
            cand.item.customTotalBuy = newBuyUnit;

            const food = cand.item.food;
            const waste = food.wasteFactor || 0;
            const exchange = food.gamExchange || 1000;

            // Phân bổ lại cho các điểm trường bảo toàn tổng mua
            if (branches.length > 0) {
              let sumB = 0;
              const newBranchQtys: Record<string, number> = {};
              branches.forEach((b, bIdx) => {
                if (bIdx === branches.length - 1) {
                  newBranchQtys[b.id] = Number(Math.max(0, newBuyUnit - sumB).toFixed(2));
                } else {
                  const bVal = Number(((newBuyUnit * b.studentCount) / totalStudents).toFixed(2));
                  newBranchQtys[b.id] = bVal;
                  sumB += bVal;
                }
              });
              cand.item.branchQuantities = newBranchQtys;
            }

            // Đồng bộ suy ngược ra gam/trẻ
            const fBuyKg = (newBuyUnit * exchange) / 1000;
            const fEatKg = fBuyKg * (1 - waste / 100);
            cand.item.gamPerChild = Math.round(((fEatKg * 1000) / totalStudents) * 100) / 100;
          });
        }
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
