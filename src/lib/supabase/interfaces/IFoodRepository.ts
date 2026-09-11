import { FoodCategory } from '@/types/nutrition';

/** Row type ánh xạ 1:1 bảng food_items trên Supabase */
export interface FoodItemRow {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  category: FoodCategory;
  unit: string;
  price: number;
  step_size: number | null;
  gam_exchange: number;
  waste_factor: number;
  is_animal_protein: boolean;
  is_animal_fat: boolean;
  is_free_sugar: boolean;
  sodium_mg: number;
  protein_100g: number;
  fat_100g: number;
  carbs_100g: number;
  calcium_mg: number | null;
  phosphorus_mg: number | null;
  iron_mg: number | null;
  vitamin_b1_mg: number | null;
  vitamin_c_mg: number | null;
  is_warehouse_item: boolean;
  allergens: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type FoodItemInsert = Omit<FoodItemRow, 'id' | 'created_at' | 'updated_at'>;
export type FoodItemUpdate = Partial<Omit<FoodItemRow, 'id' | 'tenant_id' | 'created_at'>>;

/** Contract interface cho FoodRepository */
export interface IFoodRepository {
  /** Lấy toàn bộ danh mục thực phẩm đang active */
  findAllActive(): Promise<FoodItemRow[]>;

  /** Tìm thực phẩm theo code (trong tenant) */
  findByCode(code: string): Promise<FoodItemRow | null>;

  /** Upsert danh sách thực phẩm (dùng khi sync seed data lần đầu) */
  upsertBatch(foods: FoodItemInsert[]): Promise<void>;

  /** Cập nhật đơn giá thực phẩm */
  updatePrice(id: string, price: number): Promise<FoodItemRow>;

  /** Tìm kiếm theo tên (cho ô search trong AddFoodModal) */
  search(query: string, limit?: number): Promise<FoodItemRow[]>;
}
