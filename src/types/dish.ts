export type DishCategory =
  | 'mon_man'      // Món mặn đạm (thịt, cá, trứng, tôm)
  | 'mon_canh'     // Món canh rau, củ, quả
  | 'mon_xao'      // Món xào thập cẩm
  | 'tinh_bot'     // Cơm, bún, phở, bánh mì, miến
  | 'trang_mieng'  // Trái cây, yaourt
  | 'sua_phu';     // Sữa chua, sữa tươi, bánh phụ

export type DishMealSession = 'trua' | 'sang' | 'chieu' | 'phu';
export type DishAgeGroup = 'maugiao' | 'nhatre' | 'tat_ca';

export interface DishIngredient {
  foodId: string;
  foodCode: string;
  foodName: string;
  unit: string;
  gamPerChild: number;       // Gam trên 1 trẻ
  unitPrice: number;         // Đơn giá VNĐ/kg hoặc VNĐ/đơn vị
  costPerChild: number;      // Thành tiền trên 1 trẻ (gamPerChild / 1000 * unitPrice)
  caloPerChild: number;      // Calo
  proteinPerChild: number;   // Đạm (g)
  fatPerChild: number;       // Béo (g)
  carbsPerChild: number;     // Đường bột (g)
  category?: string;
}

export interface DishItem {
  id: string;
  code: string;              // "HT-M01", "HT-M02"...
  name: string;              // "HT. Thịt heo, trứng chiên sốt cà"
  category: DishCategory;    // 'mon_man', 'mon_canh'...
  categoryLabel: string;     // "Món mặn đạm", "Món canh rau"...
  mealSession: DishMealSession;
  mealSessionLabel: string;  // "Bữa trưa", "Bữa sáng", "Bữa phụ xế"
  ageGroup: DishAgeGroup;
  ageGroupLabel: string;     // "Mẫu giáo", "Nhà trẻ", "Dùng chung"
  ingredients: DishIngredient[];
  totalCalo: number;         // Kcal/trẻ
  totalProtein: number;      // Gam đạm/trẻ
  totalFat: number;          // Gam béo/trẻ
  totalCarbs: number;        // Gam đường/trẻ
  totalCost: number;         // Đơn giá dự kiến VNĐ/trẻ
  cookingGuide?: string;     // Hướng dẫn chế biến bếp mầm non
  allergenWarning?: string;  // Cảnh báo dị ứng (hải sản, trứng, sữa...)
  updatedAt: string;         // "08/09/2026, 14:30:00"
}
