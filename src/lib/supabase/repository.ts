import { supabase } from './client';
import { MenuItem, NutritionTotals } from '@/types/nutrition';

export const HAMTHANG_TENANT_ID = 'a1111111-1111-1111-1111-111111111111';

export interface MenuSyncPayload {
  date: string;
  segment: string;
  studentCount: number;
  budgetPerStudent: number;
  status: string;
  items: MenuItem[];
  summary: NutritionTotals;
}

export interface AttendanceRecordPayload {
  classroomId: string;
  className: string;
  totalRegistered: number;
  absentCount: number;
  presentCount: number;
  excusedCount: number;
  unexcusedCount: number;
  notes?: string;
}

export async function saveDailyMenuToSupabase(payload: MenuSyncPayload): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Chưa cấu hình Supabase' };

  try {
    // 1. Upsert Daily Menu
    const { data: menuData, error: menuError } = await supabase
      .from('daily_menus')
      .upsert(
        {
          tenant_id: HAMTHANG_TENANT_ID,
          menu_date: payload.date,
          segment: payload.segment,
          student_count: payload.studentCount,
          budget_per_student: payload.budgetPerStudent,
          status: payload.status,
          total_calo: payload.summary.totalCalo,
          protein_pct: payload.summary.proteinPct,
          lipid_pct: payload.summary.fatPct,
          carbs_pct: payload.summary.carbsPct,
          sodium_total_mg: payload.summary.totalSodiumMg,
          free_sugar_pct: payload.summary.freeSugarCaloPct,
          total_cost: payload.summary.totalCost,
          compliance_passed: payload.summary.compliancePassed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,menu_date,segment' }
      )
      .select('id')
      .single();

    if (menuError) {
      console.warn('[Supabase Sync Warning] daily_menus:', menuError.message);
      return { success: false, error: menuError.message };
    }

    const menuId = menuData?.id;
    if (!menuId) return { success: true };

    // 2. Delete existing items and insert new ones
    await supabase.from('daily_menu_items').delete().eq('menu_id', menuId);

    const itemsToInsert = payload.items.map((item, index) => {
      const buyQty = Number(
        ((item.gamPerChild * payload.studentCount) / (item.food?.gamExchange || 1000)).toFixed(2)
      );
      const lineCost = Number((buyQty * (item.food?.price || 0)).toFixed(2));

      return {
        menu_id: menuId,
        food_code: item.food?.code || 'UNKNOWN',
        food_name: item.food?.name || 'Thực phẩm',
        meal_type: item.mealSession,
        raw_weight_per_student: item.gamPerChild,
        buy_quantity: buyQty,
        unit_price: item.food?.price || 0,
        line_total: lineCost,
        is_locked: Boolean(item.isFixed),
        sort_order: index + 1,
      };
    });

    if (itemsToInsert.length > 0) {
      const { error: itemsError } = await supabase.from('daily_menu_items').insert(itemsToInsert);
      if (itemsError) {
        console.warn('[Supabase Sync Warning] daily_menu_items:', itemsError.message);
      }
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
    console.warn('[Supabase Sync Exception]:', msg);
    return { success: false, error: msg };
  }
}

export async function saveAttendanceToSupabase(
  date: string,
  records: AttendanceRecordPayload[]
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Chưa cấu hình Supabase' };

  try {
    const rows = records.map((r) => ({
      tenant_id: HAMTHANG_TENANT_ID,
      attendance_date: date,
      classroom_id: r.classroomId,
      total_students: r.totalRegistered,
      absent_count: r.absentCount,
      present_count: r.presentCount,
      excused_count: r.excusedCount,
      unexcused_count: r.unexcusedCount,
      note: r.notes || '',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('daily_attendance')
      .upsert(rows, { onConflict: 'tenant_id,attendance_date,classroom_id' });

    if (error) {
      console.warn('[Supabase Attendance Sync Warning]:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
    return { success: false, error: msg };
  }
}
