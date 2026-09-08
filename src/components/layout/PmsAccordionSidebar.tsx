'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Scale,
  Users,
  BookOpenCheck,
  ArrowDownToLine,
  Package,
  Truck,
  FileText,
  ShieldCheck,
  FileSpreadsheet,
  ReceiptText,
  Building2,
  Apple,
  CookingPot,
  ChevronDown,
  ChevronRight,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  UserCircle2,
} from 'lucide-react';
import { UserRole, ROLE_PERMISSIONS } from '@/types/auth';
import { SyncStatus } from '@/lib/supabase/client';

export type PmsSubModule =
  // 1. Khẩu phần & Học sinh
  | 'nutrition_adjust_month'
  | 'nutrition_grid'
  | 'recipes'
  | 'attendance'
  | 'menu_templates'
  // 2. Kho & Tiếp phẩm
  | 'storage_import'
  | 'inventory_stock'
  | 'smart_po'
  | 'warehouse_card'
  // 3. ATTP & Biểu mẫu
  | 'food_safety'
  | 'reports_forms'
  // 4. Tài chính & Cơ sở
  | 'finance'
  | 'suppliers'
  | 'school_food';

interface Props {
  activeModule: PmsSubModule;
  onSelectModule: (mod: PmsSubModule) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  syncStatus: SyncStatus;
  onManualSync: () => void;
  isDistributionUnlocked?: boolean;
}

