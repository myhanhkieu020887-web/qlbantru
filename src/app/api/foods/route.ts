import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { FoodRepository } from '@/lib/supabase/repositories/FoodRepository';

const foodRepo = new FoodRepository();

/**
 * GET /api/foods?q=cá&limit=20
 * Tìm kiếm thực phẩm theo tên hoặc lấy toàn bộ.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') ?? '20');

  try {
    const foods = query
      ? await foodRepo.search(query, limit)
      : await foodRepo.findAllActive();

    return NextResponse.json({ data: foods });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
