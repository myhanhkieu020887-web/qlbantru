'use client';

import React, { useState } from 'react';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { MenuStatus, SchoolBranch } from '../../types/nutrition';
import {
  Calendar,
  Save,
  Printer,
  BookmarkPlus,
  PlusCircle,
  Copy,
  Users,
  Building2,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { BranchSwitcher } from '../navigation/BranchSwitcher';

interface Props {
  onBackToList?: () => void;
  schoolName?: string;
  segmentLabel?: string;
  date: string;
  onDateChange: (d: string) => void;
  status: MenuStatus;
  onStatusChange: (s: MenuStatus) => void;
  canApproveMenu?: boolean;
  canLockMenu?: boolean;
  studentCount: number;
  onStudentCountChange: (count: number) => void;
  onFetchAttendanceCount?: () => void;
  selectedBranchId?: string;
  onBranchSelect?: (branchId: string) => void;
  branchInput?: string;
  onBranchInputChange?: (input: string) => void;
  branches?: SchoolBranch[];
  mealPricePerChild: number;
  onMealPriceChange: (price: number) => void;
  serviceFee?: number;
  subsidyFee?: number;
  initialDifference?: number;
  totalCost: number;
  onAddFood?: () => void;
  onCopyZalo?: () => void;
  onSave?: () => void;
  onPrint?: () => void;
  onSaveTemplate?: () => void;
  onOpenAuto20DaysModal?: () => void;
  isLocked?: boolean;
  canEditNutrients?: boolean;
}

export const FinancialSummaryStrip: React.FC<Props> = ({
  onBackToList,
  schoolName = 'Trường Mẫu Giáo Hàm Thắng',
  segmentLabel = 'Mẫu giáo',
  date,
  onDateChange,
  status,
  onStatusChange,
  canApproveMenu = true,
  canLockMenu = true,
  studentCount,
  onStudentCountChange,
  onFetchAttendanceCount,
  selectedBranchId = 'all',
  onBranchSelect,
  branchInput,
  onBranchInputChange,
  branches = [],
  mealPricePerChild,
  onMealPriceChange,
  serviceFee = 0,
  subsidyFee = 0,
  initialDifference = 0,
  totalCost,
  onAddFood,
  onCopyZalo,
  onSave,
  onPrint,
  onSaveTemplate,
  onOpenAuto20DaysModal,
  isLocked = false,
  canEditNutrients = true,
}) => {
  const [isBranchConfigOpen, setIsBranchConfigOpen] = useState<boolean>(false);

  // Tính toán kế toán chuẩn QLMN
  const totalRevenue = studentCount * mealPricePerChild;
  const costPerChild = studentCount > 0 ? totalCost / studentCount : 0;
  const totalDifference = totalRevenue - totalCost + initialDifference;
  const differencePerChild = studentCount > 0 ? totalDifference / studentCount : 0;

  // Cập nhật số trẻ từng cơ sở qua Popover
  const handleUpdateBranchCount = (index: number, newCount: number) => {
    if (!branches || !onBranchInputChange) return;
    const updated = branches.map((b, i) => (i === index ? Math.max(0, newCount) : b.studentCount));
    const newStr = updated.join(';');
    onBranchInputChange(newStr);
  };

  return (
    <div className="bg-white border-b border-slate-200 px-3 py-1.5 text-xs text-slate-800 select-none shrink-0 shadow-2xs space-y-1.5">
      {/* TẦNG 1: ĐIỀU HƯỚNG, TÊN TRƯỜNG, NGÀY, PHÂN HỆ, TRẠNG THÁI & CỤM NÚT HÀNH ĐỘNG */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
        {/* Bên trái: Điều hướng, Tên trường, Ngày, Phân hệ, Trạng thái */}
        <div className="flex items-center gap-2 shrink-0">
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition cursor-pointer shrink-0"
              title="Quay lại Danh sách Sổ Cân đối khẩu phần tháng"
            >
              <ArrowLeft className="w-3 h-3 text-blue-600" />
              <span>Sổ CĐKP</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 shrink-0">
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate max-w-[170px]" title={schoolName}>{schoolName}</span>
          </div>

          <span className="text-slate-300">|</span>

          {/* Ngày lập */}
          <div className="flex items-center gap-1 shrink-0">
            <Calendar className="w-3 h-3 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              disabled={isLocked}
              className="bg-slate-50 hover:bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-mono font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
            />
          </div>

          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
            {segmentLabel}
          </span>

          {/* Trạng thái phê duyệt */}
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as MenuStatus)}
            className="font-semibold text-[11px] bg-slate-50 hover:bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition shrink-0"
          >
            <option value="DRAFT">📝 Bản nháp</option>
            <option value="OPTIMIZED">⚡ Đã cân đối</option>
            <option value="APPROVED" disabled={!canApproveMenu}>✓ BGH Duyệt</option>
            <option value="LOCKED" disabled={!canLockMenu}>🔒 Khóa sổ</option>
          </select>
        </div>

        {/* Bên phải: Cụm nút tác vụ chuyên nghiệp (tự ẩn text khi màn hình hẹp để không bao giờ tràn) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 1. NÚT CHÍNH (PRIMARY ACTION): THÊM THỰC PHẨM */}
          {onAddFood && (
            <button
              type="button"
              onClick={onAddFood}
              disabled={isLocked || !canEditNutrients}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md shadow-xs transition-all cursor-pointer shrink-0 ${
                isLocked || !canEditNutrients
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Thêm TP</span>
            </button>
          )}

          {/* 2. NHÓM XUẤT / CHIA SẺ */}
          <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 shadow-2xs shrink-0">
            {onCopyZalo && (
              <button
                type="button"
                onClick={onCopyZalo}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:text-blue-700 hover:bg-white rounded transition cursor-pointer"
                title="Sao chép đơn đặt hàng tiếp phẩm gửi Zalo"
              >
                <Copy className="w-3 h-3 text-blue-600" />
                <span className="hidden md:inline">Zalo</span>
              </button>
            )}

            {onPrint && (
              <button
                type="button"
                onClick={onPrint}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:bg-white rounded transition cursor-pointer"
                title="In Mẫu 01-MN & Tiếp phẩm"
              >
                <Printer className="w-3 h-3 text-slate-500" />
                <span className="hidden md:inline">In</span>
              </button>
            )}
          </div>

          {/* 3. NHÓM MẪU & TỰ ĐỘNG */}
          <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 shadow-2xs shrink-0">
            {onSaveTemplate && (
              <button
                type="button"
                onClick={onSaveTemplate}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:text-emerald-700 hover:bg-white rounded transition cursor-pointer"
                title="Lưu thực đơn làm mẫu"
              >
                <BookmarkPlus className="w-3 h-3 text-emerald-600" />
                <span className="hidden md:inline">Mẫu</span>
              </button>
            )}

            {onOpenAuto20DaysModal && (
              <button
                type="button"
                onClick={onOpenAuto20DaysModal}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-teal-800 hover:text-teal-900 hover:bg-white rounded transition cursor-pointer"
                title="Tự động sinh chu kỳ 4 tuần (20 ngày) chuẩn QĐ 2195"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span className="hidden md:inline">Sinh 4T</span>
              </button>
            )}
          </div>

          {/* 4. NÚT LƯU DỮ LIỆU */}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md text-[11px] font-bold shadow-xs transition active:scale-95 cursor-pointer shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu</span>
            </button>
          )}
        </div>
      </div>

      {/* TẦNG 2: BỘ CHỌN ĐIỂM TRƯỜNG, SĨ SỐ, ĐƠN GIÁ & BẢNG CHỈ SỐ TÀI CHÍNH MONO */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 text-[11px] overflow-x-auto whitespace-nowrap scrollbar-none">
        {/* Bên trái: Điểm trường, Sĩ số, Điểm danh, Đơn giá */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* 1. Bộ chọn cơ sở / điểm trường Multi-campus (Segmented Tabs) */}
          {branches.length > 0 && onBranchSelect && (
            <BranchSwitcher
              selectedBranchId={selectedBranchId}
              onBranchChange={onBranchSelect}
              branches={branches}
              totalStudents={branches.reduce((sum, b) => sum + b.studentCount, 0) || studentCount}
            />
          )}

          <span className="text-slate-200">|</span>

          {/* 2. Nhập Sĩ số đồng bộ 1:1 */}
          <div className="relative flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-600 font-medium">
              {selectedBranchId === 'all'
                ? 'Tổng số trẻ:'
                : selectedBranchId === 'branch_1'
                ? 'Trẻ (Đ1):'
                : 'Trẻ (Đ2):'}
            </span>

            <input
              type="number"
              value={studentCount}
              onChange={(e) => {
                const parsed = parseInt(e.target.value) || 0;
                onStudentCountChange(Math.max(0, parsed));
              }}
              disabled={isLocked}
              min={0}
              className="w-16 bg-slate-50 hover:bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-mono font-bold text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              title="Sĩ số thực tế của cơ sở đang chọn"
            />
            <span className="text-[10px] text-slate-400">cháu</span>

            {/* Nút popover cấu hình sĩ số từng cơ sở (khi ở Toàn trường) */}
            {selectedBranchId === 'all' && branches.length > 1 && (
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setIsBranchConfigOpen(!isBranchConfigOpen)}
                  className={`p-1 rounded border transition cursor-pointer ${
                    isBranchConfigOpen
                      ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                  title="Cấu hình số trẻ từng cơ sở (Đ1, Đ2)"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                </button>

                {/* Popover cấu hình điểm trường */}
                {isBranchConfigOpen && (
                  <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-300 rounded-lg shadow-xl p-3 w-64 text-xs select-none">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100 font-bold text-slate-800">
                      <span className="flex items-center gap-1 text-[11.5px]">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        Cơ cấu học sinh cơ sở
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsBranchConfigOpen(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-2">
                      {branches.map((b, idx) => (
                        <div key={b.id} className="flex items-center justify-between gap-2">
                          <span className="text-slate-700 font-medium truncate text-[11px]">
                            {b.name}:
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={b.studentCount}
                              onChange={(e) => handleUpdateBranchCount(idx, parseInt(e.target.value) || 0)}
                              min={0}
                              className="w-16 text-right font-mono font-bold border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-[10px] text-slate-400">trẻ</span>
                          </div>
                        </div>
                      ))}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-bold text-[11.5px]">
                        <span className="text-slate-800">Toàn trường:</span>
                        <span className="font-mono text-blue-700">
                          {branches.reduce((sum, b) => sum + b.studentCount, 0)} trẻ
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsBranchConfigOpen(false)}
                      className="mt-2.5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 rounded text-center cursor-pointer transition text-[11px]"
                    >
                      Đóng & Áp dụng
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nút lấy sĩ số có mặt thực tế từ 9 lớp học */}
          {onFetchAttendanceCount && (
            <button
              type="button"
              onClick={onFetchAttendanceCount}
              disabled={isLocked}
              className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10.5px] font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title="Lấy sĩ số học sinh có mặt thực tế từ Sổ điểm danh 9 lớp"
            >
              <RefreshCw className="w-3 h-3 text-purple-600" />
              <span>Điểm danh thực tế</span>
            </button>
          )}

          <span className="text-slate-200">|</span>

          {/* Đơn giá tiền ăn */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-600 font-medium">Tiền 1 trẻ:</span>
            <input
              type="number"
              value={mealPricePerChild}
              onChange={(e) => onMealPriceChange(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={isLocked}
              step={1000}
              className="w-20 bg-slate-50 hover:bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-mono font-bold text-slate-900 text-right focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
            <span className="text-[10px] text-slate-400 font-medium">đ</span>
          </div>
        </div>

        {/* Bên phải: Các chỉ số tài chính chuẩn mực Font Mono */}
        <div className="flex items-center gap-3 font-mono shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-sans text-[10px]">Tổng thu:</span>
            <strong className="text-slate-900 font-bold">{totalRevenue.toLocaleString('vi-VN')} đ</strong>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-sans text-[10px]">Tiền ăn:</span>
            <strong className="text-emerald-700 font-bold">{Math.round(totalCost).toLocaleString('vi-VN')} đ</strong>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-sans text-[10px]">BQ/trẻ:</span>
            <span className="font-semibold text-slate-800">{formatNumber(costPerChild, 0)} đ</span>
          </div>

          <div className="flex items-center gap-1 pl-2.5 border-l border-slate-200">
            <span className="text-slate-500 font-sans text-[10px]">Chênh lệch:</span>
            <span
              className={`px-1.5 py-0.2 rounded font-bold text-[10.5px] ${
                totalDifference >= 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {totalDifference >= 0 ? '+' : ''}{Math.round(totalDifference).toLocaleString('vi-VN')} đ
            </span>
            <span className="text-[9.5px] text-slate-400">
              ({totalDifference >= 0 ? '+' : ''}{formatNumber(differencePerChild, 0)}đ/trẻ)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
