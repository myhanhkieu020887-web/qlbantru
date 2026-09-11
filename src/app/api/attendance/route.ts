import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { AttendanceRepository } from '@/lib/supabase/repositories/AttendanceRepository';

const HAMTHANG_TENANT_ID = 'a1111111-1111-1111-1111-111111111111';
const HAMTHANG_SCHOOL_ID = 'b2222222-2222-2222-2222-222222222222';
const attendanceRepo = new AttendanceRepository(HAMTHANG_TENANT_ID, HAMTHANG_SCHOOL_ID);

/**
 * GET /api/attendance?date=2026-09-09
 * Lấy điểm danh theo ngày.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'Thiếu tham số date' }, { status: 400 });
  }

  try {
    const records = await attendanceRepo.findByDate(date);
    const total = records.reduce((sum, r) => sum + r.present_count, 0);
    return NextResponse.json({ data: records, totalPresent: total });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/attendance
 * Lưu điểm danh.
 * Body: { date: string, records: AttendanceRecord[] }
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { date, records } = await request.json();
    if (!date || !records) {
      return NextResponse.json({ error: 'Thiếu date hoặc records' }, { status: 400 });
    }
    await attendanceRepo.saveDayAttendance(date, records);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
