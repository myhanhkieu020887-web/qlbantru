'use client';

import React from 'react';
import { formatCurrency, formatNumber } from '../../lib/utils';
import {
  Calendar,
  Save,
  Printer,
  BookmarkPlus,
  Info,
  DollarSign,
  Users,
} from 'lucide-react';

interface Props {
  date: string;
  onDateChange: (d: string) => void;
  studentCount: number;
  onStudentCountChange: (count: number) => void;
  mealPricePerChild: number;
  onMealPriceChange: (price: number) => void;
  serviceFee?: number;
  subsidyFee?: number;
  initialDifference?: number;
  totalCost: number;
  onSave?: () => void;
  onPrint?: () => void;
  onSaveTemplate?: () => void;
  isLocked?: boolean;
}

export const FinancialSummaryStrip: React.FC<Props> = ({
  date,
  onDateChange,
  studentCount,
  onStudentCountChange,
  mealPricePerChild,
  onMealPriceChange,
  serviceFee = 0,
  subsidyFee = 0,
  initialDifference = 0,
  totalCost,
  onSave,
  onPrint,
  onSaveTemplate,
  isLocked = false,
}) => {
  // Tính toán kế toán chuẩn QLMN
  const totalRevenue = studentCount * mealPricePerChild;
  const costPerChild = studentCount > 0 ? totalCost / studentCount : 0;
  const totalDifference = totalRevenue - totalCost + initialDifference;
  const differencePerChild = studentCount > 0 ? totalDifference / studentCount : 0;

  return (
    <div className="bg-[#f5fbf2] border-b border-[#c8e2bd] px-4 py-2.5 text-xs text-slate-800 select-none shrink-0 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        {/* CỘT 1: NGÀY LẬP & SĨ SỐ */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold text-[#2e7d32]">
            <Calendar className="w-4 h-4 text-[#4caf50]" />
            <span>Ngày lập:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              disabled={isLocked}
              className="bg-white border border-[#c8e2bd] rounded px-2 py-0.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4caf50]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium">Số trẻ:</span>
            <input
              type="number"
              value={studentCount}
              onChange={(e) => onStudentCountChange(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={isLocked}
              className="w-16 bg-white border border-[#c8e2bd] rounded px-2 py-0.5 text-xs font-mono font-bold text-slate-900 text-right focus:outline-none focus:ring-1 focus:ring-[#4caf50]"
            />
            <span className="text-[11px] text-slate-500 font-mono">cháu</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium">Tiền 1 trẻ:</span>
            <input
              type="number"
              value={mealPricePerChild}
              onChange={(e) => onMealPriceChange(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={isLocked}
              step={1000}
              className="w-24 bg-white border border-[#c8e2bd] rounded px-2 py-0.5 text-xs font-mono font-bold text-slate-900 text-right focus:outline-none focus:ring-1 focus:ring-[#4caf50]"
            />
            <span className="text-[11px] text-slate-500">VNĐ</span>
          </div>
        </div>

        {/* NÚT TÁC VỤ BÊN PHẢI CHUẨN QLMN */}
        <div className="flex items-center gap-2">
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="flex items-center gap-1 bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-3 py-1 rounded text-xs font-bold shadow-xs transition"
              title="Lưu thực đơn"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu</span>
            </button>
          )}

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="flex items-center gap-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1 rounded text-xs font-semibold shadow-xs transition"
              title="In thực đơn A4"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>In</span>
            </button>
          )}

          {onSaveTemplate && (
            <button
              type="button"
              onClick={onSaveTemplate}
              className="flex items-center gap-1 bg-[#689f38] hover:bg-[#558b2f] text-white px-3 py-1 rounded text-xs font-bold shadow-xs transition"
              title="Lưu làm thực đơn mẫu"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Lưu thực đơn mẫu</span>
            </button>
          )}
        </div>
      </div>

      {/* DÒNG 2 & 3: BẢNG KẾ TOÁN THU - CHI - CHÊNH LỆCH */}
      <div className="mt-2 pt-2 border-t border-[#dcedd8] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
        {/* 1. Tổng tiền thu */}
        <div className="bg-white/80 rounded border border-[#dcedd8] p-1.5">
          <div className="text-slate-500 font-medium">Tổng tiền thu:</div>
          <div className="font-mono font-bold text-slate-900 text-xs">
            {formatCurrency(totalRevenue)}
          </div>
        </div>

        {/* 2. Tiền dịch vụ */}
        <div className="bg-white/80 rounded border border-[#dcedd8] p-1.5">
          <div className="text-slate-500 font-medium">Tiền dịch vụ:</div>
          <div className="font-mono font-bold text-slate-700 text-xs">
            {formatCurrency(serviceFee)}
          </div>
        </div>

        {/* 3. Tiền bổ trợ */}
        <div className="bg-white/80 rounded border border-[#dcedd8] p-1.5">
          <div className="text-slate-500 font-medium">Tiền ăn bổ trợ:</div>
          <div className="font-mono font-bold text-slate-700 text-xs">
            {formatCurrency(subsidyFee)}
          </div>
        </div>

        {/* 4. Tổng tiền ăn thực tế */}
        <div className="bg-white/80 rounded border border-[#dcedd8] p-1.5">
          <div className="text-slate-500 font-medium">Tổng tiền ăn:</div>
          <div className="font-mono font-bold text-[#1b5e20] text-xs">
            {formatNumber(totalCost, 1)} đ
          </div>
        </div>

        {/* 5. Tiền chênh lệch 1 trẻ */}
        <div className="bg-white/80 rounded border border-[#dcedd8] p-1.5">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <span>Tiền chênh lệch 1 trẻ:</span>
            <Info className="w-3 h-3 text-amber-500" />
          </div>
          <div
            className={`font-mono font-bold text-xs ${
              differencePerChild >= 0 ? 'text-[#e65100]' : 'text-rose-600'
            }`}
          >
            {formatNumber(differencePerChild, 2)} đ
          </div>
        </div>

        {/* 6. Tổng tiền chênh lệch */}
        <div className="bg-white/80 rounded border border-[#dcedd8] p-1.5">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <span>Tổng tiền chênh lệch:</span>
            <Info className="w-3 h-3 text-amber-500" />
          </div>
          <div
            className={`font-mono font-bold text-xs ${
              totalDifference >= 0 ? 'text-[#e65100]' : 'text-rose-600'
            }`}
          >
            {formatNumber(totalDifference, 1)} đ
          </div>
        </div>
      </div>
    </div>
  );
};
