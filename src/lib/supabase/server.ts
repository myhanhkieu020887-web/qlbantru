import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Tạo Supabase client cho Server Components và Route Handlers.
 * Dùng Next.js cookies() để quản lý session phía server.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll bị gọi từ Server Component (read-only) — bỏ qua
          }
        },
      },
    }
  );
}

/**
 * Lấy user hiện tại từ server session (Supabase hoặc Demo Session).
 * Trả về null nếu chưa đăng nhập.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  if (cookieStore.get('pms_demo_session')?.value === 'true') {
    const role = cookieStore.get('pms_user_role')?.value || 'bgh';
    return {
      id: 'demo-user-hamthang',
      email: `${role}@hamthang.edu.vn`,
      user_metadata: { role, full_name: 'Cán bộ Bán trú Hàm Thắng' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any;
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Lấy user profile (kèm tenant_id, role) từ bảng user_profiles.
 * Trả về profile mặc định nếu đang ở chế độ Demo.
 */
export async function getCurrentUserProfile() {
  const cookieStore = await cookies();
  if (cookieStore.get('pms_demo_session')?.value === 'true') {
    const role = cookieStore.get('pms_user_role')?.value || 'bgh';
    return {
      id: 'demo-user-hamthang',
      role,
      full_name: 'Cán bộ Bán trú Hàm Thắng',
      tenant_id: 'a1111111-1111-1111-1111-111111111111',
      school_id: 's1111111-1111-1111-1111-111111111111',
      tenants: { id: 'a1111111-1111-1111-1111-111111111111', name: 'Trường Mầm Non Hàm Thắng', code: 'HAMTHANG-MN' },
      schools: { id: 's1111111-1111-1111-1111-111111111111', name: 'Trường Mầm Non Hàm Thắng', code: 'HAMTHANG-MN' },
    } as any;
  }

  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*, tenants(id, name, code), schools(id, name, code)')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data;
}
