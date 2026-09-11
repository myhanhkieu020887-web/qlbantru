'use client';

import { formatCurrency, formatNumber } from '../../lib/utils';
import { MenuStatus, SchoolBranch } from '../../types/nutrition';
import {
  Calendar,
  Save,
  Printer,
  BookmarkPlus,
  PlusCircle,
  Copy,
  Info,
  DollarSign,
  Users,
  Building2,
  Lock,
  GitBranch,
  ArrowLeft,
  Sparkles,
  RefreshCw,
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
  // Tính toán kế toán chuẩn QLMN
  const totalRevenue = studentCount * mealPricePerChild;
  const costPerChild = studentCount > 0 ? totalCost / studentCount : 0;
  const totalDifference = totalRevenue - totalCost + initialDifference;
  const differencePerChild = studentCount > 0 ? totalDifference / studentCount : 0;

  return (
    <div className="bg-white border-b border-slate-200 px-3 py-1.5 text-xs text-slate-800 select-none shrink-0 shadow-2xs space-y-1.5">
      {/* TẦNG 1: ĐIỀU HƯỚNG, ĐIỂM TRƯỜNG & CỤM NÚT HÀNH ĐỘNG CHUẨN CÔNG SỞ */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Bên trái: Điều hướng, Tên trường, Ngày, Phân hệ, Trạng thái & Segmented Branch Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition cursor-pointer"
              title="Quay lại Danh sách Sổ Cân đối khẩu phần tháng"
            >
              <ArrowLeft className="w-3 h-3 text-blue-600" />
              <span>Sổ CĐKP</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="truncate max-w-[170px]" title={schoolName}>{schoolName}</span>
          </div>

          <span className="text-slate-300">|</span>

          {/* Ngày lập */}
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              disabled={isLocked}
              className="bg-slate-50 hover:bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-mono font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {segmentLabel}
          </span>

          {/* Trạng thái phê duyệt */}
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as MenuStatus)}
            className="font-semibold text-[11px] bg-slate-50 hover:bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition"
          >
            <option value="DRAFT">📝 Bản nháp</option>
            <option value="OPTIMIZED">⚡ Đã cân đối</option>
            <option value="APPROVED" disabled={!canApproveMenu}>✓ BGH Duyệt</option>
            <option value="LOCKED" disabled={!canLockMenu}>🔒 Khóa sổ</option>
          </select>

          {/* Bộ chọn cơ sở / điểm trường Multi-campus (Segmented Tabs) */}
          {branches.length > 0 && onBranchSelect && (
            <BranchSwitcher
              selectedBranchId={selectedBranchId}
              onBranchChange={onBranchSelect}
              branches={branches}
              totalStudents={branches.reduce((sum, b) => sum + b.studentCount, 0) || studentCount}
            />
          )}
        </div>

        {/* Bên phải: Phân nhóm nút hành động có trật tự */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 1. NÚT CHÍNH (PRIMARY ACTION): THÊM THỰC PHẨM */}
          {onAddFood && (
            <button
              type="button"
              onClick={onAddFood}
              disabled={isLocked || !canEditNutrients}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg shadow-xs transition-all ${
                isLocked || !canEditNutrients
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Thêm TP</span>
            </button>
          )}

          {/* 2. NHÓM XUẤT / CHIA SẺ (BUTTON GROUP) */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
            {onCopyZalo && (
              <button
                type="button"
                onClick={onCopyZalo}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:text-blue-700 hover:bg-white rounded-md transition"
                title="Sao chép đơn đặt hàng tiếp phẩm gửi Zalo"
              >
                <Copy className="w-3 h-3 text-blue-600" />
                <span>Zalo</span>
              </button>
            )}

            {onPrint && (
              <button
                type="button"
                onClick={onPrint}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:bg-white rounded-md transition"
                title="In Mẫu 01-MN & Tiếp phẩm"
              >
                <Printer className="w-3 h-3 text-slate-500" />
                <span>In</span>
              </button>
            )}
          </div>

          {/* 3. NHÓM MẪU & TỰ ĐỘNG */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
            {onSaveTemplate && (
              <button
                type="button"
                onClick={onSaveTemplate}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:text-emerald-700 hover:bg-white rounded-md transition"
                title="Lưu thực đơn làm mẫu"
              >
                <BookmarkPlus className="w-3 h-3 text-emerald-600" />
                <span>Mẫu</span>
              </button>
            )}

            {onOpenAuto20DaysModal && (
              <button
                type="button"
                onClick={onOpenAuto20DaysModal}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-teal-800 hover:text-teal-900 hover:bg-white rounded-md transition"
                title="Tự động sinh chu kỳ 4 tuần (20 ngày) chuẩn QĐ 2195"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Sinh 4T</span>
              </button>
            )}
          </div>

          {/* 4. NÚT LƯU DỮ LIỆU */}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xs transition active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu</span>
            </button>
          )}
        </div>
      </div>

      {/* TẦNG 2: SĨ SỐ, ĐƠN GIÁ & BẢNG CHỈ SỐ TÀI CHÍNH ĐỒNG BỘ */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-1.5 border-t border-slate-100 text-[11px]">
        {/* Sĩ số và mức tiền */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {selectedBranchId === 'all'
                  ? 'Số trẻ:'
                  : selectedBranchId === 'branch_1'
                  ? 'Trẻ (Đ1):'
                  : 'Trẻ (Đ2):'}
              </span>
            </span>
            <input
              type="text"
              value={selectedBranchId === 'all' && branchInput !== undefined ? branchInput : studentCount.toString()}
              onChange={(e) => {
                const val = e.target.value;
                if (selectedBranchId === 'all' && onBranchInputChange) {
                  onBranchInputChange(val);
                } else {
                  const parsed = parseInt(val) || 0;
                  onStudentCountChange(Math.max(0, parsed));
                }
              }}
              disabled={isLocked}
              placeholder="VD: 850;360"
              title={selectedBranchId === 'all' ? "Nhập số trẻ từng điểm trường phân cách bằng ';' (VD: 850;360)" : "Sĩ số điểm trường"}
              className="w-20 bg-slate-50 hover:bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-mono font-bold text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
            {/* Badge tổng số trẻ */}
            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[10.5px]">
              {studentCount} trẻ
            </span>

            {/* Nút lấy sĩ số có mặt thực tế từ 9 lớp học */}
            {onFetchAttendanceCount && (
              <button
                type="button"
                onClick={onFetchAttendanceCount}
                disabled={isLocked}
                className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md text-[10.5px] font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Lấy sĩ số học sinh có mặt thực tế từ Sổ điểm danh 9 lớp"
              >
                <RefreshCw className="w-3 h-3 text-purple-600" />
                <span>Lấy sĩ số điểm danh</span>
              </button>
            )}

            {selectedBranchId === 'all' && branches.length > 1 && (
              <span className="text-[10px] text-slate-400 hidden xl:inline font-mono">
                ({branches.map((b) => `${b.code}: ${b.studentCount}`).join(', ')})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
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

        {/* Các chỉ số tài chính chuẩn mực */}
        <div className="flex items-center gap-3 font-mono flex-wrap">
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
