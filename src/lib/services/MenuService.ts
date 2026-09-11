import { DailyMenuPlan, MenuItem, AgeGroup, MenuStatus } from '@/types/nutrition';
import { NutritionTotals } from '@/types/nutrition';
import { MenuRepository } from '../supabase/repositories/MenuRepository';
import { FoodRepository } from '../supabase/repositories/FoodRepository';
import { DailyMenuInsert, DailyMenuItemInsert } from '../supabase/interfaces/IMenuRepository';

// Tenant + School cố định cho Hàm Thắng
// Sau này sẽ lấy động từ user profile
const HAMTHANG_TENANT_ID = 'a1111111-1111-1111-1111-111111111111';
const HAMTHANG_SCHOOL_ID = 'b2222222-2222-2222-2222-222222222222';

/**
 * MenuService — Business logic layer cho thực đơn hàng ngày.
 *
 * Trách nhiệm:
 * - Orchestrate giữa MenuRepository và FoodRepository
 * - Chuyển đổi giữa domain model (DailyMenuPlan) và DB rows
 * - Xử lý logic nghiệp vụ (seed, validate, calculate)
 */
export class MenuService {
  private readonly menuRepo: MenuRepository;
  private readonly foodRepo: FoodRepository;

  constructor() {
    this.menuRepo = new MenuRepository();
    this.foodRepo = new FoodRepository();
  }

  /**
   * Lấy thực đơn theo ngày + phân hệ.
   * Trả về null nếu chưa có dữ liệu trên cloud.
   */
  async getDailyMenu(date: string, segment: AgeGroup): Promise<DailyMenuPlan | null> {
    try {
      const menuRow = await this.menuRepo.findByDateAndSegment(date, segment);
      if (!menuRow) return null;

      // Lấy danh sách items
      const itemRows = await this.menuRepo.findMenuItems(menuRow.id);

      // Lấy food catalog để map food data
      const allFoods = await this.foodRepo.findAllActive();
      const foodMap = new Map(allFoods.map((f) => [f.code, f]));

      // Chuyển đổi DB rows → DailyMenuPlan
      const items: MenuItem[] = itemRows.map((row) => {
        const food = foodMap.get(row.food_code);
        return {
          id: row.id,
          foodId: row.food_id ?? row.food_code,
          food: food
            ? {
                id: food.id,
                code: food.code,
                name: food.name,
                category: food.category,
                unit: food.unit,
                price: food.price,
                stepSize: food.step_size ?? undefined,
                gamExchange: food.gam_exchange,
                wasteFactor: food.waste_factor,
                isAnimalProtein: food.is_animal_protein,
                isAnimalFat: food.is_animal_fat,
                isFreeSugar: food.is_free_sugar,
                sodiumMg: food.sodium_mg,
                protein100g: food.protein_100g,
                fat100g: food.fat_100g,
                carbs100g: food.carbs_100g,
                calciumMg: food.calcium_mg ?? undefined,
                phosphorusMg: food.phosphorus_mg ?? undefined,
                ironMg: food.iron_mg ?? undefined,
                vitaminB1Mg: food.vitamin_b1_mg ?? undefined,
                vitaminCMg: food.vitamin_c_mg ?? undefined,
                isWarehouseItem: food.is_warehouse_item,
                allergens: food.allergens as never[],
              }
            : ({
                id: row.food_code,
                code: row.food_code,
                name: row.food_name,
                category: 'khac',
                unit: 'Kg',
                price: row.unit_price ?? 0,
                gamExchange: 1000,
                wasteFactor: 1.0,
                isAnimalProtein: false,
                isAnimalFat: false,
                isFreeSugar: false,
                sodiumMg: 0,
                protein100g: 0,
                fat100g: 0,
                carbs100g: 0,
              } as unknown as MenuItem['food']),
          mealSession: row.meal_session as MenuItem['mealSession'],
          gamPerChild: row.gam_per_child,
          dishId: row.dish_id ?? undefined,
          dishName: row.dish_name ?? undefined,
          isFixed: row.is_fixed,
          branchQuantities: row.branch_quantities ?? undefined,
        };
      });

      const plan: DailyMenuPlan = {
        id: menuRow.id,
        date: menuRow.menu_date,
        schoolName: 'Trường Mẫu Giáo Hàm Thắng',
        divisionName: 'UBND PHƯỜNG HÀM THẮNG',
        ageGroup: menuRow.segment,
        studentCount: menuRow.student_count,
        mealPricePerChild: menuRow.budget_per_student,
        serviceFee: 0,
        status: menuRow.status,
        menuCode: menuRow.menu_code ?? '',
        menuTitle: (menuRow.menu_title ?? {}) as DailyMenuPlan['menuTitle'],
        items,
        initialDifference: menuRow.initial_difference,
      };
      return plan;
    } catch (err) {
      console.warn('[MenuService] getDailyMenu error:', err);
      return null;
    }
  }

  /**
   * Lưu thực đơn lên Supabase (upsert + replace items).
   */
  async saveMenu(
    plan: DailyMenuPlan,
    totals: NutritionTotals
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const menuInsert: DailyMenuInsert = {
        tenant_id: HAMTHANG_TENANT_ID,
        school_id: HAMTHANG_SCHOOL_ID,
        menu_date: plan.date,
        segment: plan.ageGroup,
        student_count: plan.studentCount,
        budget_per_student: plan.mealPricePerChild,
        status: plan.status,
        menu_title: plan.menuTitle ?? {},
        menu_code: plan.menuCode ?? null,
        approved_by: plan.approvedBy ?? null,
        approved_at: plan.approvedAt ?? null,
        total_calo: totals.totalCalo,
        protein_pct: totals.proteinPct,
        lipid_pct: totals.fatPct,
        carbs_pct: totals.carbsPct,
        total_cost: totals.totalCost,
        compliance_passed: totals.compliancePassed,
        initial_difference: plan.initialDifference ?? 0,
        created_by: null,
      };

      const savedMenu = await this.menuRepo.saveMenu(menuInsert);

      // Chuẩn bị danh sách items để replace
      const items: Omit<DailyMenuItemInsert, 'menu_id' | 'tenant_id'>[] =
        plan.items.map((item, idx) => {
          const buyQty = Number(
            ((item.gamPerChild * plan.studentCount) / (item.food?.gamExchange || 1000)).toFixed(4)
          );
          const lineCost = Number((buyQty * (item.food?.price || 0)).toFixed(2));
          return {
            food_id: item.foodId?.startsWith('food_') ? undefined : item.foodId,
            food_code: item.food?.code ?? 'UNKNOWN',
            food_name: item.food?.name ?? 'Thực phẩm',
            meal_session: item.mealSession,
            gam_per_child: item.gamPerChild,
            dish_id: item.dishId ?? null,
            dish_name: item.dishName ?? null,
            is_fixed: Boolean(item.isFixed),
            buy_quantity: buyQty,
            unit_price: item.food?.price ?? 0,
            line_total: lineCost,
            sort_order: idx + 1,
            branch_quantities: item.branchQuantities ?? null,
          } as Omit<DailyMenuItemInsert, 'menu_id' | 'tenant_id'>;
        });

      await this.menuRepo.replaceMenuItems(savedMenu.id, HAMTHANG_TENANT_ID, items);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      console.error('[MenuService] saveMenu error:', msg);
      return { success: false, error: msg };
    }
  }
}
