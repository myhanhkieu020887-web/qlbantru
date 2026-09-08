'use client';

import React, { useState } from 'react';
import { AgeGroup, MenuStatus } from '../../types/nutrition';
import {
  Calculator,
  Download,
  FileSpreadsheet,
  PlusCircle,
  Printer,
  RotateCcw,
  Sparkles,
  Users,
  Utensils,
  Maximize2,
  Minimize2,
  Share2,
  FileText,
  Sliders,
  CheckCircle,
  Copy,
  Lock,
  Unlock,
  ShieldCheck,
  Truck,
} from 'lucide-react';

import { UserRole, ROLE_PERMISSIONS } from '../../types/auth';
import { RoleSwitcher } from '../navigation/RoleSwitcher';
import { CloudSyncIndicator } from '../navigation/CloudSyncIndicator';
import { SyncStatus } from '../../lib/supabase/client';

interface Props {
  ageGroup: AgeGroup;
  onAgeGroupChange: (ag: AgeGroup) => void;
  studentCount: number;
  onStudentCountChange: (count: number) => void;
  mealPrice: number;
  onMealPriceChange: (price: number) => void;
  status: MenuStatus;
  onStatusChange: (status: MenuStatus) => void;
  onRunSolver: () => void;
  onExportExcel: () => void;
  onPrintA4: () => void;
  onAddFood: () => void;
  onResetMenu: () => void;
  isRibbonCollapsed: boolean;
  onToggleRibbon: () => void;
  onCopyZaloPO: () => void;
  userRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  syncStatus?: SyncStatus;
  onManualSync?: () => void;
  onOpenSmartPO?: () => void;
  onOpenFoodSafety?: () => void;
  isDistributionUnlocked?: boolean;
}

