import highsLoader from 'highs';
import { AgeGroup, MenuItem } from '../types/nutrition';
import { computeNutritionTotals } from './atwater';
import { getFoodRoundingStep, SolverOptions, SolverResult } from './milp-solver';

// Kiểu trả về từ HiGHS WASM
interface HighsSolution {
  Status: string;
  ObjectiveValue?: number;
  Columns: Record<
    string,
    {
      Index: number;
      Lower: number;
      Upper: number;
      Type: string;
      Primal: number;
      Name: string;
    }
  >;
}

interface HighsInstance {
  solve: (problem: string) => HighsSolution;
}

class HighsManager {
  private static instance: HighsInstance | null = null;
  private static isLoading = false;
  private static loadPromise: Promise<HighsInstance | null> | null = null;

  public static async getInstance(): Promise<HighsInstance | null> {
    if (this.instance) return this.instance;
    if (this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    this.loadPromise = (async () => {
      try {
        const loaded = await highsLoader();
        this.instance = loaded as unknown as HighsInstance;
        return this.instance;
      } catch (err) {
        console.warn('HiGHS WASM loader warning: falling back to TS engine.', err);
        return null;
      } finally {
        this.isLoading = false;
      }
    })();

    return this.loadPromise;
  }

  public static isReady(): boolean {
    return this.instance !== null;
  }
}

/**
 * Giải bài toán Cân đối thực đơn & Thực mua ĐVT chuẩn công nghiệp bằng HiGHS WASM MILP Solver
 */
export async function solveHighsNutritionMenu(
  items: MenuItem[],
  studentCount: number,
  ageGroup: AgeGroup = 'maugiao',
  options: SolverOptions = {}
): Promise<SolverResult> {
  const startTime = performance.now();
  const highs = await HighsManager.getInstance();

  if (!highs) {
    throw new Error('HiGHS WASM is not available in current environment');
  }

  const isMG = ageGroup === 'maugiao';
  const targetBudget = Math.round(options.targetBudgetPerChild || 21000);
  const totalBudget = studentCount * targetBudget;

  const targetCalo = options.targetCalo || (isMG ? 665 : 620);
  const targetP_pct = options.targetProteinPct || (isMG ? 14.5 : 14.0);
  const targetL_pct = options.targetFatPct || (isMG ? 28.0 : 32.0);
  const targetG_pct = options.targetCarbsPct || (isMG ? 57.5 : 54.0);

  const targetP_g = (targetCalo * (targetP_pct / 100)) / 4;
  const targetL_g = (targetCalo * (targetL_pct / 100)) / 9;
  const targetG_g = (targetCalo * (targetG_pct / 100)) / 4;

  const initial = computeNutritionTotals(items, studentCount, targetBudget, ageGroup);
  const originalCost = initial.totals.costPerChild;
  const originalCalo = initial.totals.totalCalo;

  const objTerms: string[] = [];
  const subjectToLines: string[] = [];
  const boundsLines: string[] = [];
  const generalVars: string[] = [];

  // Biến chênh lệch mục tiêu vĩ mô (Slacks)
  objTerms.push('100 e_plus + 100 e_minus');
  objTerms.push('800 p_plus + 800 p_minus');
  objTerms.push('800 l_plus + 800 l_minus');
  objTerms.push('300 g_plus + 300 g_minus');

  boundsLines.push('0 <= e_plus', '0 <= e_minus');
  boundsLines.push('0 <= p_plus', '0 <= p_minus');
  boundsLines.push('0 <= l_plus', '0 <= l_minus');
  boundsLines.push('0 <= g_plus', '0 <= g_minus');

  const budgetLineTerms: string[] = [];
  const caloLineTerms: string[] = [];
  const protLineTerms: string[] = [];
  const fatLineTerms: string[] = [];
  const carbLineTerms: string[] = [];
  const plantFatLineTerms: string[] = [];
  const animalProtLineTerms: string[] = [];

  items.forEach((it, idx) => {
    const food = it.food;
    const varName = `x_${idx}`;
    const effectivePrice = Math.round(food.contractPrice && food.contractPrice > 0 ? food.contractPrice : food.price);

    budgetLineTerms.push(`${effectivePrice} ${varName}`);

    const waste = food.wasteFactor || 0;
    const exchange = food.gamExchange || 1000;
    // 1 ĐVT mua cung cấp số gam ăn được trên mỗi trẻ:
    const gPerUnit = (exchange * (1 - waste / 100)) / studentCount;

    const pPerUnit = gPerUnit * (food.protein100g / 100);
    const fPerUnit = gPerUnit * (food.fat100g / 100);
    const cPerUnit = gPerUnit * (food.carbs100g / 100);
    const caloPerUnit = pPerUnit * 4 + fPerUnit * 9 + cPerUnit * 4;

    caloLineTerms.push(`${caloPerUnit.toFixed(6)} ${varName}`);
    protLineTerms.push(`${pPerUnit.toFixed(6)} ${varName}`);
    fatLineTerms.push(`${fPerUnit.toFixed(6)} ${varName}`);
    carbLineTerms.push(`${cPerUnit.toFixed(6)} ${varName}`);

    // Béo thực vật: fat_plant - 0.45 * total_fat >= 0
    const isPlantFat = !food.isAnimalFat;
    const plantF = isPlantFat ? fPerUnit : 0;
    plantFatLineTerms.push(`${(plantF - 0.45 * fPerUnit).toFixed(6)} ${varName}`);

    // Đạm động vật: prot_animal - 0.50 * total_prot >= 0
    const animalP = food.isAnimalProtein ? pPerUnit : 0;
    animalProtLineTerms.push(`${(animalP - 0.50 * pPerUnit).toFixed(6)} ${varName}`);

    const step = getFoodRoundingStep(food, options.roundingConfig);

    // Tính lượng mua ban đầu (hoặc từ gamPerChild)
    const initEatKg = (it.gamPerChild * studentCount) / 1000;
    const initBuyKg = waste < 100 ? initEatKg / (1 - waste / 100) : initEatKg;
    const rawBuyUnit = it.customTotalBuy !== undefined && it.customTotalBuy > 0
      ? it.customTotalBuy
      : (initBuyKg * 1000) / exchange;
    const origBuy = Number(Math.max(step, rawBuyUnit).toFixed(2));

    // Phạt biến động so với thực đơn gốc (bảo toàn cấu trúc & khẩu vị món ăn)
    const devPlus = `dp_${idx}`;
    const devMinus = `dm_${idx}`;
    const weight = Number((15 / Math.max(1, origBuy)).toFixed(4));
    objTerms.push(`${weight} ${devPlus} + ${weight} ${devMinus}`);
    boundsLines.push(`0 <= ${devPlus}`, `0 <= ${devMinus}`);
    subjectToLines.push(`dev_${idx}: ${varName} - ${devPlus} + ${devMinus} = ${origBuy}`);

    const unitLower = food.unit.toLowerCase();
    const isUnitDiscrete = unitLower === 'hộp' || unitLower === 'quả';
    const isFixedItem = it.isFixed || food.isFixed;

    // Thiết lập biên và bước nhảy rời rạc
    if (isFixedItem) {
      boundsLines.push(`${origBuy} <= ${varName} <= ${origBuy}`);
      if (step >= 1) generalVars.push(varName);
    } else if (isUnitDiscrete && origBuy >= studentCount * 0.8) {
      // Sữa / trứng đóng hộp tính đúng 1 hộp/trẻ
      boundsLines.push(`${studentCount} <= ${varName} <= ${studentCount}`);
      generalVars.push(varName);
    } else if (step >= 1) {
      // Nhóm số nguyên (Sữa, Trứng)
      boundsLines.push(`${step} <= ${varName} <= ${Math.max(step * 2, Math.round(origBuy * 2.5))}`);
      generalVars.push(varName);
    } else if (step === 0.5) {
      // Dầu ăn (0.5 lít)
      const yVar = `y_${idx}`;
      subjectToLines.push(`step_${idx}: ${varName} - 0.5 ${yVar} = 0`);
      boundsLines.push(`0.5 <= ${varName} <= ${Math.max(5, Math.round(origBuy * 3))}`);
      boundsLines.push(`1 <= ${yVar}`);
      generalVars.push(yVar);
    } else if (step === 0.1) {
      // Gia vị, Nước mắm (0.1)
      const yVar = `y_${idx}`;
      subjectToLines.push(`step_${idx}: ${varName} - 0.1 ${yVar} = 0`);
      boundsLines.push(`0.1 <= ${varName} <= ${Math.max(2, Math.round(origBuy * 3))}`);
      boundsLines.push(`1 <= ${yVar}`);
      generalVars.push(yVar);
    } else {
      // Thịt, cá, rau, củ, quả, gạo (bước lẻ 0.01)
      const yVar = `y_${idx}`;
      subjectToLines.push(`step_${idx}: ${varName} - 0.01 ${yVar} = 0`);
      boundsLines.push(`0.01 <= ${varName} <= ${Math.max(1, Number((origBuy * 3).toFixed(2)))}`);
      boundsLines.push(`1 <= ${yVar}`);
      generalVars.push(yVar);
    }
  });

  // Ràng buộc ngân sách cứng 100% (0đ chênh lệch)
  subjectToLines.push(`budget: ${budgetLineTerms.join(' + ')} = ${totalBudget}`);

  // Ràng buộc hội tụ Calo và P-L-G
  subjectToLines.push(`calo_target: ${caloLineTerms.join(' + ')} - e_plus + e_minus = ${targetCalo.toFixed(2)}`);
  subjectToLines.push(`prot_target: ${protLineTerms.join(' + ')} - p_plus + p_minus = ${targetP_g.toFixed(2)}`);
  subjectToLines.push(`fat_target: ${fatLineTerms.join(' + ')} - l_plus + l_minus = ${targetL_g.toFixed(2)}`);
  subjectToLines.push(`carb_target: ${carbLineTerms.join(' + ')} - g_plus + g_minus = ${targetG_g.toFixed(2)}`);

  // Trần sàn dinh dưỡng theo Thông tư 51/2020 & QĐ 2195
  subjectToLines.push(`calo_min: ${caloLineTerms.join(' + ')} >= ${isMG ? 615 : 600}`);
  subjectToLines.push(`calo_max: ${caloLineTerms.join(' + ')} <= ${isMG ? 738 : 651}`);

  // Ràng buộc tỷ lệ nguồn gốc
  subjectToLines.push(`plant_fat: ${plantFatLineTerms.join(' + ')} >= 0`);
  subjectToLines.push(`animal_prot: ${animalProtLineTerms.join(' + ')} >= 0`);

  const lpContent = [
    'Minimize',
    ' obj: ' + objTerms.join(' + '),
    'Subject To',
    subjectToLines.map((l) => ' ' + l).join('\n'),
    'Bounds',
    boundsLines.map((b) => ' ' + b).join('\n'),
    'General',
    generalVars.map((v) => ' ' + v).join('\n'),
    'End',
  ].join('\n');

  const sol = highs.solve(lpContent);

  if (sol.Status !== 'Optimal') {
    throw new Error(`HiGHS MILP solver returned status: ${sol.Status}`);
  }

  // Chuyển đổi nghiệm tối ưu về danh sách MenuItem
  const optimizedItems: MenuItem[] = items.map((it, idx) => {
    const varName = `x_${idx}`;
    const rawVal = sol.Columns[varName]?.Primal ?? 0;
    const step = getFoodRoundingStep(it.food, options.roundingConfig);

    let finalBuyUnit: number;
    if (step >= 1) {
      finalBuyUnit = Math.round(rawVal);
    } else if (step === 0.5) {
      finalBuyUnit = Math.round(rawVal * 2) / 2;
    } else if (step === 0.1) {
      finalBuyUnit = Math.round(rawVal * 10) / 10;
    } else {
      finalBuyUnit = Math.round(rawVal * 100) / 100;
    }

    const food = it.food;
    const waste = food.wasteFactor || 0;
    const exchange = food.gamExchange || 1000;
    const fBuyKg = (finalBuyUnit * exchange) / 1000;
    const fEatKg = fBuyKg * (1 - waste / 100);
    const finalGam = studentCount > 0 ? (fEatKg * 1000) / studentCount : it.gamPerChild;

    return {
      ...it,
      customTotalBuy: finalBuyUnit,
      gamPerChild: Math.round(finalGam * 100) / 100,
    };
  });

  // Hàm giải nghiệm nguyên Diophantine bù trừ sai số dấu phẩy động
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

  // Khóa cứng 0đ sai số ngân sách
  const candidateItems = optimizedItems
    .filter((it) => !it.isFixed && !it.food.isFixed && getFoodRoundingStep(it.food, options.roundingConfig) === 0.01)
    .map((it) => {
      const p = it.food.contractPrice && it.food.contractPrice > 0 ? it.food.contractPrice : it.food.price;
      return { item: it, stepPrice: p / 100 };
    })
    .sort((a, b) => b.stepPrice - a.stepPrice);

  const curTotalCost = Math.round(
    optimizedItems.reduce((s, it) => {
      const p = it.food.contractPrice && it.food.contractPrice > 0 ? it.food.contractPrice : it.food.price;
      return s + (it.customTotalBuy ?? 0) * p;
    }, 0)
  );
  const diff = totalBudget - curTotalCost;
  if (diff !== 0 && candidateItems.length > 0) {
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
        d.item.gamPerChild = Math.round(((fEatKg * 1000) / studentCount) * 10) / 10;
      });
    }
  }

  const finalTotals = computeNutritionTotals(optimizedItems, studentCount, targetBudget, ageGroup).totals;
  const runtimeMs = Math.round(performance.now() - startTime);
  const diffPerChild = Math.round(finalTotals.costPerChild - targetBudget);

  const caloPass = finalTotals.isCaloPass ? 'Đạt' : 'Chưa đạt';
  const ratioPass = finalTotals.isRatioPass ? 'Cân đối' : 'Cần chỉnh';

  return {
    success: true,
    message: `✓ [HiGHS WASM MILP] Đã tối ưu hóa chuẩn công nghiệp! (Lượng: ${caloPass} ${Math.round(finalTotals.totalCalo)} Kcal | Chất: ${ratioPass} P-L-G ${finalTotals.proteinPct.toFixed(1)}%:${finalTotals.fatPct.toFixed(1)}%:${finalTotals.carbsPct.toFixed(1)}% | Tiền ăn: ${Math.round(finalTotals.costPerChild).toLocaleString('vi-VN')} đ, lệch: ${diffPerChild >= 0 ? '+' : ''}${diffPerChild} đ)`,
    items: optimizedItems,
    iterations: 1,
    runtimeMs,
    originalCost,
    optimizedCost: finalTotals.costPerChild,
    originalCalo,
    optimizedCalo: finalTotals.totalCalo,
    budgetDifferencePerChild: diffPerChild,
  };
}
