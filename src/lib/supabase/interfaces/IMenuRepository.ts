import { AgeGroup, MenuStatus } from '@/types/nutrition';

/** Row type ánh xạ 1:1 bảng daily_menus trên Supabase */
export interface DailyMenuRow {
  id: string;
  tenant_id: string;
  school_id: string;
  menu_date: string;
  segment: AgeGroup;
  student_count: number;
  budget_per_student: number;
  status: MenuStatus;
  menu_title: Record<string, string>;
  menu_code: string | null;
  approved_by: string | null;
  approved_at: string | null;
  total_calo: number | null;
  protein_pct: number | null;
  lipid_pct: number | null;
  carbs_pct: number | null;
  total_cost: number | null;
  compliance_passed: boolean | null;
  initial_difference: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Row type ánh xạ 1:1 bảng daily_menu_items */
export interface DailyMenuItemRow {
  id: string;
  menu_id: string;
  tenant_id: string;
  food_id: string | null;
  food_code: string;
  food_name: string;
  meal_session: string;
  gam_per_child: number;
  dish_id: string | null;
  dish_name: string | null;
  is_fixed: boolean;
  buy_quantity: number | null;
  unit_price: number | null;
  line_total: number | null;
  sort_order: number;
  branch_quantities: Record<string, number> | null;
  created_at: string;
}

export type DailyMenuInsert = Omit<DailyMenuRow, 'id' | 'created_at' | 'updated_at'>;
export type DailyMenuUpdate = Partial<Omit<DailyMenuRow, 'id' | 'tenant_id' | 'created_at'>>;
export type DailyMenuItemInsert = Omit<DailyMenuItemRow, 'id' | 'created_at'>;

/** Contract interface cho MenuRepository */
export interface IMenuRepository {
  /** Lấy thực đơn theo ngày + phân hệ (trả về null nếu chưa có) */
  findByDateAndSegment(date: string, segment: AgeGroup): Promise<DailyMenuRow | null>;

  /** Lấy danh sách món trong 1 thực đơn */
  findMenuItems(menuId: string): Promise<DailyMenuItemRow[]>;

  /** Lưu thực đơn (upsert theo date + segment + tenant) */
  saveMenu(menu: DailyMenuInsert): Promise<DailyMenuRow>;

  /** Xóa toàn bộ items của 1 menu_id rồi insert lại */
  replaceMenuItems(menuId: string, tenantId: string, items: Omit<DailyMenuItemInsert, 'menu_id' | 'tenant_id'>[]): Promise<void>;

  /** Lấy thực đơn theo khoảng ngày (cho trang lịch tuần) */
  findByDateRange(fromDate: string, toDate: string, segment: AgeGroup): Promise<DailyMenuRow[]>;

  /** Cập nhật trạng thái thực đơn */
  updateStatus(menuId: string, status: MenuStatus, approvedBy?: string): Promise<DailyMenuRow>;
}
