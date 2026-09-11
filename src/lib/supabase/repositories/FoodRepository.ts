import { BaseRepository } from '../base-repository';
import {
  IFoodRepository,
  FoodItemRow,
  FoodItemInsert,
  FoodItemUpdate,
} from '../interfaces/IFoodRepository';

/**
 * FoodRepository — Quản lý danh mục thực phẩm.
 * Kế thừa BaseRepository và implements IFoodRepository.
 */
export class FoodRepository
  extends BaseRepository<FoodItemRow, FoodItemInsert, FoodItemUpdate>
  implements IFoodRepository
{
  constructor() {
    super('food_items');
  }

  /**
   * Lấy toàn bộ thực phẩm đang active của tenant hiện tại.
   * Sắp xếp theo category rồi name.
   */
  async findAllActive(): Promise<FoodItemRow[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name');

    if (error) {
      throw new Error(`[FoodRepository] findAllActive error: ${error.message}`);
    }
    return (data ?? []) as FoodItemRow[];
  }

  /**
   * Tìm thực phẩm theo code (VD: 'GAO_THOM', 'THIT_HEO_NAC').
   */
  async findByCode(code: string): Promise<FoodItemRow | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`[FoodRepository] findByCode error: ${error.message}`);
    }
    return data as FoodItemRow;
  }

  /**
   * Upsert toàn bộ danh sách thực phẩm từ seed data.
   * Dùng khi khởi tạo tenant lần đầu hoặc cập nhật bảng giá hàng loạt.
   * Conflict: (tenant_id, code)
   */
  async upsertBatch(foods: FoodItemInsert[]): Promise<void> {
    if (foods.length === 0) return;
    const client = await this.getClient();

    // Batch theo chunks 100 để tránh timeout
    const chunkSize = 100;
    for (let i = 0; i < foods.length; i += chunkSize) {
      const chunk = foods.slice(i, i + chunkSize);
      const { error } = await client
        .from(this.tableName)
        .upsert(chunk, { onConflict: 'tenant_id,code' });

      if (error) {
        throw new Error(`[FoodRepository] upsertBatch error at chunk ${i}: ${error.message}`);
      }
    }
  }

  /**
   * Cập nhật đơn giá thực phẩm.
   */
  async updatePrice(id: string, price: number): Promise<FoodItemRow> {
    return this.update(id, { price } as FoodItemUpdate);
  }

  /**
   * Tìm kiếm thực phẩm theo tên (cho autocomplete).
   */
  async search(query: string, limit = 20): Promise<FoodItemRow[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(limit);

    if (error) {
      throw new Error(`[FoodRepository] search error: ${error.message}`);
    }
    return (data ?? []) as FoodItemRow[];
  }
}
