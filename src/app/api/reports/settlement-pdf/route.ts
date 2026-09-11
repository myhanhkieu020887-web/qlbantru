import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { getCurrentUser } from '@/lib/supabase/server';
import { SettlementService } from '@/lib/services/SettlementService';
import { SettlementPdfDocument } from '@/components/pdf/SettlementPdfDocument';

export const runtime = 'nodejs';

const settlementService = new SettlementService();

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || '9');
  const year = parseInt(searchParams.get('year') || '2026');
  const price = parseInt(searchParams.get('price') || '21000');
  const days = parseInt(searchParams.get('days') || '20');

  try {
    const summary = settlementService.calculateMonthSettlement(month, year, price, days);

    const pdfBuffer = await renderToBuffer(
      React.createElement(SettlementPdfDocument, { data: summary }) as never
    );

    const filename = `Quyet_toan_tien_an_thang_${month}_${year}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[Settlement PDF Export Error]:', error);
    const msg = error instanceof Error ? error.message : 'Lỗi xuất PDF quyết toán';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
