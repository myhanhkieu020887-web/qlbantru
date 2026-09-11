import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { AiMenuService } from '@/lib/services/AiMenuService';
import { AgeGroup } from '@/types/nutrition';

const aiService = new AiMenuService();

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { ageGroup, date, studentCount, budgetPerStudent, recentDishes } =
      (await request.json()) as {
        ageGroup: AgeGroup;
        date: string;
        studentCount: number;
        budgetPerStudent: number;
        recentDishes?: string[];
      };

    if (!ageGroup || !date) {
      return NextResponse.json({ error: 'Thiếu ageGroup hoặc date' }, { status: 400 });
    }

    const suggestion = await aiService.generateSuggestion(
      ageGroup,
      date,
      studentCount || 1210,
      budgetPerStudent || 21000,
      recentDishes || []
    );

    return NextResponse.json({ data: suggestion });
  } catch (error) {
    console.error('[AI Menu Suggestion Error]:', error);
    const msg = error instanceof Error ? error.message : 'Lỗi tạo gợi ý AI';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
