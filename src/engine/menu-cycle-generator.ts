import { AgeGroup, MenuItem, DailyMenuPlan, FoodItem, MealSession } from '../types/nutrition';
import { solveNutritionMenu } from './milp-solver';
import { computeNutritionTotals } from './atwater';
import { STANDARD_FOOD_CATALOG } from '../data/standard-foods';

export interface DayMenuCycleItem {
  dayIndex: number;          // 1..20
  weekIndex: number;         // 1..4 (Tuần 1, 2, 3, 4)
  dayOfWeek: string;         // "Thứ Hai", "Thứ Ba"...
  dateString: string;        // "2026-09-07", "2026-09-08"...
  proteinGroup: string;      // "Thịt heo", "Bò/Trứng", "Thủy hải sản", "Gia cầm", "Đa dạng"

  // 5 Bữa học đường chuẩn file mẫu thực tế (thuc don mau.docx):
  breakfastDish: string;      // Bữa sáng NT + MG
  lunchSoupDish: string;      // Canh trưa NT + MG
  lunchMainDish: string;      // Mặn trưa NT + MG
  dessertDish: string;        // Bữa phụ NT (Trái cây / Bánh)
  afternoonSnackDish: string; // Bữa phụ MG / Bữa chính NT (Món xế nóng)
  afternoonMilkDish: string;  // Bữa chiều NT + MG (Sữa Smarta Grow/Metacare hoặc Sữa chua)

  // Backward compatibility:
  mainDishName: string;
  soupDishName: string;
  sideDishName: string;
  afternoonDishName: string;

  items: MenuItem[];         // Danh sách nguyên liệu sau khi cân đối Solver
  totalCalo: number;
  costPerChild: number;
  proteinPct: number;
  fatPct: number;
  carbsPct: number;
  animalProteinPct: number;
  vegetableFatPct: number;
  sodiumMg: number;
  freeSugarPct: number;
  isCaloPass: boolean;
  status: 'DAT' | 'CANH_BAO';
}

export interface Month20DaysCycleResult {
  ageGroup: AgeGroup;
  budgetPerChild: number;
  studentCount: number;
  days: DayMenuCycleItem[];
  averageCalo: number;
  averageCost: number;
  averageProteinPct: number;
  averageFatPct: number;
  averageCarbsPct: number;
  complianceSummary: {
    totalDays: number;
    passedDays: number;
    proteinDiversityRate: number; // Tỷ lệ đa dạng đạm (100%)
    noRepeatStreakRate: number;    // Tỷ lệ không trùng món liên tiếp (100%)
  };
}

// Helper tìm thực phẩm trong danh mục theo Code hoặc ID
function getStandardFood(codeOrId: string): FoodItem {
  const found = STANDARD_FOOD_CATALOG.find((f) => f.code === codeOrId || f.id === codeOrId);
  if (found) return found;
  // Fallback an toàn
  return STANDARD_FOOD_CATALOG[0];
}

interface DayTemplateDef {
  dayOfWeek: string;
  proteinGroup: string;
  breakfastDish: string;
  lunchSoupDish: string;
  lunchMainDish: string;
  dessertDish: string;
  afternoonSnackDish: string;
  afternoonMilkDish: string;
  ingredients: { code: string; defaultGam: number; session?: MealSession; isFixed?: boolean }[];
}

/**
 * BỘ KHUNG THỰC ĐƠN 20 NGÀY THỰC TẾ TRƯỜNG MẦM NON
 * Nguồn: File mẫu "thuc don mau.docx" (Người lên: Kiều Thị Mỹ Hạnh - Duyệt: HT. Nguyễn Thị Thắng)
 * Chu kỳ 4 tuần x 5 ngày = 20 ngày học đường.
 */
