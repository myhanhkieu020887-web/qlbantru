import { NextRequest, NextResponse } from 'next/server';
import { solveHighsNutritionMenu } from '@/engine/highs-solver';
import { AgeGroup, MenuItem } from '@/types/nutrition';
import { SolverOptions } from '@/engine/milp-solver';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, studentCount, ageGroup, options } = body as {
      items: MenuItem[];
      studentCount: number;
      ageGroup?: AgeGroup;
      options?: SolverOptions;
    };

    if (!items || !studentCount) {
      return NextResponse.json(
        { success: false, message: 'Thiếu dữ liệu món ăn hoặc số lượng học sinh' },
        { status: 400 }
      );
    }

    const result = await solveHighsNutritionMenu(
      items,
      studentCount,
      ageGroup || 'maugiao',
      options || {}
    );

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi bộ giải MILP HiGHS';
    console.error('API Solver Error:', error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
