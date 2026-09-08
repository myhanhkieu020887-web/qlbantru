export type FoodCategory =
  | 'gao'
  | 'thit_ca'
  | 'rau_cu'
  | 'gia_vi'
  | 'dau_mo'
  | 'sua_banh'
  | 'khac';

export type AllergenType =
  | 'peanut'
  | 'crustacean'
  | 'fish'
  | 'mollusc'
  | 'milk'
  | 'egg'
  | 'soy'
  | 'gluten'
  | 'sesame'
  | 'nuts';

export interface FoodItem {
  id: string;
  code: string;
  name: string;
  category: FoodCategory;
  unit: string;
  price: number;
  stepSize?: number;
  gamExchange: number;
  wasteFactor: number;
  isAnimalProtein: boolean;
  isAnimalFat: boolean;
  isFreeSugar: boolean;
  sodiumMg: number;
  protein100g: number;
  fat100g: number;
  carbs100g: number;
  calciumMg?: number;
  phosphorusMg?: number;
  ironMg?: number;
  vitaminB1Mg?: number;
  vitaminCMg?: number;
  isFixed?: boolean;
  allergens?: AllergenType[];
}

export type AgeGroup = 'maugiao' | 'nhatre' | 'ansang';

export type MealSession = 'sang' | 'chinh_trua' | 'phu_trua' | 'xe' | 'phu_xe';

export type MenuStatus = 'DRAFT' | 'OPTIMIZED' | 'APPROVED' | 'LOCKED';

export interface MenuItem {
  id: string;
  foodId: string;
  food: FoodItem;
  mealSession: MealSession;
  gamPerChild: number;
  note?: string;
  isFixed?: boolean;
}

export interface ComputedMenuItem extends MenuItem {
  actualEatKg: number;
  actualBuyKg: number;
  actualBuyUnit: number;
  unitPrice: number;
  totalPrice: number;
  proteinAnimal: number;
  proteinPlant: number;
  fatAnimal: number;
  fatPlant: number;
  carbs: number;
  calo: number;
  sodiumMg: number;
  calciumMg: number;
  phosphorusMg: number;
  ironMg: number;
  vitaminB1Mg: number;
  vitaminCMg: number;
}

export interface NutritionTotals {
  studentCount: number;
  budgetPerChild: number;
  totalBudget: number;
  totalCost: number;
  costPerChild: number;
  budgetDifference: number;

  // Năng lượng Atwater
  proteinAnimalG: number;
  proteinPlantG: number;
  totalProteinG: number;
  fatAnimalG: number;
  fatPlantG: number;
  totalFatG: number;
  carbsG: number;
  totalCalo: number;

  // Tỷ lệ cơ cấu P - L - G (%)
  proteinPct: number;
  fatPct: number;
  carbsPct: number;

  // Tỷ lệ nguồn gốc (%)
  animalProteinRatio: number;
  plantFatRatio: number;

  // Kiểm soát QĐ 2195/QĐ-BGDĐT
  totalSodiumMg: number;
  freeSugarCaloPct: number;
  costPerCalo: number;

  // Vi chất dinh dưỡng
  calciumMg: number;
  phosphorusMg: number;
  calciumPhosphorusRatio: number; // Tỷ lệ Canxi / Photpho (Ca:P)
  ironMg: number;
  vitaminB1Mg: number;
  vitaminCMg: number;

  // Đánh giá tuân thủ
  isCaloPass: boolean;
  isRatioPass: boolean;
  isAnimalProteinPass: boolean;
  isPlantFatPass: boolean;
  isSodiumPass: boolean;
  isSugarPass: boolean;
  isCaPRatioPass: boolean;
  isIronPass: boolean;
  compliancePassed: boolean;
}

