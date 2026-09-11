import { AgeGroup, MenuStatus } from '@/types/nutrition';
import { BaseRepository } from '../base-repository';
import {
  IMenuRepository,
  DailyMenuRow,
  DailyMenuItemRow,
  DailyMenuInsert,
  DailyMenuItemInsert,
} from '../interfaces/IMenuRepository';

/**
 * MenuRepository — Quản lý thực đơn hàng ngày trên Supabase.
 *
 * Kế thừa BaseRepository<DailyMenuRow> để có sẵn:
 * findById, findAll, create, update, delete, upsert
 *
 * Implements IMenuRepository để đảm bảo contract đầy đủ.
 */
export class MenuRepository
  extends BaseRepository<DailyMenuRow, DailyMenuInsert, Partial<DailyMenuInsert>>
  implements IMenuRepository
{
  constructor() {
    super('daily_menus');
  }

  /**
   * Lấy thực đơn theo ngày + phân hệ.
   * RLS tự động lọc theo tenant của user hiện tại.
   */
  async findByDateAndSegment(date: string, segment: AgeGroup): Promise<DailyMenuRow | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('menu_date', date)
      .eq('segment', segment)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`[MenuRepository] findByDateAndSegment error: ${error.message}`);
    }
    return data as DailyMenuRow;
  }

  /**
   * Lấy danh sách items của 1 thực đơn, sắp xếp theo bữa ăn + thứ tự.
   */
  async findMenuItems(menuId: string): Promise<DailyMenuItemRow[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from('daily_menu_items')
      .select('*')
      .eq('menu_id', menuId)
      .order('meal_session')
      .order('sort_order');

    if (error) {
      throw new Error(`[MenuRepository] findMenuItems error: ${error.message}`);
    }
    return (data ?? []) as DailyMenuItemRow[];
  }

  /**
   * Lưu thực đơn (upsert theo tenant_id + school_id + menu_date + segment).
   */
  async saveMenu(menu: DailyMenuInsert): Promise<DailyMenuRow> {
    return this.upsert(menu, 'tenant_id,school_id,menu_date,segment');
  }

  /**
   * Xóa toàn bộ items cũ rồi insert lại (atomic replace).
   * Sử dụng khi lưu thực đơn có thay đổi danh sách thực phẩm.
   */
  async replaceMenuItems(
    menuId: string,
    tenantId: string,
    items: Omit<DailyMenuItemInsert, 'menu_id' | 'tenant_id'>[]
  ): Promise<void> {
    const client = await this.getClient();

    // 1. Xóa items cũ
    const { error: deleteError } = await client
      .from('daily_menu_items')
      .delete()
      .eq('menu_id', menuId);

    if (deleteError) {
      throw new Error(`[MenuRepository] replaceMenuItems delete error: ${deleteError.message}`);
    }

    if (items.length === 0) return;

    // 2. Insert items mới
    const rows: DailyMenuItemInsert[] = items.map((item, idx) => ({
      ...item,
      menu_id: menuId,
      tenant_id: tenantId,
      sort_order: item.sort_order ?? idx + 1,
    }));

    const { error: insertError } = await client
      .from('daily_menu_items')
      .insert(rows);

    if (insertError) {
      throw new Error(`[MenuRepository] replaceMenuItems insert error: ${insertError.message}`);
    }
  }

  /**
   * Lấy danh sách thực đơn trong khoảng ngày (lịch tuần).
   */
  async findByDateRange(
    fromDate: string,
    toDate: string,
    segment: AgeGroup
  ): Promise<DailyMenuRow[]> {
    const client = await this.getClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('segment', segment)
      .gte('menu_date', fromDate)
      .lte('menu_date', toDate)
      .order('menu_date');

    if (error) {
      throw new Error(`[MenuRepository] findByDateRange error: ${error.message}`);
    }
    return (data ?? []) as DailyMenuRow[];
  }

  /**
   * Cập nhật trạng thái thực đơn (DRAFT → APPROVED → LOCKED).
   */
  async updateStatus(
    menuId: string,
    status: MenuStatus,
    approvedBy?: string
  ): Promise<DailyMenuRow> {
    return this.update(menuId, {
      status,
      ...(approvedBy ? { approved_by: approvedBy, approved_at: new Date().toISOString() } : {}),
    });
  }
}
