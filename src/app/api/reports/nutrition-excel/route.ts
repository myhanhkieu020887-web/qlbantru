import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { NutritionReportService } from '@/lib/services/NutritionReportService';
import { AgeGroup } from '@/types/nutrition';

const reportService = new NutritionReportService();

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || '9');
  const year = parseInt(searchParams.get('year') || '2026');
  const segment = (searchParams.get('segment') || 'maugiao') as AgeGroup;
  const studentCount = parseInt(searchParams.get('students') || '1210');
  const budget = parseInt(searchParams.get('budget') || '21000');

  try {
    const workbook = await reportService.generateMonthlyNutritionReport(
      month,
      year,
      segment,
      studentCount,
      budget
    );

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Bao_cao_dinh_duong_thang_${month}_${year}_${segment}.xlsx`;

    return new Response(new Uint8Array(buffer as ArrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[Nutrition Excel Report Error]:', error);
    const msg = error instanceof Error ? error.message : 'Lỗi xuất báo cáo Excel';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
