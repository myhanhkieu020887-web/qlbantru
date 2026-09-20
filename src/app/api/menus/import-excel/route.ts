import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { parseMenuExcel } from '@/lib/excel/menu-importer';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Chưa chọn file Excel để tải lên' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await parseMenuExcel(buffer);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Menu Import Error]:', error);
    const msg = error instanceof Error ? error.message : 'Lỗi xử lý file Excel';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
