import { ComputedMenuItem, MenuItem, NutritionTotals, AgeGroup, MealCaloEvaluation, MealSession, SchoolBranch } from '../types/nutrition';

/**
 * Tính toán dinh dưỡng chi tiết cho từng nguyên liệu trong thực đơn theo hệ số Atwater
 * Hệ số bảo toàn năng lượng:
 * Calo = (Protein * 4) + (Lipid * 9) + (Glucid * 4)
 */
export function computeMenuItem(
  item: MenuItem,
  studentCount: number,
  branches?: SchoolBranch[]
): ComputedMenuItem {
  const { food, gamPerChild } = item;
  const waste = food.wasteFactor || 0;

  // Khối lượng thực ăn cho cả trường (kg)
  const actualEatKg = (gamPerChild * studentCount) / 1000;

  // Khối lượng tổng nhu cầu thô tính theo hệ số thải bỏ (kg)
  const grossNeedKg = waste < 100 ? actualEatKg / (1 - waste / 100) : actualEatKg;

  // Tự động nhận diện thực phẩm kho khô nếu chưa gán
  if (food.isWarehouseItem === undefined) {
    food.isWarehouseItem = food.category === 'gao' || food.category === 'gia_vi' || food.category === 'dau_mo';
  }

  // Trừ tồn kho khả dụng (nếu có) để tính lượng thực tế đi chợ mua mới
  const availableInv = item.availableInventoryKg || 0;
  const inventoryDeductedKg = Math.min(grossNeedKg, availableInv);
  let actualBuyKg = Math.max(0, grossNeedKg - inventoryDeductedKg);

  // Làm tròn theo bước nhảy thương mại nếu có cấu hình stepSize
  const step = food.stepSize || 0;
  if (step > 0 && actualBuyKg > 0) {
    const unitLower = food.unit.toLowerCase();
    if (unitLower === 'quả' || unitLower === 'hộp') {
      const unitsRaw = (actualBuyKg * 1000) / (food.gamExchange || 1000);
      const roundedUnits = Math.round(unitsRaw / step) * step;
      actualBuyKg = (roundedUnits * (food.gamExchange || 1000)) / 1000;
    } else {
      actualBuyKg = Math.round(actualBuyKg / step) * step;
    }
  }

  // Quy đổi thực mua theo Đơn vị tính (ĐVT)
  let actualBuyUnit = food.gamExchange > 0 
    ? (actualBuyKg * 1000) / food.gamExchange 
    : actualBuyKg;

  // Phân bổ cho từng điểm trường (Đ1, Đ2...) - Yêu cầu: Thực mua ở điểm trường luôn là số nguyên
  const branchBuyUnits: Record<string, number> = {};
  if (branches && branches.length > 0) {
    let sumBranches = 0;
    branches.forEach((b) => {
      if (item.branchQuantities && item.branchQuantities[b.id] !== undefined) {
        branchBuyUnits[b.id] = Math.round(item.branchQuantities[b.id]);
      } else {
        const ratio = studentCount > 0 ? b.studentCount / studentCount : 0;
        const rawVal = actualBuyUnit * ratio;
        // Thực mua tại điểm trường luôn là số nguyên
        branchBuyUnits[b.id] = Math.round(rawVal);
      }
      sumBranches += branchBuyUnits[b.id];
    });

    // Cập nhật tổng thực mua theo số nguyên của các điểm trường
    actualBuyUnit = sumBranches;
    actualBuyKg = food.gamExchange > 0 ? (actualBuyUnit * food.gamExchange) / 1000 : actualBuyUnit;
  }

  // Thành tiền cả trường
  const totalPrice = actualBuyUnit * food.price;

  // Dinh dưỡng tính trên 1 trẻ (gamPerChild / 100)
  const factor = gamPerChild / 100;
  const pTotal = food.protein100g * factor;
  const fTotal = food.fat100g * factor;
  const carbs = food.carbs100g * factor;

  const proteinAnimal = food.isAnimalProtein ? pTotal : 0;
  const proteinPlant = !food.isAnimalProtein ? pTotal : 0;

  const fatAnimal = food.isAnimalFat ? fTotal : 0;
  const fatPlant = !food.isAnimalFat ? fTotal : 0;

  // Calo Atwater bảo toàn
  const calo = (pTotal * 4) + (fTotal * 9) + (carbs * 4);

  const sodiumMg = (food.sodiumMg || 0) * factor;
  const calciumMg = (food.calciumMg || 0) * factor;
  const phosphorusMg = (food.phosphorusMg ?? Math.round((food.protein100g * 14) + ((food.calciumMg || 0) * 0.75))) * factor;
  const ironMg = (food.ironMg || 0) * factor;
  const vitaminB1Mg = (food.vitaminB1Mg || 0) * factor;
  const vitaminCMg = (food.vitaminCMg || 0) * factor;

  return {
    ...item,
    actualEatKg,
    actualBuyKg,
    inventoryDeductedKg,
    actualBuyUnit,
    branchBuyUnits,
    unitPrice: food.price,
    totalPrice,
    proteinAnimal,
    proteinPlant,
    fatAnimal,
    fatPlant,
    carbs,
    calo,
    sodiumMg,
    calciumMg,
    phosphorusMg,
    ironMg,
    vitaminB1Mg,
    vitaminCMg,
  };
}