export const PmsAccordionSidebar: React.FC<Props> = ({
  activeModule,
  onSelectModule,
  isCollapsed,
  onToggleCollapse,
  userRole,
  onRoleChange,
  syncStatus,
  onManualSync,
  isDistributionUnlocked = false,
}) => {
  // Trạng thái mở/đóng 4 nhóm Accordion
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
    meals: true,
    storage: true,
    safety: true,
    finance: true,
  });

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navGroups = [
    {
      groupKey: 'meals',
      groupTitle: '1. KHẨU PHẦN & HỌC SINH',
      items: [
        { id: 'nutrition_adjust_month', label: 'Sổ CĐKP Tháng', icon: Calendar, badge: 'qlmn.vn' },
        { id: 'nutrition_grid', label: 'Lưới Cân đối (13 Cột)', icon: Scale, badge: 'MILP' },
        { id: 'recipes', label: 'Món ăn dinh dưỡng', icon: CookingPot, badge: '10 món' },
        { id: 'attendance', label: 'Sổ Điểm danh (9 Lớp)', icon: Users, badge: 'Sĩ số' },
        { id: 'menu_templates', label: 'Thực đơn mẫu chuẩn', icon: BookOpenCheck, badge: 'QĐ 2195' },
      ],
    },
    {
      groupKey: 'storage',
      groupTitle: '2. KHO & TIẾP PHẨM',
      items: [
        { id: 'storage_import', label: 'Nhập kho (Theo ngày)', icon: ArrowDownToLine, badge: 'Gom ngày' },
        { id: 'inventory_stock', label: 'Tồn kho (FIFO)', icon: Package, badge: 'Thẻ kho' },
        { id: 'smart_po', label: 'Tiếp phẩm & Smart PO', icon: Truck, badge: 'Zalo' },
        { id: 'warehouse_card', label: 'Theo dõi sổ kho (S12-H)', icon: FileText, badge: 'TT 107' },
      ],
    },
    {
      groupKey: 'safety',
      groupTitle: '3. ATTP & BIỂU MẪU',
      items: [
        {
          id: 'food_safety',
          label: 'Kiểm thực 3 bước ATTP',
          icon: ShieldCheck,
          badge: isDistributionUnlocked ? 'Đã mở' : 'Chờ duyệt',
          badgeColor: isDistributionUnlocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300',
          hasIndicator: !isDistributionUnlocked,
        },
        { id: 'reports_forms', label: 'Biểu mẫu - Thống kê', icon: FileSpreadsheet, badge: '11 mẫu' },
      ],
    },
    {
      groupKey: 'finance',
      groupTitle: '4. TÀI CHÍNH & CƠ SỞ',
      items: [
        { id: 'finance', label: 'Kế toán Tài chính', icon: ReceiptText, badge: 'C38/02-TT' },
        { id: 'suppliers', label: 'Nhà cung cấp & Công nợ', icon: Building2, badge: '5 NCC' },
        { id: 'school_food', label: 'Thực phẩm trường', icon: Apple, badge: 'CSDL' },
      ],
    },
  ];

  const currentRoleInfo = ROLE_PERMISSIONS[userRole];

  // GIAO DIỆN KHI THU GỌN (MINI-SIDEBAR w-16)
  if (isCollapsed) {
    return (
      <aside className="w-16 bg-slate-900 text-slate-300 flex flex-col items-center justify-between py-2.5 border-r border-slate-800 shrink-0 select-none z-30 font-sans shadow-xl">
        {/* Nút mở rộng & Logo */}
        <div className="flex flex-col items-center gap-2 w-full">
          <button
            onClick={onToggleCollapse}
            className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Mở rộng menu PMS đầy đủ"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
          <div className="w-8 h-1 bg-slate-800 rounded-full my-1" />
        </div>

        {/* Danh sách icon phân hệ */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 py-2 flex flex-col items-center w-full px-2 scrollbar-none">
          {navGroups.flatMap((g) => g.items).map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id as PmsSubModule)}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4" />
                {item.hasIndicator && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer thu gọn */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-800 w-full">
          {/* Cloud sync icon */}
          <button
            onClick={onManualSync}
            className="w-9 h-9 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors"
            title="Đồng bộ Supabase Cloud"
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : syncStatus === 'synced' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Cloud className="w-4 h-4 text-blue-400" />
            )}
          </button>

          {/* Role badge icon */}
          <div
            className="w-8 h-8 rounded-full bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-200 text-[10px] font-black cursor-pointer"
            title={`Vai trò: ${currentRoleInfo.title}`}
          >
            {userRole === 'bgh' ? 'BGH' : userRole === 'ke_toan' ? 'KT' : userRole === 'bep_truong' ? 'BT' : 'GV'}
          </div>
        </div>
      </aside>
    );
  }

  // GIAO DIỆN SIDEBAR ĐẦY ĐỦ (w-64)
  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 shrink-0 select-none z-30 font-sans shadow-xl">
      {/* 1. ĐỈNH SIDEBAR: BRAND & TÊN TRƯỜNG & NÚT THU GỌN */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="leading-tight truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs text-white tracking-tight">
                NEXT-GEN PMS
              </span>
              <span className="text-[9px] font-extrabold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.2 rounded">
                v2.5
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block truncate mt-0.5">
              MN Hàm Thắng • 2026-2027
            </span>
          </div>
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Thu gọn Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* 2. THÂN SIDEBAR: 4 NHÓM ACCORDION CHUẨN PMS */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2.5 text-xs scrollbar-thin scrollbar-thumb-slate-800">
        {navGroups.map((group) => {
          const isOpen = openGroups[group.groupKey];
          return (
            <div key={group.groupKey} className="space-y-0.5">
              <button
                onClick={() => toggleGroup(group.groupKey)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-[10.5px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider rounded transition-colors"
              >
                <span>{group.groupTitle}</span>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {isOpen && (
                <div className="space-y-0.5 pl-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectModule(item.id as PmsSubModule)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              item.badgeColor ||
                              (isActive
                                ? 'bg-blue-700 text-blue-100'
                                : 'bg-slate-800 text-slate-400 border border-slate-700/60')
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. CHÂN SIDEBAR: ROLESWITCHER & SUPABASE CLOUD & FOOTER */}
      <div className="p-2.5 bg-slate-950/90 border-t border-slate-800 space-y-2">
        {/* Role Switcher Widget */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="w-full flex items-center justify-between px-2 py-1.5 bg-slate-900 hover:bg-slate-800/90 border border-slate-700/70 rounded-lg text-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <div className="text-left truncate">
                <span className="font-bold text-[11px] text-white block truncate leading-tight">
                  {currentRoleInfo.title}
                </span>
                <span className="text-[9px] text-slate-400 block truncate">
                  Phân quyền RBAC
                </span>
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {/* Menu Dropdown Chọn vai trò */}
          {isRoleMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsRoleMenuOpen(false)}
              />
              <div className="absolute bottom-full left-0 mb-1 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 py-1 divide-y divide-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Chọn vai trò đăng nhập
                </div>
                {Object.values(ROLE_PERMISSIONS).map((perm) => {
                  const isSelected = perm.role === userRole;
                  return (
                    <button
                      key={perm.role}
                      type="button"
                      onClick={() => {
                        onRoleChange(perm.role);
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                        isSelected ? 'bg-blue-900/40 text-blue-300 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <span>{perm.title}</span>
                      {isSelected && <span className="text-blue-400 text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Supabase Cloud Sync Status */}
        <div className="flex items-center justify-between px-2 py-1 bg-slate-900/60 rounded border border-slate-800 text-[10.5px]">
          <div className="flex items-center gap-1.5 truncate">
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-3 h-3 animate-spin text-amber-400 shrink-0" />
            ) : syncStatus === 'synced' ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            ) : syncStatus === 'connected' ? (
              <Cloud className="w-3 h-3 text-blue-400 shrink-0" />
            ) : (
              <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
            )}
            <span className="text-slate-300 truncate">
              {syncStatus === 'syncing'
                ? 'Đang đồng bộ...'
                : syncStatus === 'synced'
                ? 'Cloud đã lưu'
                : syncStatus === 'connected'
                ? 'Supabase Cloud'
                : 'Lỗi đồng bộ'}
            </span>
          </div>

          <button
            type="button"
            onClick={onManualSync}
            className="p-0.5 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
            title="Đồng bộ thủ công"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
};
