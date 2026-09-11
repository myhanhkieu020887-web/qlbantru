import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './server';

/**
 * BaseRepository<T> — Abstract class cho tất cả domain repositories.
 *
 * Triết lý OOP:
 * - Encapsulation: Mọi truy vấn Supabase đều qua class này, không viết rải rác
 * - Inheritance: Các domain repository kế thừa và override nếu cần
 * - Single Responsibility: Mỗi class chỉ phụ trách 1 bảng DB
 *
 * @template T - Row type (đầu ra từ DB)
 * @template TInsert - Type khi INSERT (thường thiếu id, created_at)
 * @template TUpdate - Type khi UPDATE (tất cả field optional)
 */
export abstract class BaseRepository<
  T extends object,
  TInsert extends object = Partial<T>,
  TUpdate extends object = Partial<T>
> {
  protected readonly tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Lấy Supabase client với session hiện tại (server-side).
   * Gọi mỗi lần query để đảm bảo token luôn fresh.
   */
  protected async getClient(): Promise<SupabaseClient> {
    return await createSupabaseServerClient();
  }

  /**
   * Tìm bản ghi theo ID.
   * @throws Error nếu có lỗi DB
   */
  async findById(id: string): Promise<T | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // không tìm thấy
      throw new Error(`[${this.tableName}] findById error: ${error.message}`);
    }
    return data as T;
  }

  /**
   * Lấy tất cả bản ghi (RLS tự lọc theo tenant).
   * @param limit - Số bản ghi tối đa (default 1000)
   */
  async findAll(limit = 1000): Promise<T[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .limit(limit);

    if (error) {
      throw new Error(`[${this.tableName}] findAll error: ${error.message}`);
    }
    return (data ?? []) as T[];
  }

  /**
   * Tạo bản ghi mới.
   * @returns Bản ghi vừa tạo (với id, created_at từ DB)
   */
  async create(data: TInsert): Promise<T> {
    const client = await this.getClient();
    const { data: created, error } = await client
      .from(this.tableName)
      .insert(data as Record<string, unknown>)
      .select('*')
      .single();

    if (error) {
      throw new Error(`[${this.tableName}] create error: ${error.message}`);
    }
    return created as T;
  }

  /**
   * Cập nhật bản ghi theo ID.
   * @returns Bản ghi sau khi cập nhật
   */
  async update(id: string, data: TUpdate): Promise<T> {
    const client = await this.getClient();
    const { data: updated, error } = await client
      .from(this.tableName)
      .update(data as Record<string, unknown>)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`[${this.tableName}] update error: ${error.message}`);
    }
    return updated as T;
  }

  /**
   * Xóa bản ghi theo ID.
   */
  async delete(id: string): Promise<void> {
    const client = await this.getClient();
    const { error } = await client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`[${this.tableName}] delete error: ${error.message}`);
    }
  }

  /**
   * Upsert (INSERT hoặc UPDATE nếu đã tồn tại theo conflict columns).
   * Hữu ích khi đồng bộ dữ liệu từ seed / import.
   */
  async upsert(data: TInsert, conflictColumns: string): Promise<T> {
    const client = await this.getClient();
    const { data: upserted, error } = await client
      .from(this.tableName)
      .upsert(data as Record<string, unknown>, { onConflict: conflictColumns })
      .select('*')
      .single();

    if (error) {
      throw new Error(`[${this.tableName}] upsert error: ${error.message}`);
    }
    return upserted as T;
  }

  /**
   * Đếm số bản ghi (RLS tự lọc).
   */
  async count(): Promise<number> {
    const client = await this.getClient();
    const { count, error } = await client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`[${this.tableName}] count error: ${error.message}`);
    }
    return count ?? 0;
  }
}