export const RibbonBar: React.FC<Props> = ({
  ageGroup,
  onAgeGroupChange,
  studentCount,
  onStudentCountChange,
  mealPrice,
  onMealPriceChange,
  status,
  onStatusChange,
  onRunSolver,
  onExportExcel,
  onPrintA4,
  onAddFood,
  onResetMenu,
  isRibbonCollapsed,
  onToggleRibbon,
  onCopyZaloPO,
  userRole = 'bgh',
  onRoleChange = () => {},
  syncStatus = 'connected',
  onManualSync,
  onOpenSmartPO,
  onOpenFoodSafety,
  isDistributionUnlocked = false,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'solver' | 'logistics' | 'reports' | 'view'>('home');

  const rolePerm = ROLE_PERMISSIONS[userRole];
  const isLocked = status === 'LOCKED';
  const canRunSolver = rolePerm.canRunSolver && !isLocked;
  const canAddFood = rolePerm.canEditNutrients && !isLocked;
  const canEditPrice = rolePerm.canEditPrice && !isLocked;

  return (
    <div className="bg-[#f3f4f6] border-b border-gray-300 select-none shadow-sm">
      {/* 1. Quick Access Bar (Thanh tác vụ nhanh kiểu Office 365) */}
      <div className="bg-[#004b87] text-white px-3 py-1 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold flex items-center gap-1.5 text-sm tracking-wide">
            <Utensils className="w-4 h-4 text-amber-300" /> NEXT-GEN PMS v2.0
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-200">Kế toán Bán trú & Cân đối Dinh dưỡng Mầm non</span>
        </div>

        {/* Trạng thái Phê duyệt & Khóa sổ & RBAC & Cloud Sync */}
        <div className="flex items-center gap-2">
          {/* Cloud Sync Status */}
          <CloudSyncIndicator
            status={syncStatus}
            onManualSync={onManualSync}
          />

          {/* Role Switcher */}
          <RoleSwitcher
            currentRole={userRole}
            onRoleChange={onRoleChange}
          />

          <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded border border-white/20">
            <span className="text-[11px] text-gray-300">Trạng thái:</span>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as MenuStatus)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value="DRAFT" className="text-gray-900">📝 DRAFT (Đang lập)</option>
              <option value="OPTIMIZED" className="text-gray-900">⚡ OPTIMIZED (Đã cân đối)</option>
              <option value="APPROVED" disabled={!rolePerm.canApproveMenu} className="text-gray-900">
                {rolePerm.canApproveMenu ? '✓ APPROVED (Hiệu trưởng duyệt)' : '🔒 APPROVED (Cần quyền BGH)'}
              </option>
              <option value="LOCKED" disabled={!rolePerm.canLockMenu} className="text-gray-900">
                {rolePerm.canLockMenu ? '🔒 LOCKED (Đã khóa sổ)' : '🔒 LOCKED (Cần quyền BGH)'}
              </option>
            </select>
          </div>

          <button
            onClick={onRunSolver}
            disabled={!canRunSolver}
            title={!rolePerm.canRunSolver ? 'Vai trò của bạn không có quyền chạy cân đối' : isLocked ? 'Thực đơn đã khóa sổ!' : 'Cân đối nhanh MILP (F9)'}
            className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold shadow-sm transition-all ${
              !canRunSolver
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> F9 Cân đối
          </button>
          <button
            onClick={onExportExcel}
            disabled={!rolePerm.canExportExcel}
            title={!rolePerm.canExportExcel ? 'Vai trò không có quyền xuất Excel' : 'Xuất Excel (.xlsx) (Ctrl+E)'}
            className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold shadow-sm ${
              !rolePerm.canExportExcel ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Ctrl+E Xuất Excel
          </button>
          <button
            onClick={onToggleRibbon}
            title="Thu gọn / Mở rộng Ribbon (Ctrl+B)"
            className="p-1 hover:bg-white/10 rounded text-gray-200"
          >
            {isRibbonCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Ribbon Tabs Navigation */}
      <div className="flex items-center px-2 bg-white border-b border-gray-300 text-xs font-medium">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'home'
              ? 'border-[#004b87] text-[#004b87] font-bold bg-gray-50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Trang chủ (Home)
        </button>
        <button
          onClick={() => setActiveTab('solver')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'solver'
              ? 'border-[#004b87] text-[#004b87] font-bold bg-gray-50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Cân đối & Solver
        </button>
        <button
          onClick={() => setActiveTab('logistics')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'logistics'
              ? 'border-[#004b87] text-[#004b87] font-bold bg-gray-50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Kho & Smart PO
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'reports'
              ? 'border-[#004b87] text-[#004b87] font-bold bg-gray-50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Báo cáo & Sổ sách
        </button>
        <button
          onClick={() => setActiveTab('view')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'view'
              ? 'border-[#004b87] text-[#004b87] font-bold bg-gray-50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Chế độ xem (View)
        </button>
      </div>

      {/* 3. Ribbon Action Panels (Thu gọn khi isRibbonCollapsed = true) */}
      {!isRibbonCollapsed && (
        <div className="px-3 py-2 bg-gradient-to-b from-[#f9fafb] to-[#edf0f5] flex items-stretch gap-3 overflow-x-auto min-h-[85px] border-b border-gray-300 text-gray-800">
          {activeTab === 'home' && (
            <>
              {/* Nhóm 1: Thông tin bán trú */}
              <div className="flex flex-col justify-between pr-3 border-r border-gray-300">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">ĐỐI TƯỢNG</label>
                    <select
                      value={ageGroup}
                      onChange={(e) => onAgeGroupChange(e.target.value as AgeGroup)}
                      className="text-xs bg-white border border-gray-300 rounded px-2 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="maugiao">Mẫu giáo (3 - 6 tuổi)</option>
                      <option value="nhatre">Nhà trẻ (18 - 36 tháng)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">SĨ SỐ ĂN (CHÁU)</label>
                    <input
                      type="number"
                      value={studentCount}
                      onChange={(e) => onStudentCountChange(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-xs w-20 bg-white border border-gray-300 rounded px-2 py-1 font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">TIỀN ĂN (Đ/CHÁU)</label>
                    <input
                      type="number"
                      step="1000"
                      disabled={!canEditPrice}
                      value={mealPrice}
                      onChange={(e) => onMealPriceChange(Math.max(1000, parseInt(e.target.value) || 1000))}
                      className={`text-xs w-24 border border-gray-300 rounded px-2 py-1 font-mono font-bold text-right focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        !canEditPrice ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider text-center mt-1">
                  Thông số Bán trú
                </div>
              </div>

              {/* Nhóm 2: Cân đối & Solver Cốt lõi */}
              <div className="flex flex-col justify-between pr-3 border-r border-gray-300">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onRunSolver}
                    disabled={!canRunSolver}
                    className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-md shadow font-bold text-xs gap-1 transition-all active:scale-95 ${
                      !canRunSolver
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
                    }`}
                  >
                    <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
                    <span>CÂN ĐỐI MILP</span>
                    <span className="text-[9px] font-normal opacity-90">(Phím F9)</span>
                  </button>
                  <button
                    onClick={onAddFood}
                    disabled={!canAddFood}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-md border text-xs font-semibold gap-1 ${
                      !canAddFood
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <PlusCircle className={`w-5 h-5 ${!canAddFood ? 'text-gray-400' : 'text-blue-600'}`} />
                    <span>Thêm thực phẩm</span>
                    <span className="text-[9px] font-normal opacity-70">(Từ CSDL)</span>
                  </button>
                  <button
                    onClick={onResetMenu}
                    className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold gap-1"
                    title="Nạp lại thực đơn mẫu Hàm Thắng"
                  >
                    <RotateCcw className="w-5 h-5 text-amber-600" />
                    <span>Khôi phục</span>
                    <span className="text-[9px] font-normal text-gray-400">Mẫu gốc</span>
                  </button>
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider text-center mt-1">
                  Công cụ Tối ưu
                </div>
              </div>

              {/* Nhóm 3: Xuất bản & In ấn */}
              <div className="flex flex-col justify-between pr-3 border-r border-gray-300">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onExportExcel}
                    className="flex flex-col items-center justify-center px-3.5 py-1.5 rounded-md bg-white border border-gray-300 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold gap-1 shadow-sm"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <span>Xuất Excel (.xlsx)</span>
                    <span className="text-[9px] font-normal text-gray-500">Ctrl + E</span>
                  </button>
                  <button
                    onClick={onPrintA4}
                    className="flex flex-col items-center justify-center px-3 py-1.5 rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold gap-1"
                  >
                    <Printer className="w-5 h-5 text-gray-700" />
                    <span>In A4 1-Click</span>
                    <span className="text-[9px] font-normal text-gray-500">Ctrl + P</span>
                  </button>
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider text-center mt-1">
                  Xuất bản Hồ sơ
                </div>
              </div>

              {/* Nhóm 4: Tiếp phẩm & ATTP */}
              <div className="flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenSmartPO}
                    className="flex flex-col items-center justify-center px-3 py-1.5 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-900 text-xs font-semibold gap-1"
                  >
                    <Truck className="w-5 h-5 text-blue-600" />
                    <span>Smart PO (5 Nhà xe)</span>
                    <span className="text-[9px] font-normal text-blue-600">Tiếp phẩm</span>
                  </button>

                  <button
                    onClick={onOpenFoodSafety}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-md border text-xs font-semibold gap-1 transition-all ${
                      isDistributionUnlocked
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                        : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    <ShieldCheck className={`w-5 h-5 ${isDistributionUnlocked ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <span>Kiểm thực 3 bước</span>
                    <span className={`text-[9px] font-bold ${isDistributionUnlocked ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {isDistributionUnlocked ? '✓ Đã mở chia ăn' : '🔒 Đang khóa'}
                    </span>
                  </button>
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider text-center mt-1">
                  Tiếp phẩm & ATTP
                </div>
              </div>
            </>
          )}

          {activeTab === 'solver' && (
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-3 bg-white p-2 rounded border border-gray-200">
                <Sliders className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-bold text-gray-800">Cơ chế Cân đối 2 pha (2-Phase Elastic MILP)</div>
                  <div className="text-[11px] text-gray-500">
                    Khóa các món gia vị, đường, sữa, trứng; giải toán biến số với đạm động vật và rau củ tươi.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5" /> Khống chế Natri ≤ 1200mg (QĐ 2195)
                </span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5" /> Khống chế Đường tự do ≤ 10% Calo
                </span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5" /> Đạm động vật ≥ 50%
                </span>
              </div>
            </div>
          )}

          {activeTab === 'logistics' && (
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={onOpenSmartPO}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow"
              >
                <Truck className="w-4 h-4" /> Mở Bảng Quản lý Smart PO 5 Nhà Cung Cấp
              </button>
              <button
                onClick={onOpenFoodSafety}
                className={`flex items-center gap-1.5 px-3 py-2 rounded font-bold border shadow ${
                  isDistributionUnlocked
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-amber-500 text-white hover:bg-amber-600'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                {isDistributionUnlocked ? 'Kiểm thực 3 bước (Đã mở khóa chia ăn)' : 'Kiểm thực 3 bước (Đang khóa chia ăn)'}
              </button>
              <span className="text-gray-500 text-xs">
                (Thịt cá 06:00 | Rau củ 06:15 | Hàng khô gia vị 06:30 | Sữa bánh 08:30 | Gạo đầu tuần)
              </span>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={onExportExcel}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700"
              >
                <FileSpreadsheet className="w-4 h-4" /> Tải Sổ Dinh dưỡng 3 Sheet (01-MN, Tiếp phẩm, Kiểm thực)
              </button>
              <button
                onClick={onPrintA4}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded font-semibold hover:bg-gray-50 text-gray-700"
              >
                <Printer className="w-4 h-4" /> In mẫu kiểm tra hồ sơ thanh tra ngày
              </button>
            </div>
          )}

          {activeTab === 'view' && (
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRibbonCollapsed}
                  onChange={onToggleRibbon}
                  className="rounded text-blue-600"
                />
                <span>Tự động thu nhỏ thanh Ribbon (Ctrl+B) để tối đa diện tích lưới số liệu</span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
