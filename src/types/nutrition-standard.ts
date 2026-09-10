import { AgeGroup } from './nutrition';

export interface MacroNutrientRatio {
  proteinPctMin: number; // 13%
  proteinPctMax: number; // 20%
  fatPctMin: number; // 25% (MG) hoặc 30% (NT)
  fatPctMax: number; // 35% (MG) hoặc 40% (NT)
  carbsPctMin: number; // 52% (MG) hoặc 50% (NT)
  carbsPctMax: number; // 60%
}

export interface MealBudgetRatio {
  lunchPct: number; // Bữa chính trưa: VD 65%
  afternoonSnackPct: number; // Bữa phụ xế: VD 25%
  lateSnackPct: number; // Bữa phụ chiều: VD 10%
}

export interface NutritionStandardConfig {
  id: string;
  ageGroup: AgeGroup;
  title: string; // 'Mẫu giáo (3-6 tuổi)'
  minCalo: number; // 615
  maxCalo: number; // 726
  macroRatio: MacroNutrientRatio;
  animalProteinRatioMin: number; // 50%
  plantFatRatioMin: number; // 50%
  maxSodiumMg: number; // 700
  mealBudgetRatio: MealBudgetRatio;
  defaultDailyPrice: number; // 21000đ
  appliedCircular: string; // 'Thông tư 28/2016/TT-BGDĐT & QĐ 2195/QĐ-BGDĐT'
  updatedAt: string;
}
