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
 * Lấy user hiện tại từ server session.
 * Trả về null nếu chưa đăng nhập.
 */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Lấy user profile (kèm tenant_id, role) từ bảng user_profiles.
 * Trả về null nếu chưa có profile.
 */
export async function getCurrentUserProfile() {
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
