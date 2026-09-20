import { NextRequest, NextResponse } from 'next/server';
import { generateMenuTemplateWorkbook } from '@/lib/excel/menu-importer';

export async function GET(request: NextRequest) {
  try {
    const workbook = await generateMenuTemplateWorkbook();
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = 'Thuc_Don_Mau_Chuan_PMS.xlsx';

    return new Response(new Uint8Array(buffer as ArrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[Menu Template Download Error]:', error);
    const msg = error instanceof Error ? error.message : 'Lỗi tạo file mẫu';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