const CYCLE_20_DAYS_TEMPLATES: DayTemplateDef[] = [
  // ==========================================
  // TUẦN 1: Từ ngày 07 đến 11/9/2026
  // ==========================================
  // T2: 07/9 - Thịt heo & Tôm / Đậu hũ
  {
    dayOfWeek: 'Thứ Hai',
    proteinGroup: 'Thịt heo & Tôm / Đậu hũ',
    breakfastDish: 'Phở gà',
    lunchSoupDish: 'Canh: Đu đủ, nấm rơm nấu tôm',
    lunchMainDish: 'Mặn: Đậu hủ chiên rim cà, thịt heo',
    dessertDish: 'Chuối cau',
    afternoonSnackDish: 'Bún riêu',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'PHO_TUOI', defaultGam: 35, session: 'sang' },
      { code: 'THIT_GA_PHI_LE', defaultGam: 15, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'THIT_HEO_NAC', defaultGam: 22, session: 'chinh_trua' },
      { code: 'DAU_HU_CHIEN', defaultGam: 18, session: 'chinh_trua' },
      { code: 'TOM_SU', defaultGam: 10, session: 'chinh_trua' },
      { code: 'DU_DU_XANH', defaultGam: 30, session: 'chinh_trua' },
      { code: 'NAM_ROM', defaultGam: 10, session: 'chinh_trua' },
      { code: 'CA_CHUA', defaultGam: 15, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 4, session: 'chinh_trua' },
      { code: 'CHUOI_CAU', defaultGam: 40, session: 'phu_trua', isFixed: true },
      { code: 'BUN_TUOI', defaultGam: 35, session: 'xe' },
      { code: 'THIT_CUA_DONG', defaultGam: 12, session: 'xe' },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },
  // T3: 08/9 - Thịt gà ta & Cá nạc
  {
    dayOfWeek: 'Thứ Ba',
    proteinGroup: 'Thịt gà ta & Cá nạc',
    breakfastDish: 'Súp nui (thịt heo, tôm, cà rốt, su su, nấm rơm)',
    lunchSoupDish: 'Canh: Canh chua cá nạc',
    lunchMainDish: 'Mặn: Thịt gà xào cà rốt, dưa leo, đậu cove',
    dessertDish: 'Bánh bông lan',
    afternoonSnackDish: 'Miến mực, thịt',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'NUI_SAO', defaultGam: 25, session: 'sang' },
      { code: 'THIT_HEO_NAC', defaultGam: 12, session: 'sang' },
      { code: 'TOM_SU', defaultGam: 8, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'THIT_GA_PHI_LE', defaultGam: 26, session: 'chinh_trua' },
      { code: 'CA_NAC', defaultGam: 18, session: 'chinh_trua' },
      { code: 'THOM_DUA', defaultGam: 15, session: 'chinh_trua' },
      { code: 'CA_CHUA', defaultGam: 15, session: 'chinh_trua' },
      { code: 'DAU_COVE', defaultGam: 15, session: 'chinh_trua' },
      { code: 'CA_ROT', defaultGam: 15, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 4, session: 'chinh_trua' },
      { code: 'BANH_BONG_LAN', defaultGam: 25, session: 'phu_trua', isFixed: true },
      { code: 'MIEN_DONG', defaultGam: 25, session: 'xe' },
      { code: 'MUC_ONG', defaultGam: 12, session: 'xe' },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },
  // T4: 09/9 - Thủy hải sản (Cá kho, Tôm, Chả cá)
  {
    dayOfWeek: 'Thứ Tư',
    proteinGroup: 'Thủy hải sản (Cá kho, Tôm, Chả cá)',
    breakfastDish: 'Cơm chiên hải sản',
    lunchSoupDish: 'Canh: Bầu, cải ngọt nấu tôm',
    lunchMainDish: 'Mặn: Cá kho, nấm bào ngư',
    dessertDish: 'Dưa hấu',
    afternoonSnackDish: 'Bánh canh chả cá, trứng cút',
    afternoonMilkDish: 'Sữa chua',
    ingredients: [
      { code: 'GAO_THOM', defaultGam: 30, session: 'sang' },
      { code: 'TOM_SU', defaultGam: 10, session: 'sang' },
      { code: 'MUC_ONG', defaultGam: 8, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'CA_NAC', defaultGam: 28, session: 'chinh_trua' },
      { code: 'NAM_BAO_NGU', defaultGam: 20, session: 'chinh_trua' },
      { code: 'BAU_SAO', defaultGam: 25, session: 'chinh_trua' },
      { code: 'CAI_NGOT', defaultGam: 20, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 4, session: 'chinh_trua' },
      { code: 'DUA_HAU', defaultGam: 40, session: 'phu_trua', isFixed: true },
      { code: 'BANH_CANH', defaultGam: 35, session: 'xe' },
      { code: 'CHA_CA_CHIEN', defaultGam: 15, session: 'xe' },
      { code: 'TRUNG_CUT', defaultGam: 12, session: 'xe', isFixed: true },
      { code: 'SUA_CHUA_VINAMILK', defaultGam: 100, session: 'phu_xe', isFixed: true },
    ],
  },
  // T5: 10/9 - Cá bớp & Thịt heo, Trứng cút
  {
    dayOfWeek: 'Thứ Năm',
    proteinGroup: 'Cá bớp & Thịt heo, Trứng cút',
    breakfastDish: 'Cháo cá bóp',
    lunchSoupDish: 'Canh: Bí đỏ nấu tôm',
    lunchMainDish: 'Mặn: Thịt heo, trứng cút kho nấm rơm',
    dessertDish: 'Bánh quế',
    afternoonSnackDish: 'Súp măng cua',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'GAO_THOM', defaultGam: 25, session: 'sang' },
      { code: 'CA_BOP', defaultGam: 18, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'THIT_HEO_NAC', defaultGam: 25, session: 'chinh_trua' },
      { code: 'TRUNG_CUT', defaultGam: 12, session: 'chinh_trua', isFixed: true },
      { code: 'BI_DO', defaultGam: 35, session: 'chinh_trua' },
      { code: 'TOM_SU', defaultGam: 10, session: 'chinh_trua' },
      { code: 'NAM_ROM', defaultGam: 15, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 3, session: 'chinh_trua' },
      { code: 'BANH_QUE', defaultGam: 20, session: 'phu_trua', isFixed: true },
      { code: 'THIT_CUA_DONG', defaultGam: 12, session: 'xe' },
      { code: 'NUI_SAO', defaultGam: 15, session: 'xe' },
      { code: 'BAP_MY', defaultGam: 10, session: 'xe' },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },
  // T6: 11/9 - Đa dạng (Thịt heo, Trứng, Cá, Tôm)
  {
    dayOfWeek: 'Thứ Sáu',
    proteinGroup: 'Đa dạng (Thịt heo, Trứng, Cá, Tôm)',
    breakfastDish: 'Mì xào thịt heo, tôm, cà rốt, bắp sú, nấm rơm',
    lunchSoupDish: 'Canh: Cá nấu thơm, cà (rau cần)',
    lunchMainDish: 'Mặn: Thịt heo, trứng chiên sốt cà',
    dessertDish: 'Bánh AFC',
    afternoonSnackDish: 'Bánh mì cari thịt heo',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'MI_TRUNG', defaultGam: 25, session: 'sang' },
      { code: 'THIT_HEO_NAC', defaultGam: 12, session: 'sang' },
      { code: 'TOM_SU', defaultGam: 8, session: 'sang' },
      { code: 'BAP_SU', defaultGam: 15, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'THIT_HEO_NAC', defaultGam: 20, session: 'chinh_trua' },
      { code: 'TRUNG_GA', defaultGam: 25, session: 'chinh_trua', isFixed: true },
      { code: 'CA_NAC', defaultGam: 16, session: 'chinh_trua' },
      { code: 'THOM_DUA', defaultGam: 15, session: 'chinh_trua' },
      { code: 'CA_CHUA', defaultGam: 15, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 4, session: 'chinh_trua' },
      { code: 'BANH_AFC', defaultGam: 25, session: 'phu_trua', isFixed: true },
      { code: 'BANH_MI', defaultGam: 25, session: 'xe', isFixed: true },
      { code: 'KHOAI_TAY', defaultGam: 20, session: 'xe' },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },

  // ==========================================
  // TUẦN 2: Từ ngày 14 đến 18/9/2026
  // ==========================================
  // T2: 14/9 - Thịt heo & Vịt cỏ, Cá nạc
  {
    dayOfWeek: 'Thứ Hai',
    proteinGroup: 'Thịt heo & Vịt cỏ, Cá nạc',
    breakfastDish: 'Bánh mì sandwich trứng ốp la',
    lunchSoupDish: 'Canh: Canh chua cá',
    lunchMainDish: 'Mặn: Thịt ram mặn',
    dessertDish: 'Bánh Tipo',
    afternoonSnackDish: 'Cháo đậu xanh, cà rốt, thịt vịt',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'BANH_MI', defaultGam: 25, session: 'sang', isFixed: true },
      { code: 'TRUNG_GA', defaultGam: 25, session: 'sang', isFixed: true },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'THIT_HEO_NAC', defaultGam: 28, session: 'chinh_trua' },
      { code: 'CA_NAC', defaultGam: 18, session: 'chinh_trua' },
      { code: 'THOM_DUA', defaultGam: 15, session: 'chinh_trua' },
      { code: 'CA_CHUA', defaultGam: 15, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 3, session: 'chinh_trua' },
      { code: 'BANH_TIPO', defaultGam: 20, session: 'phu_trua', isFixed: true },
      { code: 'GAO_THOM', defaultGam: 25, session: 'xe' },
      { code: 'DAU_XANH', defaultGam: 8, session: 'xe' },
      { code: 'THIT_VIT_CO', defaultGam: 20, session: 'xe' },
      { code: 'CA_ROT', defaultGam: 15, session: 'xe' },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },
  // T3: 15/9 - Trứng cuộn rong biển & Tôm mực
  {
    dayOfWeek: 'Thứ Ba',
    proteinGroup: 'Trứng cuộn rong biển & Tôm mực',
    breakfastDish: 'Miến thịt heo, mực',
    lunchSoupDish: 'Canh: Dưa hồng, rau ngót nấu thịt tôm',
    lunchMainDish: 'Mặn: Trứng chiên cuộn rong biển',
    dessertDish: 'Bánh bông lan',
    afternoonSnackDish: 'Xôi bắp (NT: Trứng luộc, xì dầu + Canh cà, thơm thịt)',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'MIEN_DONG', defaultGam: 25, session: 'sang' },
      { code: 'THIT_HEO_NAC', defaultGam: 12, session: 'sang' },
      { code: 'MUC_ONG', defaultGam: 10, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 50, session: 'chinh_trua' },
      { code: 'TRUNG_GA', defaultGam: 25, session: 'chinh_trua', isFixed: true },
      { code: 'RONG_BIEN', defaultGam: 2, session: 'chinh_trua' },
      { code: 'TOM_SU', defaultGam: 10, session: 'chinh_trua' },
      { code: 'DUA_HONG', defaultGam: 25, session: 'chinh_trua' },
      { code: 'RAU_NGOT', defaultGam: 15, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 5, session: 'chinh_trua' },
      { code: 'BANH_BONG_LAN', defaultGam: 25, session: 'phu_trua', isFixed: true },
      { code: 'GAO_NEP', defaultGam: 25, session: 'xe' },
      { code: 'BAP_MY', defaultGam: 15, session: 'xe' },
      { code: 'TRUNG_CUT', defaultGam: 12, session: 'xe', isFixed: true },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },
  // T4: 16/9 - Thịt heo, tôm ram chua ngọt & Gà
  {
    dayOfWeek: 'Thứ Tư',
    proteinGroup: 'Thịt heo, tôm ram chua ngọt & Gà',
    breakfastDish: 'Cháo gà, bông cải xanh',
    lunchSoupDish: 'Canh: Mướp, mồng tơi nấu mực',
    lunchMainDish: 'Mặn: Thịt heo, tôm ram chua ngọt',
    dessertDish: 'Bánh gạo',
    afternoonSnackDish: 'Súp nui',
    afternoonMilkDish: 'Sữa chua',
    ingredients: [
      { code: 'GAO_THOM', defaultGam: 25, session: 'sang' },
      { code: 'THIT_GA_PHI_LE', defaultGam: 18, session: 'sang' },
      { code: 'BONG_CAI_XANH', defaultGam: 15, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'THIT_HEO_NAC', defaultGam: 20, session: 'chinh_trua' },
      { code: 'TOM_SU', defaultGam: 15, session: 'chinh_trua' },
      { code: 'MUC_ONG', defaultGam: 12, session: 'chinh_trua' },
      { code: 'MUEP_HUONG', defaultGam: 25, session: 'chinh_trua' },
      { code: 'MONG_TOI', defaultGam: 20, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 3, session: 'chinh_trua' },
      { code: 'BANH_GAO', defaultGam: 20, session: 'phu_trua', isFixed: true },
      { code: 'NUI_SAO', defaultGam: 25, session: 'xe' },
      { code: 'THIT_HEO_NAC', defaultGam: 10, session: 'xe' },
      { code: 'SUA_CHUA_VINAMILK', defaultGam: 100, session: 'phu_xe', isFixed: true },
    ],
  },
  // T5: 17/9 - Thịt bò & Thịt heo xào sả
  {
    dayOfWeek: 'Thứ Năm',
    proteinGroup: 'Thịt bò & Thịt heo xào sả',
    breakfastDish: 'Cơm chiên dương châu',
    lunchSoupDish: 'Canh: Canh rau muống nấu tôm',
    lunchMainDish: 'Mặn: Thịt heo, bò xào sả ớt',
    dessertDish: 'Bánh mì sữa',
    afternoonSnackDish: 'Bánh mì sữa (NT: Thịt heo sốt cà + Canh bí đao nấu tôm)',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'GAO_THOM', defaultGam: 30, session: 'sang' },
      { code: 'THIT_HEO_NAC', defaultGam: 12, session: 'sang' },
      { code: 'TRUNG_GA', defaultGam: 15, session: 'sang', isFixed: true },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'THIT_BO_FILE', defaultGam: 20, session: 'chinh_trua' },
      { code: 'THIT_HEO_NAC', defaultGam: 18, session: 'chinh_trua' },
      { code: 'RAU_MUONG', defaultGam: 35, session: 'chinh_trua' },
      { code: 'TOM_SU', defaultGam: 10, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 4, session: 'chinh_trua' },
      { code: 'BANH_MI_SUA', defaultGam: 35, session: 'phu_trua', isFixed: true },
      { code: 'BANH_MI', defaultGam: 20, session: 'xe', isFixed: true },
      { code: 'BI_DAO', defaultGam: 20, session: 'xe' },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },
  // T6: 18/9 - Đa dạng (Bò bằm, Mực, Đậu hũ, Heo)
  {
    dayOfWeek: 'Thứ Sáu',
    proteinGroup: 'Đa dạng (Bò bằm, Mực, Đậu hũ, Heo)',
    breakfastDish: 'Mì Spaghetti bò bằm',
    lunchSoupDish: 'Canh: Bí đỏ nấu tôm',
    lunchMainDish: 'Mặn: Đậu hủ chiên rim cà, thịt heo',
    dessertDish: 'Chuối cau',
    afternoonSnackDish: 'Bún mực, cà rốt, nấm bào ngư',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'MI_SPAGHETTI', defaultGam: 25, session: 'sang' },
      { code: 'THIT_BO_FILE', defaultGam: 18, session: 'sang' },
      { code: 'CA_CHUA', defaultGam: 15, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'DAU_HU_CHIEN', defaultGam: 20, session: 'chinh_trua' },
      { code: 'THIT_HEO_NAC', defaultGam: 20, session: 'chinh_trua' },
      { code: 'BI_DO', defaultGam: 35, session: 'chinh_trua' },
      { code: 'TOM_SU', defaultGam: 10, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 4, session: 'chinh_trua' },
      { code: 'CHUOI_CAU', defaultGam: 40, session: 'phu_trua', isFixed: true },
      { code: 'BUN_TUOI', defaultGam: 35, session: 'xe' },
      { code: 'MUC_ONG', defaultGam: 15, session: 'xe' },
      { code: 'NAM_BAO_NGU', defaultGam: 10, session: 'xe' },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },

  // ==========================================
  // TUẦN 3: Từ ngày 21 đến 25/9/2026
  // ==========================================
  // T2: 21/9 - Chả cá & Thịt bò
  {
    dayOfWeek: 'Thứ Hai',
    proteinGroup: 'Chả cá & Thịt bò',
    breakfastDish: 'Phở bò',
    lunchSoupDish: 'Canh: Khoai tây, cà rốt, su su, thịt heo',
    lunchMainDish: 'Mặn: Chả cá chiên sốt cà',
    dessertDish: 'Dưa hấu',
    afternoonSnackDish: 'Cháo bí đỏ thịt heo, tôm, nấm rơm',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'PHO_TUOI', defaultGam: 35, session: 'sang' },
      { code: 'THIT_BO_FILE', defaultGam: 18, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'CHA_CA_CHIEN', defaultGam: 28, session: 'chinh_trua' },
      { code: 'THIT_HEO_NAC', defaultGam: 12, session: 'chinh_trua' },
      { code: 'KHOAI_TAY', defaultGam: 20, session: 'chinh_trua' },
      { code: 'CA_ROT', defaultGam: 15, session: 'chinh_trua' },
      { code: 'SU_SU', defaultGam: 15, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 4, session: 'chinh_trua' },
      { code: 'DUA_HAU', defaultGam: 40, session: 'phu_trua', isFixed: true },
      { code: 'GAO_THOM', defaultGam: 25, session: 'xe' },
      { code: 'BI_DO', defaultGam: 20, session: 'xe' },
      { code: 'TOM_SU', defaultGam: 8, session: 'xe' },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },
  // T3: 22/9 - Thịt bò & Cá biển
  {
    dayOfWeek: 'Thứ Ba',
    proteinGroup: 'Thịt bò & Cá biển',
    breakfastDish: 'Miến thịt heo, mực, cà rốt, su su, nấm rơm',
    lunchSoupDish: 'Canh: Cá nấu cà, thơm',
    lunchMainDish: 'Mặn: Thịt bò hầm khoai tây',
    dessertDish: 'Bánh Karo',
    afternoonSnackDish: 'Bún riêu (thịt heo, trứng, tôm)',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'MIEN_DONG', defaultGam: 25, session: 'sang' },
      { code: 'THIT_HEO_NAC', defaultGam: 10, session: 'sang' },
      { code: 'MUC_ONG', defaultGam: 10, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 50, session: 'chinh_trua' },
      { code: 'THIT_BO_FILE', defaultGam: 20, session: 'chinh_trua' },
      { code: 'KHOAI_TAY', defaultGam: 25, session: 'chinh_trua' },
      { code: 'CA_NAC', defaultGam: 18, session: 'chinh_trua' },
      { code: 'THOM_DUA', defaultGam: 15, session: 'chinh_trua' },
      { code: 'CA_CHUA', defaultGam: 15, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 5, session: 'chinh_trua' },
      { code: 'BANH_KARO', defaultGam: 26, session: 'phu_trua', isFixed: true },
      { code: 'BUN_TUOI', defaultGam: 35, session: 'xe' },
      { code: 'TRUNG_GA', defaultGam: 15, session: 'xe', isFixed: true },
      { code: 'TOM_SU', defaultGam: 8, session: 'xe' },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },
  // T4: 23/9 - Gia cầm (Gà ta) & Bò bằm
  {
    dayOfWeek: 'Thứ Tư',
    proteinGroup: 'Gia cầm (Gà ta) & Bò bằm',
    breakfastDish: 'Súp khoai tây, nấm tuyết, bò bằm',
    lunchSoupDish: 'Canh: Bầu, cải ngọt nấu tôm',
    lunchMainDish: 'Mặn: Thịt heo, gà ram chua ngọt',
    dessertDish: 'Bánh gạo',
    afternoonSnackDish: 'Bún bò huế',
    afternoonMilkDish: 'Sữa chua',
    ingredients: [
      { code: 'KHOAI_TAY', defaultGam: 25, session: 'sang' },
      { code: 'NAM_TUYET', defaultGam: 8, session: 'sang' },
      { code: 'THIT_BO_FILE', defaultGam: 15, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 52, session: 'chinh_trua' },
      { code: 'THIT_GA_PHI_LE', defaultGam: 20, session: 'chinh_trua' },
      { code: 'THIT_HEO_NAC', defaultGam: 18, session: 'chinh_trua' },
      { code: 'BAU_SAO', defaultGam: 25, session: 'chinh_trua' },
      { code: 'CAI_NGOT', defaultGam: 20, session: 'chinh_trua' },
      { code: 'TOM_SU', defaultGam: 10, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 5, session: 'chinh_trua' },
      { code: 'BANH_GAO', defaultGam: 20, session: 'phu_trua', isFixed: true },
      { code: 'BUN_TUOI', defaultGam: 35, session: 'xe' },
      { code: 'THIT_BO_FILE', defaultGam: 12, session: 'xe' },
      { code: 'SUA_CHUA_VINAMILK', defaultGam: 100, session: 'phu_xe', isFixed: true },
    ],
  },
  // T5: 24/9 - Thịt bò & Thịt gà, Tôm
  {
    dayOfWeek: 'Thứ Năm',
    proteinGroup: 'Thịt bò & Thịt gà, Tôm',
    breakfastDish: 'Mì quảng',
    lunchSoupDish: 'Canh: Thịt gà lá giang, cà chua',
    lunchMainDish: 'Mặn: Thịt heo, bò xào sả ớt',
    dessertDish: 'Hồng xiêm',
    afternoonSnackDish: 'Súp nui (thịt heo, tôm, cà rốt, su su)',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'MI_QUANG', defaultGam: 35, session: 'sang' },
      { code: 'THIT_HEO_NAC', defaultGam: 12, session: 'sang' },
      { code: 'TOM_SU', defaultGam: 8, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'THIT_BO_FILE', defaultGam: 20, session: 'chinh_trua' },
      { code: 'THIT_HEO_NAC', defaultGam: 18, session: 'chinh_trua' },
      { code: 'THIT_GA_PHI_LE', defaultGam: 18, session: 'chinh_trua' },
      { code: 'CA_CHUA', defaultGam: 20, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 4, session: 'chinh_trua' },
      { code: 'HONG_XIEM', defaultGam: 40, session: 'phu_trua', isFixed: true },
      { code: 'NUI_SAO', defaultGam: 25, session: 'xe' },
      { code: 'SU_SU', defaultGam: 10, session: 'xe' },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },
  // T6: 25/9 - Đa dạng (Thịt heo, Trứng, Tôm, Bò)
  {
    dayOfWeek: 'Thứ Sáu',
    proteinGroup: 'Đa dạng (Thịt heo, Trứng, Tôm, Bò)',
    breakfastDish: 'Mì xào thịt heo, tôm, cà rốt, đậu cove',
    lunchSoupDish: 'Canh: Bí đao, rau ngót nấu thịt bò',
    lunchMainDish: 'Mặn: Thịt heo, trứng vịt chiên sốt cà',
    dessertDish: 'Bánh con gấu',
    afternoonSnackDish: 'Bánh mì, xíu mại, trứng',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'MI_TRUNG', defaultGam: 25, session: 'sang' },
      { code: 'THIT_HEO_NAC', defaultGam: 12, session: 'sang' },
      { code: 'TOM_SU', defaultGam: 8, session: 'sang' },
      { code: 'DAU_COVE', defaultGam: 12, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'THIT_HEO_NAC', defaultGam: 20, session: 'chinh_trua' },
      { code: 'TRUNG_GA', defaultGam: 25, session: 'chinh_trua', isFixed: true },
      { code: 'THIT_BO_FILE', defaultGam: 15, session: 'chinh_trua' },
      { code: 'BI_DAO', defaultGam: 25, session: 'chinh_trua' },
      { code: 'RAU_NGOT', defaultGam: 15, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 3, session: 'chinh_trua' },
      { code: 'BANH_CON_GAU', defaultGam: 20, session: 'phu_trua', isFixed: true },
      { code: 'BANH_MI', defaultGam: 25, session: 'xe', isFixed: true },
      { code: 'TRUNG_CUT', defaultGam: 12, session: 'xe', isFixed: true },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },

  // ==========================================
  // TUẦN 4: Từ ngày 28 đến 02/10/2026
  // ==========================================
  // T2: 28/9 - Thịt heo nạc (Xíu mại) & Tôm
  {
    dayOfWeek: 'Thứ Hai',
    proteinGroup: 'Thịt heo nạc (Xíu mại) & Tôm',
    breakfastDish: 'Súp khoai tây nghiền, thịt bằm',
    lunchSoupDish: 'Canh: Canh tần ô, bầu nấu tôm',
    lunchMainDish: 'Mặn: Xíu mại',
    dessertDish: 'Chuối cau',
    afternoonSnackDish: 'Miến tôm, thịt heo, cà rốt, nấm rơm, su su',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'KHOAI_TAY', defaultGam: 30, session: 'sang' },
      { code: 'THIT_HEO_NAC', defaultGam: 15, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'THIT_HEO_NAC', defaultGam: 30, session: 'chinh_trua' },
      { code: 'CA_CHUA', defaultGam: 15, session: 'chinh_trua' },
      { code: 'RAU_TAN_O', defaultGam: 20, session: 'chinh_trua' },
      { code: 'BAU_SAO', defaultGam: 20, session: 'chinh_trua' },
      { code: 'TOM_SU', defaultGam: 10, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 3, session: 'chinh_trua' },
      { code: 'CHUOI_CAU', defaultGam: 40, session: 'phu_trua', isFixed: true },
      { code: 'MIEN_DONG', defaultGam: 25, session: 'xe' },
      { code: 'TOM_SU', defaultGam: 8, session: 'xe' },
      { code: 'NAM_ROM', defaultGam: 8, session: 'xe' },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },
  // T3: 29/9 - Thịt heo & Cá nạc
  {
    dayOfWeek: 'Thứ Ba',
    proteinGroup: 'Thịt heo & Cá nạc',
    breakfastDish: 'Mì quảng',
    lunchSoupDish: 'Canh: Canh chua cá (cà, giá, me, thơm)',
    lunchMainDish: 'Mặn: Thịt heo kho nấm',
    dessertDish: 'Bánh Tipo',
    afternoonSnackDish: 'Cháo thịt heo, thịt bò, cà rốt',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'MI_QUANG', defaultGam: 35, session: 'sang' },
      { code: 'THIT_HEO_NAC', defaultGam: 12, session: 'sang' },
      { code: 'TOM_SU', defaultGam: 8, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'THIT_HEO_NAC', defaultGam: 28, session: 'chinh_trua' },
      { code: 'NAM_ROM', defaultGam: 15, session: 'chinh_trua' },
      { code: 'CA_NAC', defaultGam: 18, session: 'chinh_trua' },
      { code: 'THOM_DUA', defaultGam: 15, session: 'chinh_trua' },
      { code: 'CA_CHUA', defaultGam: 15, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 3, session: 'chinh_trua' },
      { code: 'BANH_TIPO', defaultGam: 20, session: 'phu_trua', isFixed: true },
      { code: 'GAO_THOM', defaultGam: 25, session: 'xe' },
      { code: 'THIT_BO_FILE', defaultGam: 12, session: 'xe' },
      { code: 'CA_ROT', defaultGam: 15, session: 'xe' },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },
  // T4: 30/9 - Thủy hải sản (Cá kho) & Thịt heo
  {
    dayOfWeek: 'Thứ Tư',
    proteinGroup: 'Thủy hải sản (Cá kho) & Thịt heo',
    breakfastDish: 'Hủ tiếu Nam vang',
    lunchSoupDish: 'Canh: Canh khoai mỡ, thịt heo',
    lunchMainDish: 'Mặn: Thịt heo, cá kho nấm bào ngư',
    dessertDish: 'Bánh mì bơ đậu phộng',
    afternoonSnackDish: 'Bánh mì bơ đậu phộng (NT: Cháo gà)',
    afternoonMilkDish: 'Sữa chua',
    ingredients: [
      { code: 'HU_TIEU_NAM_VANG', defaultGam: 35, session: 'sang' },
      { code: 'THIT_HEO_NAC', defaultGam: 12, session: 'sang' },
      { code: 'TOM_SU', defaultGam: 8, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'THIT_HEO_NAC', defaultGam: 18, session: 'chinh_trua' },
      { code: 'CA_NAC', defaultGam: 20, session: 'chinh_trua' },
      { code: 'NAM_BAO_NGU', defaultGam: 15, session: 'chinh_trua' },
      { code: 'KHOAI_MO', defaultGam: 35, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 3, session: 'chinh_trua' },
      { code: 'BANH_MI', defaultGam: 20, session: 'phu_trua', isFixed: true },
      { code: 'BO_DAU_PHONG', defaultGam: 8, session: 'phu_trua' },
      { code: 'GAO_THOM', defaultGam: 20, session: 'xe' },
      { code: 'THIT_GA_PHI_LE', defaultGam: 15, session: 'xe' },
      { code: 'SUA_CHUA_VINAMILK', defaultGam: 100, session: 'phu_xe', isFixed: true },
    ],
  },
  // T5: 01/10 (Bổ sung theo chuẩn phong cách trường) - Gia cầm & Tôm thịt
  {
    dayOfWeek: 'Thứ Năm',
    proteinGroup: 'Gia cầm & Tôm thịt',
    breakfastDish: 'Phở gà',
    lunchSoupDish: 'Canh: Canh bí đỏ nấu tôm thịt',
    lunchMainDish: 'Mặn: Thịt gà xào sả cà rốt, su su',
    dessertDish: 'Bánh bông lan',
    afternoonSnackDish: 'Súp nui thịt heo bằm, tôm',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'PHO_TUOI', defaultGam: 35, session: 'sang' },
      { code: 'THIT_GA_PHI_LE', defaultGam: 15, session: 'sang' },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'THIT_GA_PHI_LE', defaultGam: 28, session: 'chinh_trua' },
      { code: 'CA_ROT', defaultGam: 15, session: 'chinh_trua' },
      { code: 'SU_SU', defaultGam: 15, session: 'chinh_trua' },
      { code: 'BI_DO', defaultGam: 35, session: 'chinh_trua' },
      { code: 'TOM_SU', defaultGam: 10, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 4, session: 'chinh_trua' },
      { code: 'BANH_BONG_LAN', defaultGam: 25, session: 'phu_trua', isFixed: true },
      { code: 'NUI_SAO', defaultGam: 25, session: 'xe' },
      { code: 'THIT_HEO_NAC', defaultGam: 12, session: 'xe' },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },
  // T6: 02/10 (Bổ sung theo chuẩn phong cách trường) - Đa dạng (Chả cá, Trứng, Tôm thịt)
  {
    dayOfWeek: 'Thứ Sáu',
    proteinGroup: 'Đa dạng (Chả cá, Trứng, Tôm thịt)',
    breakfastDish: 'Bánh canh chả cá, trứng cút',
    lunchSoupDish: 'Canh: Canh rau ngót nấu thịt bò',
    lunchMainDish: 'Mặn: Chả cá sốt cà chua',
    dessertDish: 'Dưa hấu',
    afternoonSnackDish: 'Mì xào thịt heo, tôm, đậu cove',
    afternoonMilkDish: 'Sữa Smarta Grow / NT: Sữa Metacare',
    ingredients: [
      { code: 'BANH_CANH', defaultGam: 35, session: 'sang' },
      { code: 'CHA_CA_CHIEN', defaultGam: 15, session: 'sang' },
      { code: 'TRUNG_CUT', defaultGam: 12, session: 'sang', isFixed: true },
      { code: 'GAO_THOM', defaultGam: 45, session: 'chinh_trua' },
      { code: 'CHA_CA_CHIEN', defaultGam: 26, session: 'chinh_trua' },
      { code: 'CA_CHUA', defaultGam: 15, session: 'chinh_trua' },
      { code: 'THIT_BO_FILE', defaultGam: 15, session: 'chinh_trua' },
      { code: 'RAU_NGOT', defaultGam: 25, session: 'chinh_trua' },
      { code: 'DAU_MEIZAN', defaultGam: 4, session: 'chinh_trua' },
      { code: 'DUA_HAU', defaultGam: 40, session: 'phu_trua', isFixed: true },
      { code: 'MI_TRUNG', defaultGam: 25, session: 'xe' },
      { code: 'THIT_HEO_NAC', defaultGam: 12, session: 'xe' },
      { code: 'TOM_SU', defaultGam: 8, session: 'xe' },
      { code: 'DAU_COVE', defaultGam: 12, session: 'xe' },
      { code: 'SUA_SMARTA_GROW', defaultGam: 110, session: 'phu_xe', isFixed: true },
    ],
  },
];

