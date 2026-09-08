'use client';

import React from 'react';
import { Utensils, BarChart3, Users, Truck, ShieldCheck, Sparkles, FileSpreadsheet } from 'lucide-react';
import { UserRole } from '@/types/auth';
import { SyncStatus } from '@/lib/supabase/client';
import { RoleSwitcher } from './RoleSwitcher';
import { CloudSyncIndicator } from './CloudSyncIndicator';

export type AppTab = 'menu' | 'attendance' | 'smart_po' | 'food_safety';

interface TopNavBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  syncStatus: SyncStatus;
  onManualSync: () => void;
  isDistributionUnlocked: boolean;
  onRunSolver?: () => void;
  onExportExcel?: () => void;
  onOpenAuditDrawer?: () => void;
  canRunSolver?: boolean;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeTab,
  onTabChange,
  userRole,
  onRoleChange,
  syncStatus,
  onManualSync,
  isDistributionUnlocked,
  onRunSolver,
  onExportExcel,
  onOpenAuditDrawer,
  canRunSolver = true,
}) => {
  return (
    <header className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between shadow-xs select-none shrink-0 z-30">
      {/* Brand & School info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Utensils className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <span className="font-black text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
              NEXT-GEN PMS <span className="text-[10px] font-bold text-blue-600 px-1.5 py-0.2 rounded bg-blue-50 border border-blue-200">v2.0</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium block">
              Trường Mầm Non Hàm Thắng
            </span>
          </div>
        </div>
      </div>

      {/* 4 Main View Navigation Tabs (Stripe / Linear Style) */}
      <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg border border-slate-200/80">
        <button
          type="button"
          onClick={() => onTabChange('menu')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'menu'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Cân đối Dinh dưỡng</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('attendance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'attendance'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Sổ Điểm danh (9 Lớp)</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('smart_po')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'smart_po'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Tiếp phẩm & Smart PO</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('food_safety')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'food_safety'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Kiểm thực 3 bước</span>
          <span
            className={`w-2 h-2 rounded-full ${
              isDistributionUnlocked ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
            }`}
          />
        </button>
      </nav>

      {/* Right Controls: Quick actions, Role & Cloud status */}
      <div className="flex items-center gap-2.5">
        {activeTab === 'menu' && (
          <div className="flex items-center gap-1.5 mr-1 pr-2.5 border-r border-slate-200">
            {onOpenAuditDrawer && (
              <button
                type="button"
                onClick={onOpenAuditDrawer}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 transition-all shadow-xs"
                title="Thẩm định Lượng & Chất QĐ 2195 dành cho Hiệu phó Bán trú"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Thẩm Định QĐ 2195</span>
              </button>
            )}

            {onRunSolver && (
              <button
                type="button"
                onClick={onRunSolver}
                disabled={!canRunSolver}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all shadow-xs ${
                  canRunSolver
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title="Cân đối nhanh MILP (F9)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>F9 Cân đối</span>
              </button>
            )}

            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all shadow-xs"
                title="Xuất Excel Mẫu 01-MN & Tiếp phẩm (Ctrl+E)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Xuất Excel</span>
              </button>
            )}
          </div>
        )}

        <CloudSyncIndicator status={syncStatus} onManualSync={onManualSync} />
        <RoleSwitcher currentRole={userRole} onRoleChange={onRoleChange} />
      </div>
    </header>
  );
};
