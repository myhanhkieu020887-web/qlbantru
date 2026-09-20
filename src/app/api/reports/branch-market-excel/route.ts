import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { generateBranchMarketListWorkbook } from '@/lib/excel/exporter';
import { DailyMenuPlan, SchoolBranch } from '@/types/nutrition';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { plan, branches } = (await request.json()) as {
      plan: DailyMenuPlan;
      branches: SchoolBranch[];
    };

    if (!plan || !plan.items) {
      return NextResponse.json({ error: 'Thiếu dữ liệu thực đơn' }, { status: 400 });
    }

    const workbook = await generateBranchMarketListWorkbook(plan, branches);
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Phieu_Di_Cho_Diem_Truong_${plan.date}.xlsx`;

    return new Response(new Uint8Array(buffer as ArrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[Branch Market Excel Export Error]:', error);
    const msg = error instanceof Error ? error.message : 'Lỗi xuất file Excel đi chợ điểm trường';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