export interface DailyMenuPlan {
  id: string;
  date: string;
  schoolName: string;
  divisionName: string;
  ageGroup: AgeGroup;
  studentCount: number;
  mealPricePerChild: number;
  serviceFee: number;
  menuCode: string;
  menuTitle: {
    sang?: string;
    trua?: string;
    phu_trua?: string;
    xe?: string;
    phu_xe?: string;
  };
  items: MenuItem[];
  status: MenuStatus;
  approvedBy?: string;
  approvedAt?: string;
}

// Module 3: Điểm danh lớp học
export interface ClassAttendanceItem {
  id: string;
  className: string;
  grade: 'nhatre' | 'mam' | 'choi' | 'la';
  ageGroup: AgeGroup;
  teacherName: string;
  registeredCount: number; // Đăng ký
  absentCount: number;     // Nghỉ
  actualCount: number;     // Ăn thực tế = Đăng ký - Nghỉ
  breakfastCount: number;  // Trẻ đăng ký ăn sáng
  note?: string;
}

// Module 2: Một ngày đầy đủ gồm 3 phân hệ
export interface DayMenuBundle {
  date: string;
  dayOfWeek: string; // Thứ Hai, Thứ Ba...
  maugiao: DailyMenuPlan;
  nhatre: DailyMenuPlan;
  ansang: DailyMenuPlan;
}

// Module 1: Tuần thực đơn
export interface WeekMenuSchedule {
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: DayMenuBundle[];
}

// ==========================================
// GIAI ĐOẠN 2: LOGISTICS & SMART PO
// ==========================================

export type SupplierType = 'thit_ca' | 'rau_cu' | 'gia_vi' | 'sua_banh' | 'gao_bun';

export interface SupplierInfo {
  id: SupplierType;
  name: string;
  categoryName: string;
  deliveryTime: string;
  contactName: string;
  phone: string;
  iconName: string;
}

export interface PurchaseOrderItem {
  foodCode: string;
  foodName: string;
  category: string;
  unit: string;
  buyQuantity: number;
  unitPrice: number;
  totalCost: number;
  mealSession: MealSession;
}

export interface SmartPurchaseOrder {
  supplierId: SupplierType;
  supplier: SupplierInfo;
  date: string;
  items: PurchaseOrderItem[];
  totalCost: number;
  status: 'PENDING' | 'SENT' | 'RECEIVED';
}

// ==========================================
// GIAI ĐOẠN 2: KIỂM THỰC 3 BƯỚC (QĐ 1246 & CV 423)
// ==========================================

export interface FoodSafetyStep1 {
  checkedAt: string; // 06:00
  inspector: string;
  passedSensory: boolean; // Cảm quan màu, mùi
  passedPackaging: boolean; // Bao bì nguyên vẹn
  passedOrigin: boolean; // Nguồn gốc rõ ràng / hóa đơn
  tempDeliveryC: number; // Nhiệt độ xe lạnh / bảo quản
  note?: string;
}

export interface CookedDishCheck {
  dishName: string;
  mealSession: string;
  cookedTime: string;
  coreTemperatureC: number; // >= 75°C
  sensoryPassed: boolean;
}

export interface FoodSafetyStep2 {
  checkedAt: string; // 09:30
  chefName: string;
  dishes: CookedDishCheck[];
  allCoreTempsPassed: boolean; // Tất cả >= 75°C
  note?: string;
}

export interface FoodSafetyStep3 {
  checkedAt: string; // 10:15
  sampleKeeper: string;
  sealCode: string; // Mã niêm phong hũ mẫu
  sampleWeightG: number; // >= 100g
  fridgeTempC: number; // 2 - 8°C
  storageDurationHours: number; // 24h
  discardPlanAt: string;
  isLocked: boolean;
}

export interface FoodSafetyAuditRecord {
  id: string;
  date: string;
  step1: FoodSafetyStep1;
  step2: FoodSafetyStep2;
  step3: FoodSafetyStep3;
  isDistributionUnlocked: boolean; // Cờ mở khóa chia ăn
}

