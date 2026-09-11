import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { MenuService } from '@/lib/services/MenuService';
import { AgeGroup } from '@/types/nutrition';

const menuService = new MenuService();

/**
 * GET /api/menus?date=2026-09-09&segment=maugiao
 * Lấy thực đơn theo ngày + phân hệ.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const segment = searchParams.get('segment') as AgeGroup | null;

  if (!date || !segment) {
    return NextResponse.json(
      { error: 'Thiếu tham số date hoặc segment' },
      { status: 400 }
    );
  }

  try {
    const menu = await menuService.getDailyMenu(date, segment);
    return NextResponse.json({ data: menu });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/menus
 * Lưu thực đơn lên Supabase.
 * Body: { plan: DailyMenuPlan, totals: NutritionTotals }
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { plan, totals } = body;

    if (!plan || !totals) {
      return NextResponse.json({ error: 'Thiếu dữ liệu plan hoặc totals' }, { status: 400 });
    }

    const result = await menuService.saveMenu(plan, totals);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
