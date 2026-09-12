import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/** POST /api/auth/signout — Đăng xuất và xóa session. */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(`${origin}/login`);
  response.cookies.delete('pms_demo_session');
  response.cookies.delete('pms_user_role');
  return response;
}