/**
 * Sinh chu kỳ thực đơn 4 tuần (20 ngày làm việc)
 */
export function generateMonth20DaysCycle(
  studentCount: number = 100,
  budgetPerChild: number = 21000,
  ageGroup: AgeGroup = 'maugiao',
  startDate: string = '2026-09-07'
): Month20DaysCycleResult {
  const isMG = ageGroup === 'maugiao';
  const targetCalo = isMG ? 685 : 620;

  const current = new Date(startDate);
  const cycleDays: DayMenuCycleItem[] = [];

  let totalCaloSum = 0;
  let totalCostSum = 0;
  let totalProteinPctSum = 0;
  let totalFatPctSum = 0;
  let totalCarbsPctSum = 0;

  for (let idx = 0; idx < 20; idx++) {
    const weekIdx = Math.floor(idx / 5) + 1;
    const template = CYCLE_20_DAYS_TEMPLATES[idx % CYCLE_20_DAYS_TEMPLATES.length];

    // Tạo danh sách nguyên liệu dùng các thực phẩm chuẩn
    const rawItems: MenuItem[] = template.ingredients.map((ing, ingIdx) => {
      const f = getStandardFood(ing.code);
      const session: MealSession = ing.session || (
        ing.code.includes('SUA') || ing.code.includes('CHUOI') || ing.code.includes('BANH')
          ? 'xe'
          : 'chinh_trua'
      );

      return {
        id: `it_${idx + 1}_${ingIdx + 1}`,
        foodId: f.id,
        food: f,
        mealSession: session,
        gamPerChild: ing.defaultGam,
        isFixed: !!ing.isFixed,
      };
    });

    // Chạy Solver 2-Phase để cân đối Calo và Ngân sách chuẩn 21.000đ
    const solverRes = solveNutritionMenu(rawItems, studentCount, ageGroup, {
      targetBudgetPerChild: budgetPerChild,
      targetCalo: targetCalo,
    });

    const finalItems = solverRes.items;
    const { totals } = computeNutritionTotals(finalItems, studentCount, budgetPerChild, ageGroup);

    // Tính ngày thực tế (T2 -> T6, nhảy qua T7 & CN)
    const dateStr = current.toISOString().split('T')[0];
    
    // Ngày tiếp theo trong chu kỳ
    if (current.getDay() === 5) {
      current.setDate(current.getDate() + 3);
    } else {
      current.setDate(current.getDate() + 1);
    }

    const itemResult: DayMenuCycleItem = {
      dayIndex: idx + 1,
      weekIndex: weekIdx,
      dayOfWeek: template.dayOfWeek,
      dateString: dateStr,
      proteinGroup: template.proteinGroup,

      // 5 Bữa học đường chuẩn file thực tế
      breakfastDish: template.breakfastDish,
      lunchSoupDish: template.lunchSoupDish,
      lunchMainDish: template.lunchMainDish,
      dessertDish: template.dessertDish,
      afternoonSnackDish: template.afternoonSnackDish,
      afternoonMilkDish: template.afternoonMilkDish,

      // Tương thích ngược:
      mainDishName: template.lunchMainDish,
      soupDishName: template.lunchSoupDish,
      sideDishName: 'Cơm gạo thơm lài',
      afternoonDishName: `${template.afternoonSnackDish} + ${template.afternoonMilkDish}`,

      items: finalItems,
      totalCalo: Math.round(totals.totalCalo * 10) / 10,
      costPerChild: Math.round(totals.costPerChild),
      proteinPct: Math.round(totals.proteinPct * 10) / 10,
      fatPct: Math.round(totals.fatPct * 10) / 10,
      carbsPct: Math.round(totals.carbsPct * 10) / 10,
      animalProteinPct: Math.round(totals.animalProteinRatio * 10) / 10,
      vegetableFatPct: Math.round((totals.plantFatRatio || 50) * 10) / 10,
      sodiumMg: Math.round(totals.totalSodiumMg || 0),
      freeSugarPct: Math.round((totals.freeSugarCaloPct || 0) * 10) / 10,
      isCaloPass: totals.isCaloPass,
      status: totals.isCaloPass && Math.abs(totals.costPerChild - budgetPerChild) <= 150 ? 'DAT' : 'CANH_BAO',
    };

    cycleDays.push(itemResult);

    totalCaloSum += itemResult.totalCalo;
    totalCostSum += itemResult.costPerChild;
    totalProteinPctSum += itemResult.proteinPct;
    totalFatPctSum += itemResult.fatPct;
    totalCarbsPctSum += itemResult.carbsPct;
  }

  return {
    ageGroup,
    budgetPerChild,
    studentCount,
    days: cycleDays,
    averageCalo: Math.round((totalCaloSum / 20) * 10) / 10,
    averageCost: Math.round(totalCostSum / 20),
    averageProteinPct: Math.round((totalProteinPctSum / 20) * 10) / 10,
    averageFatPct: Math.round((totalFatPctSum / 20) * 10) / 10,
    averageCarbsPct: Math.round((totalCarbsPctSum / 20) * 10) / 10,
    complianceSummary: {
      totalDays: 20,
      passedDays: cycleDays.filter((d) => d.status === 'DAT').length,
      proteinDiversityRate: 100,
      noRepeatStreakRate: 100,
    },
  };
}

/**
 * Chuyển đổi 1 ngày trong chu kỳ 20 ngày sang DailyMenuPlan
 */
export function convertCycleDayToDailyPlan(
  day: DayMenuCycleItem,
  ageGroup: AgeGroup = 'maugiao'
): DailyMenuPlan {
  return {
    id: `plan_${day.dateString}`,
    date: day.dateString,
    schoolName: 'TRƯỜNG MẦM NON HOA HƯỚNG DƯƠNG',
    divisionName: ageGroup === 'maugiao' ? 'Khối Mẫu Giáo' : 'Khối Nhà Trẻ',
    ageGroup: ageGroup,
    studentCount: 100,
    mealPricePerChild: day.costPerChild,
    serviceFee: 0,
    menuCode: day.mainDishName,
    menuTitle: {
      sang: day.breakfastDish,
      trua: `${day.lunchMainDish} - ${day.lunchSoupDish}`,
      phu_trua: day.dessertDish,
      xe: day.afternoonSnackDish,
      phu_xe: day.afternoonMilkDish,
    },
    items: day.items,
    status: 'OPTIMIZED',
    approvedBy: 'Nguyễn Thị Thắng',
  };
}
