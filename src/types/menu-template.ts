import { AgeGroup, MealSession } from './nutrition';

export interface MenuTemplateDish {
  dishId: string;
  dishName: string;
  mealSession: MealSession;
  category: string;
}

export interface MenuTemplateItem {
  id: string;
  code: string; // VD: 'TD_MG_T1_T2' (Thực đơn Mẫu giáo Tuần 1 Thứ 2)
  name: string; // VD: 'Thực đơn Mẫu giáo - Thứ Hai (Tuần 1)'
  ageGroup: AgeGroup;
  season?: 'tat_ca' | 'mua_nong' | 'mua_lanh';
  mealPrice: number; // Đơn giá 1 suất (đ)
  dishes: MenuTemplateDish[];
  calo: number; // Năng lượng (Kcal)
  proteinPct: number; // % Đạm
  fatPct: number; // % Béo
  carbsPct: number; // % Bột đường
  animalProteinRatio: number; // % Đạm ĐV / Tổng đạm
  plantFatRatio: number; // % Béo TV / Tổng béo
  sodiumMg: number;
  costPerChild: number;
  isQuantityPass: boolean; // Đánh giá "Lượng" (Đạt / Chưa đạt)
  isQualityPass: boolean; // Đánh giá "Chất" (Đạt / Chưa đạt)
  createdAt: string;
  updatedAt: string;
  note?: string;
}