/**
 * Tổng hợp toàn bộ dinh dưỡng của thực đơn trong ngày và kiểm toán theo QĐ 2195 & TT 51/2020
 */
export function computeNutritionTotals(
  items: MenuItem[],
  studentCount: number,
  budgetPerChild: number,
  ageGroup: AgeGroup = 'maugiao',
  branches?: SchoolBranch[]
): { computedItems: ComputedMenuItem[]; totals: NutritionTotals } {
  const computedItems = items.map((it) => computeMenuItem(it, studentCount, branches));

  let totalCost = 0;
  let proteinAnimalG = 0;
  let proteinPlantG = 0;
  let fatAnimalG = 0;
  let fatPlantG = 0;
  let carbsG = 0;
  let totalSodiumMg = 0;
  let freeSugarCalo = 0;
  let calciumMg = 0;
  let phosphorusMg = 0;
  let ironMg = 0;
  let vitaminB1Mg = 0;
  let vitaminCMg = 0;

  for (const c of computedItems) {
    totalCost += c.totalPrice;
    proteinAnimalG += c.proteinAnimal;
    proteinPlantG += c.proteinPlant;
    fatAnimalG += c.fatAnimal;
    fatPlantG += c.fatPlant;
    carbsG += c.carbs;
    totalSodiumMg += c.sodiumMg;

    if (c.food.isFreeSugar) {
      freeSugarCalo += c.carbs * 4;
    }

    calciumMg += c.calciumMg;
    phosphorusMg += c.phosphorusMg;
    ironMg += c.ironMg;
    vitaminB1Mg += c.vitaminB1Mg;
    vitaminCMg += c.vitaminCMg;
  }

  const totalProteinG = proteinAnimalG + proteinPlantG;
  const totalFatG = fatAnimalG + fatPlantG;

  // Năng lượng Atwater tuyệt đối
  const totalCalo = (totalProteinG * 4) + (totalFatG * 9) + (carbsG * 4);

  // Cơ cấu % P - L - G
  const proteinPct = totalCalo > 0 ? ((totalProteinG * 4) / totalCalo) * 100 : 0;
  const fatPct = totalCalo > 0 ? ((totalFatG * 9) / totalCalo) * 100 : 0;
  const carbsPct = totalCalo > 0 ? ((carbsG * 4) / totalCalo) * 100 : 0;

  // Tỷ lệ nguồn gốc
  const animalProteinRatio = totalProteinG > 0 ? (proteinAnimalG / totalProteinG) * 100 : 0;
  const plantFatRatio = totalFatG > 0 ? (fatPlantG / totalFatG) * 100 : 0;

  // QĐ 2195: Tỷ lệ Canxi / Photpho (Ca:P)
  const calciumPhosphorusRatio = phosphorusMg > 0 ? calciumMg / phosphorusMg : 1.0;

  // QĐ 2195: Tỷ lệ năng lượng từ đường tự do
  const freeSugarCaloPct = totalCalo > 0 ? (freeSugarCalo / totalCalo) * 100 : 0;

  // Tài chính
  const totalBudget = studentCount * budgetPerChild;
  const costPerChild = studentCount > 0 ? totalCost / studentCount : 0;
  const budgetDifference = totalBudget - totalCost; // Dương: còn dư, Âm: bội chi
  const costPerCalo = totalCalo > 0 ? costPerChild / totalCalo : 0;

  // Tiêu chuẩn theo lứa tuổi
  const isMauGiao = ageGroup === 'maugiao';
  const caloMin = isMauGiao ? 615 : 600;
  const caloMax = isMauGiao ? 738 : 651;

  const isCaloPass = totalCalo >= caloMin && totalCalo <= caloMax;
  const isRatioPass = isMauGiao
    ? proteinPct >= 13 && proteinPct <= 20 && fatPct >= 25 && fatPct <= 35 && carbsPct >= 52 && carbsPct <= 60
    : proteinPct >= 13 && proteinPct <= 20 && fatPct >= 30 && fatPct <= 40 && carbsPct >= 50 && carbsPct <= 60;

  const isAnimalProteinPass = animalProteinRatio >= 50;
  const isPlantFatPass = plantFatRatio >= 45;
  const isSodiumPass = totalSodiumMg <= (isMauGiao ? 1200 : 1000);
  const isSugarPass = freeSugarCaloPct <= 10.0;
  const isCaPRatioPass = calciumPhosphorusRatio >= 0.7 && calciumPhosphorusRatio <= 1.5;
  const isIronPass = ironMg >= (isMauGiao ? 3.5 : 2.8);

  const compliancePassed =
    isCaloPass &&
    isRatioPass &&
    isAnimalProteinPass &&
    isPlantFatPass &&
    isSodiumPass &&
    isSugarPass &&
    isCaPRatioPass &&
    isIronPass;

  return {
    computedItems,
    totals: {
      studentCount,
      budgetPerChild,
      totalBudget,
      totalCost,
      costPerChild,
      budgetDifference,
      proteinAnimalG,
      proteinPlantG,
      totalProteinG,
      fatAnimalG,
      fatPlantG,
      totalFatG,
      carbsG,
      totalCalo,
      proteinPct,
      fatPct,
      carbsPct,
      animalProteinRatio,
      plantFatRatio,
      totalSodiumMg,
      freeSugarCaloPct,
      costPerCalo,
      calciumMg,
      phosphorusMg,
      calciumPhosphorusRatio,
      ironMg,
      vitaminB1Mg,
      vitaminCMg,
      isCaloPass,
      isRatioPass,
      isAnimalProteinPass,
      isPlantFatPass,
      isSodiumPass,
      isSugarPass,
      isCaPRatioPass,
      isIronPass,
      compliancePassed,
    },
  };
}

