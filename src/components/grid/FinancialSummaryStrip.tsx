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
} from 'lucide-react';

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
  isLocked = false,
  canEditNutrients = true,
}) => {
  // Tính toán kế toán chuẩn QLMN
  const totalRevenue = studentCount * mealPricePerChild;
  const costPerChild = studentCount > 0 ? totalCost / studentCount : 0;
  const totalDifference = totalRevenue - totalCost + initialDifference;
  const differencePerChild = studentCount > 0 ? totalDifference / studentCount : 0;

  return (
    <div className="bg-[#f7faf5] border-b border-[#c8e2bd] px-3 py-1.5 text-xs text-slate-800 select-none shrink-0 shadow-xs space-y-1">
      {/* HÀNG 1: TÊN ĐƠN VỊ, TRẠNG THÁI & CỤM NÚT HÀNH ĐỘNG */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        {/* Bên trái: Trường, Ngày, Phân hệ, Trạng thái */}
        <div className="flex items-center gap-2 flex-wrap">
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer"
              title="Quay lại Danh sách Sổ Cân đối khẩu phần tháng"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600" />
              <span>Sổ CĐKP tháng</span>
            </button>
          )}

          <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{schoolName}</span>
          </span>
          <span className="text-slate-300">|</span>

          {/* Ngày lập */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px]">Ngày:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              disabled={isLocked}
              className="bg-white border border-slate-300 rounded px-1.5 py-0.2 text-[11px] font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {segmentLabel}
          </span>

          {/* Trạng thái phê duyệt */}
          <div className="flex items-center gap-1">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as MenuStatus)}
              className="font-semibold text-[11px] bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="DRAFT">📝 Bản nháp</option>
              <option value="OPTIMIZED">⚡ Đã cân đối</option>
              <option value="APPROVED" disabled={!canApproveMenu}>✓ BGH Duyệt</option>
              <option value="LOCKED" disabled={!canLockMenu}>🔒 Khóa sổ</option>
            </select>
          </div>
        </div>

        {/* Bên phải: Cụm nút hành động nhanh */}
        <div className="flex items-center gap-1.5">
          {onAddFood && (
            <button
              type="button"
              onClick={onAddFood}
              disabled={isLocked || !canEditNutrients}
              className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border shadow-xs transition-all ${
                isLocked || !canEditNutrients
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <PlusCircle className="w-3 h-3 text-blue-600" />
              <span>+ Thêm TP</span>
            </button>
          )}

          {onCopyZalo && (
            <button
              type="button"
              onClick={onCopyZalo}
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100 shadow-xs transition-all"
            >
              <Copy className="w-3 h-3 text-blue-600" />
              <span>Sao chép Zalo</span>
            </button>
          )}

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="flex items-center gap-1 bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-2.5 py-0.5 rounded text-[11px] font-bold shadow-xs transition"
            >
              <Save className="w-3 h-3" />
              <span>Lưu</span>
            </button>
          )}

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold shadow-xs transition"
            >
              <Printer className="w-3 h-3 text-slate-500" />
              <span>In</span>
            </button>
          )}

          {onSaveTemplate && (
            <button
              type="button"
              onClick={onSaveTemplate}
              className="flex items-center gap-1 bg-[#43a047] hover:bg-[#2e7d32] text-white px-2 py-0.5 rounded text-[11px] font-semibold shadow-xs transition"
            >
              <BookmarkPlus className="w-3 h-3" />
              <span>Mẫu</span>
            </button>
          )}
        </div>
      </div>

      {/* HÀNG 2: BẢNG DÒNG CHỈ SỐ KẾ TOÁN TIẾP PHẨM SIÊU MỎNG */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-1 border-t border-[#dbeef0] text-[11px]">
        {/* Sĩ số và mức tiền */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              <span>Số trẻ:</span>
            </span>
            <input
              type="text"
              value={branchInput !== undefined ? branchInput : studentCount.toString()}
              onChange={(e) => {
                const val = e.target.value;
                if (onBranchInputChange) {
                  onBranchInputChange(val);
                } else {
                  const parsed = parseInt(val) || 0;
                  onStudentCountChange(Math.max(0, parsed));
                }
              }}
              disabled={isLocked}
              placeholder="VD: 282;116"
              title="Nhập số trẻ cho từng điểm trường ngăn cách bằng dấu chấm phẩy (VD: 282;116)"
              className="w-24 bg-white border border-[#c8e2bd] rounded px-1.5 py-0.2 text-[11px] font-mono font-bold text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {/* Hiển thị tổng số trẻ và phân bổ các điểm trường */}
            <span className="font-mono font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-300 text-[10.5px]">
              {studentCount} trẻ
            </span>
            {branches.length > 1 && (
              <span className="text-[10px] text-slate-500 hidden xl:inline font-mono">
                ({branches.map(b => `${b.code}: ${b.studentCount}`).join(', ')})
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
              className="w-18 bg-white border border-[#c8e2bd] rounded px-1.5 py-0.2 text-[11px] font-mono font-bold text-slate-900 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-400">đ</span>
          </div>
        </div>

        {/* Các chỉ số tài chính */}
        <div className="flex items-center gap-3 font-mono">
          <div>
            <span className="text-slate-500 text-[10px]">Tổng thu: </span>
            <strong className="text-slate-900">{totalRevenue.toLocaleString('vi-VN')} đ</strong>
          </div>

          <div>
            <span className="text-slate-500 text-[10px]">Tiền ăn: </span>
            <strong className="text-emerald-700 font-bold">{Math.round(totalCost).toLocaleString('vi-VN')} đ</strong>
          </div>

          <div>
            <span className="text-slate-500 text-[10px]">BQ/trẻ: </span>
            <span className="font-semibold text-slate-700">{formatNumber(costPerChild, 0)} đ</span>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
            <span className="text-slate-500 text-[10px]">Chênh lệch: </span>
            <strong className={`font-bold ${totalDifference >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {totalDifference >= 0 ? '+' : ''}{Math.round(totalDifference).toLocaleString('vi-VN')} đ
            </strong>
            <span className="text-[10px] text-slate-400">({totalDifference >= 0 ? '+' : ''}{formatNumber(differencePerChild, 0)}đ/trẻ)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
