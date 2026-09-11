import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { MenuCycleService } from '@/lib/services/MenuCycleService';
import { MenuService } from '@/lib/services/MenuService';
import { AgeGroup } from '@/types/nutrition';
import { computeNutritionTotals } from '@/engine/atwater';

const cycleService = new MenuCycleService();
const menuService = new MenuService();

/**
 * POST /api/menus/fill-month
 * Tự động fill thực đơn cả tháng theo chu kỳ 4 tuần A/B/C/D.
 *
 * Body: { month: number, year: number, segment: AgeGroup, studentCount: number, budgetPerStudent: number }
 * Response: { total, filled, skipped, errors[] }
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { month, year, segment, studentCount, budgetPerStudent } =
      (await request.json()) as {
        month: number;
        year: number;
        segment: AgeGroup;
        studentCount: number;
        budgetPerStudent: number;
      };

    if (!month || !year || !segment) {
      return NextResponse.json({ error: 'Thiếu tham số month, year hoặc segment' }, { status: 400 });
    }

    // 1. Tạo kế hoạch fill cho cả tháng
    const cycleResult = cycleService.buildMonthPlan(
      month,
      year,
      segment,
      studentCount ?? 1210,
      budgetPerStudent ?? 21000
    );

    // 2. Lưu từng ngày có plan lên Supabase
    const errors: string[] = [];
    let savedCount = 0;

    for (const day of cycleResult.days) {
      if (day.skipped || !day.plan) continue;

      try {
        const { totals } = computeNutritionTotals(
          day.plan.items,
          day.plan.studentCount,
          day.plan.mealPricePerChild,
          day.plan.ageGroup
        );

        const result = await menuService.saveMenu(day.plan, totals);
        if (result.success) {
          savedCount++;
        } else {
          errors.push(`${day.date}: ${result.error}`);
        }
      } catch (err) {
        errors.push(`${day.date}: ${err instanceof Error ? err.message : 'Lỗi'}`);
      }
    }

    return NextResponse.json({
      success: true,
      total: cycleResult.totalDays,
      filled: savedCount,
      skipped: cycleResult.skippedDays,
      templateMissing: cycleResult.days.filter((d) => !d.templateFound && !d.skipped).length,
      errors,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
