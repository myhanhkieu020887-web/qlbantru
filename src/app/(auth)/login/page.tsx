'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Briefcase,
  UtensilsCrossed,
  GraduationCap,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface QuickRole {
  role: 'bgh' | 'ke_toan' | 'bep_truong' | 'giao_vien';
  title: string;
  email: string;
  desc: string;
  icon: React.ElementType;
  badgeColor: string;
}

const QUICK_ROLES: QuickRole[] = [
  {
    role: 'bgh',
    title: 'Ban Giám Hiệu',
    email: 'bgh@hamthang.edu.vn',
    desc: 'Phê duyệt thực đơn, kiểm toán QĐ 2195, báo cáo Sở/Phòng',
    icon: ShieldCheck,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    role: 'ke_toan',
    title: 'Kế toán Bán trú',
    email: 'ketoan@hamthang.edu.vn',
    desc: 'Sổ C38-HD, kiểm soát công nợ NCC, phiếu thu/chi tiền ăn',
    icon: Briefcase,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    role: 'bep_truong',
    title: 'Bếp trưởng',
    email: 'beptruong@hamthang.edu.vn',
    desc: 'Phiếu xuất kho, định lượng gam/cháu, kiểm thực 3 bước ATTP',
    icon: UtensilsCrossed,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    role: 'giao_vien',
    title: 'Giáo viên',
    email: 'giaovien@hamthang.edu.vn',
    desc: 'Điểm danh báo ăn sáng/trưa 9 lớp học, xem thực đơn',
    icon: GraduationCap,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('ketoan@hamthang.edu.vn');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const setDemoSession = (role: string, userEmail: string) => {
    document.cookie = 'pms_demo_session=true; path=/; max-age=86400; SameSite=Lax';
    document.cookie = `pms_user_role=${role}; path=/; max-age=86400; SameSite=Lax`;
  };

  const handleQuickLogin = (roleItem: QuickRole) => {
    setLoading(true);
    setSuccessNotice(`Đang đăng nhập với vai trò: ${roleItem.title}...`);
    setDemoSession(roleItem.role, roleItem.email);
    setTimeout(() => {
      router.push('/');
      router.refresh();
    }, 400);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessNotice(null);

    // 1. Thử xác thực với Supabase Cloud nếu có cấu hình
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!sbError && data?.session) {
        setSuccessNotice('Đăng nhập Supabase Cloud thành công!');
        router.push('/');
        router.refresh();
        return;
      }
    } catch {
      // Tiếp tục fallback đăng nhập cục bộ
    }

    // 2. Chế độ truy cập trực tiếp: Tự động xác định vai trò
    let detectedRole = 'bgh';
    const lowerEmail = email.toLowerCase();
    if (lowerEmail.includes('ketoan') || lowerEmail.includes('ke_toan')) {
      detectedRole = 'ke_toan';
    } else if (lowerEmail.includes('bep') || lowerEmail.includes('nauan')) {
      detectedRole = 'bep_truong';
    } else if (lowerEmail.includes('giao') || lowerEmail.includes('gv')) {
      detectedRole = 'giao_vien';
    } else if (lowerEmail.includes('phu') || lowerEmail.includes('ph')) {
      detectedRole = 'phu_huynh';
    }

    setDemoSession(detectedRole, email);
    setSuccessNotice('Đăng nhập phiên làm việc thành công! Đang chuyển hướng...');
    setTimeout(() => {
      router.push('/');
      router.refresh();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-xl">
        {/* Logo & Tiêu đề */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl shadow-xl shadow-blue-500/20 mb-3 border border-blue-400/30">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            PMS — BÁN TRÚ NEXT-GEN 2.0
          </h1>
          <p className="text-slate-300 text-xs mt-1 font-medium">
            Hệ thống Quản lý Bán trú & Cân đối Dinh dưỡng Mầm non
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Trường Mẫu Giáo Hàm Thắng (Năm học 2026 - 2027)
          </div>
        </div>

        {/* Khối chính */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-slate-200/60 p-6 md:p-8 space-y-6">
          {/* 1. NÚT ĐĂNG NHẬP 1-CHẠM THEO VAI TRÒ */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Truy cập nhanh 1-chạm (Khuyên dùng)
              </span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Sẵn sàng hoạt động
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {QUICK_ROLES.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.role}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin(item)}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/60 transition-all text-left group cursor-pointer shadow-sm hover:shadow"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-blue-300 group-hover:bg-blue-600 transition-colors shadow-xs">
                      <Icon className="w-4 h-4 text-slate-700 group-hover:text-white transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {item.desc}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {item.email}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
              Hoặc đăng nhập bằng tài khoản
            </span>
          </div>

          {/* 2. FORM ĐĂNG NHẬP TRUYỀN THỐNG */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tài khoản Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ketoan@hamthang.edu.vn"
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu (mặc định: <span className="font-mono text-blue-600">123456</span>)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Success notice */}
            {successNotice && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 rounded-lg text-xs transition active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý đăng nhập...</span>
                </>
              ) : (
                'Vào hệ thống PMS'
              )}
            </button>
          </form>

          {/* Ghi chú chân trang */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-700 flex items-center gap-1">
              <span>💡 Gợi ý nhanh:</span>
            </div>
            <p>
              • Bạn có thể bấm trực tiếp vào 1 trong 4 thẻ vai trò phía trên để đăng nhập ngay trong 1 click.
            </p>
            <p>
              • Khi vào ứng dụng, bạn luôn có thể chuyển đổi linh hoạt giữa các vai trò bất kỳ lúc nào tại thanh Menu bên trái.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          PMS v2.0 — Căn cứ pháp lý: QĐ 2195/QĐ-BGDĐT & TT 51/2020/TT-BGDĐT
        </p>
      </div>
    </div>
  );
}
