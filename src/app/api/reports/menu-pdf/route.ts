import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { MenuPdfDocument } from '@/components/pdf/MenuPdfDocument';
import { DailyMenuPlan, NutritionTotals } from '@/types/nutrition';

export const runtime = 'nodejs';

/**
 * POST /api/reports/menu-pdf
 * Nhận body: { plan: DailyMenuPlan, totals: NutritionTotals }
 * Trả về: file PDF stream chuẩn A4
 */
export async function POST(request: NextRequest) {
  try {
    const { plan, totals } = (await request.json()) as {
      plan: DailyMenuPlan;
      totals: NutritionTotals;
    };

    if (!plan || !totals) {
      return NextResponse.json({ error: 'Thiếu dữ liệu plan hoặc totals' }, { status: 400 });
    }

    // Render component thành Buffer PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(MenuPdfDocument, { plan, totals }) as never
    );

    const filename = `Thuc_don_${plan.date}_${plan.ageGroup}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[Menu PDF Export Error]:', error);
    const msg = error instanceof Error ? error.message : 'Lỗi xuất PDF';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
