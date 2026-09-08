import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type SyncStatus = 'connected' | 'syncing' | 'synced' | 'error' | 'offline';

export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!supabase) {
    return { ok: false, message: 'Chưa cấu hình Supabase URL/Key' };
  }
  try {
    const { error } = await supabase.from('tenants').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST205') {
        return { ok: false, message: 'Bảng chưa được tạo (Cần chạy file migration SQL trong SQL Editor)' };
      }
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Đã kết nối Supabase Cloud thành công' };
  } catch (err: unknown) {
    return { ok: false, message: err instanceof Error ? err.message : 'Lỗi kết nối' };
  }
}