/**
 * Đánh giá tỷ lệ calo từng bữa ăn theo chuẩn QLMN & TT 51/2020
 */
export function evaluateMealCaloDistribution(
  computedItems: ComputedMenuItem[],
  totalCalo: number,
  ageGroup: AgeGroup = 'maugiao'
): MealCaloEvaluation[] {
  const isMG = ageGroup === 'maugiao';
  const fullDayCalo = isMG ? 1300 : 1000;

  const sessions: {
    session: MealSession;
    sessionLabel: string;
    standardMinPct: number;
    standardMaxPct: number;
  }[] = [
    { session: 'sang', sessionLabel: 'Bữa sáng', standardMinPct: 15, standardMaxPct: 20 },
    { session: 'chinh_trua', sessionLabel: 'Bữa trưa', standardMinPct: 30, standardMaxPct: 35 },
    { session: 'xe', sessionLabel: 'Bữa xế', standardMinPct: 25, standardMaxPct: 30 },
    { session: 'phu_trua', sessionLabel: 'Bữa phụ', standardMinPct: 5, standardMaxPct: 10 },
  ];

  const caloMap: Record<string, number> = {
    sang: 0,
    chinh_trua: 0,
    phu_trua: 0,
    xe: 0,
    phu_xe: 0,
  };

  for (const it of computedItems) {
    caloMap[it.mealSession] = (caloMap[it.mealSession] || 0) + it.calo;
  }

  return sessions.map((s) => {
    const sessionCalo = caloMap[s.session] || 0;
    const actualPct = Math.round((sessionCalo / fullDayCalo) * 10000) / 100;
    const caloSharePct = totalCalo > 0 ? Math.round((sessionCalo / totalCalo) * 10000) / 100 : 0;
    const isPass = actualPct >= s.standardMinPct && actualPct <= s.standardMaxPct;

    return {
      session: s.session,
      sessionLabel: s.sessionLabel,
      calo: Math.round(sessionCalo * 10) / 10,
      actualPct,
      standardMinPct: s.standardMinPct,
      standardMaxPct: s.standardMaxPct,
      caloSharePct,
      isPass,
    };
  });
}
