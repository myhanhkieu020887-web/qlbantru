import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/** POST /api/auth/signout — Đăng xuất và xóa session. */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/login`);
}
