'use client';

import React from 'react';
import { AgeGroup, DayMenuBundle, NutritionTotals } from '@/types/nutrition';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  Calendar,
  Sparkles,
  Copy,
  Flame,
  Scale,
  ShieldCheck,
  CircleDollarSign,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface Props {
  schedule: DayMenuBundle[];
  selectedDate: string;
  onSelectDate: (d: string) => void;
  currentSegment: AgeGroup;
  onSegmentChange: (seg: AgeGroup) => void;
  studentCount: number;
  onStudentCountChange: (count: number) => void;
  mealPrice: number;
  onMealPriceChange: (price: number) => void;
  canEditPrice?: boolean;
  totals: NutritionTotals;
  onOpenTemplateModal: () => void;
  onCloneCurrentDay: () => void;
  onOpenAuditDrawer?: () => void;
}

export const LeftSidebarPanel: React.FC<Props> = ({
  schedule,
  selectedDate,
  onSelectDate,
  currentSegment,
  onSegmentChange,
  studentCount,
  onStudentCountChange,
  mealPrice,
  onMealPriceChange,
  canEditPrice = true,
  totals,
  onOpenTemplateModal,
  onCloneCurrentDay,
  onOpenAuditDrawer,
}) => {
  return (
    <aside className="w-80 xl:w-96 border-r border-slate-200 bg-slate-50/70 p-3 flex flex-col gap-3 overflow-y-auto shrink-0 select-none text-xs">
      {/* 1. LỊCH TUẦN 5 NGÀY */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>TUẦN 02 / THÁNG 09</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenTemplateModal}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] transition-colors"
              title="Áp dụng thực đơn mẫu chuẩn 4 tuần"
            >
              Mẫu
            </button>
            <button
              type="button"
              onClick={onCloneCurrentDay}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] transition-colors"
              title="Sao chép ngày hiện tại sang ngày tiếp theo"
            >
              Copy
            </button>
          </div>
        </div>

        {/* 5 Date items list */}
        <div className="space-y-1">
          {schedule.map((day) => {
            const isSelected = day.date === selectedDate;
            const currentPlan =
              currentSegment === 'maugiao'
                ? day.maugiao
                : currentSegment === 'nhatre'
                ? day.nhatre
                : day.ansang;

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDate(day.date)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-between border ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-300 text-blue-950 font-bold shadow-xs'
                    : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-12 text-[11px] font-semibold">{day.dayOfWeek}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {day.date.split('-').slice(1).reverse().join('/')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                      currentPlan.status === 'LOCKED'
                        ? 'bg-purple-100 text-purple-700'
                        : currentPlan.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : currentPlan.status === 'OPTIMIZED'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {currentPlan.status === 'LOCKED'
                      ? 'Khóa sổ'
                      : currentPlan.status === 'APPROVED'
                      ? 'Duyệt'
                      : currentPlan.status === 'OPTIMIZED'
                      ? 'Cân đối'
                      : 'Nháp'}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PHÂN HỆ BÁN TRÚ (NHÓM TRẺ - THỰC ĐƠN CHUẨN QLMN) */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            NHÓM TRẺ - THỰC ĐƠN
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="px-2 py-0.5 rounded bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] shadow-xs transition-colors"
              title="Tổng hợp các nhóm trẻ"
            >
              Tổng hợp
            </button>
            <button
              type="button"
              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs transition-colors"
              title="Thêm thực đơn nhóm trẻ"
            >
              + Thêm
            </button>
          </div>
        </div>

        {/* Danh sách 3 nhóm trẻ có số lượng cháu chuẩn QLMN */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSegmentChange('nhatre')}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-all border ${
              currentSegment === 'nhatre'
                ? 'bg-blue-50/90 border-blue-300 text-blue-950 font-bold shadow-xs'
                : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-5 text-center font-mono font-bold text-slate-400">1.</span>
              <span>Nhà trẻ</span>
            </div>
            <span className="font-mono text-slate-500 font-semibold">(0)</span>
          </button>

          <button
            type="button"
            onClick={() => onSegmentChange('maugiao')}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-all border ${
              currentSegment === 'maugiao'
                ? 'bg-blue-50/90 border-blue-300 text-blue-950 font-bold shadow-xs'
                : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-5 text-center font-mono font-bold text-blue-600">2.</span>
              <span className="font-bold">Mẫu giáo</span>
            </div>
            <span className="font-mono text-blue-700 font-bold">({studentCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onSegmentChange('ansang')}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-all border ${
              currentSegment === 'ansang'
                ? 'bg-blue-50/90 border-blue-300 text-blue-950 font-bold shadow-xs'
                : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-5 text-center font-mono font-bold text-slate-400">3.</span>
              <span>Ăn sáng</span>
            </div>
            <span className="font-mono text-slate-500 font-semibold">(0)</span>
          </button>
        </div>

        {/* Cấu hình Sĩ số và Đơn giá */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase">SĨ SỐ ĂN (CHÁU)</label>
            <input
              type="number"
              value={studentCount}
              onChange={(e) => onStudentCountChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-800 text-center focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase">TIỀN ĂN (Đ/CHÁU)</label>
            <input
              type="number"
              step="1000"
              disabled={!canEditPrice}
              value={mealPrice}
              onChange={(e) => onMealPriceChange(Math.max(1000, parseInt(e.target.value) || 1000))}
              className={`w-full mt-1 border rounded-lg px-2 py-1 font-mono font-bold text-right focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                canEditPrice ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 3. KHỐI CÂY MÓN ĂN THEO BỮA (THÔNG TIN THỰC ĐƠN CHUẨN QLMN) */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            THÔNG TIN THỰC ĐƠN
          </label>
          <span className="text-[10px] text-slate-400">Cây món ăn</span>
        </div>

        <div className="space-y-1.5 text-xs">
          {/* Bữa sáng */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-amber-50/60 px-2.5 py-1 flex items-center justify-between font-bold text-amber-950 text-[11px]">
              <span>Bữa sáng</span>
              <button type="button" className="text-amber-700 hover:text-amber-900 font-bold px-1 rounded">+</button>
            </div>
          </div>

          {/* Bữa trưa */}
          <div className="rounded-lg border border-blue-200 overflow-hidden">
            <div className="bg-blue-50 px-2.5 py-1 flex items-center justify-between font-bold text-blue-950 text-[11px]">
              <span>Bữa trưa</span>
              <button type="button" className="text-blue-700 hover:text-blue-900 font-bold px-1 rounded">+</button>
            </div>
            <div className="px-3 py-1.5 bg-white space-y-1 text-[11px] text-slate-700 border-t border-blue-100">
              <div className="flex items-center gap-1.5">
                <span className="text-blue-500">•</span>
                <span className="font-semibold text-slate-800">Cơm:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-blue-500">•</span>
                <span>Canh tần ô tôm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-blue-500">•</span>
                <span>Xíu mại</span>
              </div>
            </div>
          </div>

          {/* Bữa xế */}
          <div className="rounded-lg border border-emerald-200 overflow-hidden">
            <div className="bg-emerald-50 px-2.5 py-1 flex items-center justify-between font-bold text-emerald-950 text-[11px]">
              <span>Bữa xế</span>
              <button type="button" className="text-emerald-700 hover:text-emerald-900 font-bold px-1 rounded">+</button>
            </div>
            <div className="px-3 py-1 bg-white text-[11px] text-slate-700 border-t border-emerald-100">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-500">•</span>
                <span>Súp bắp thịt heo</span>
              </div>
            </div>
          </div>

          {/* Bữa phụ */}
          <div className="rounded-lg border border-purple-200 overflow-hidden">
            <div className="bg-purple-50 px-2.5 py-1 flex items-center justify-between font-bold text-purple-950 text-[11px]">
              <span>Bữa phụ</span>
              <button type="button" className="text-purple-700 hover:text-purple-900 font-bold px-1 rounded">+</button>
            </div>
            <div className="px-3 py-1.5 bg-white space-y-1 text-[11px] text-slate-700 border-t border-purple-100">
              <div className="flex items-center gap-1.5">
                <span className="text-purple-500">•</span>
                <span>Chuối già</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-purple-500">•</span>
                <span>Sữa Metacare</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* 3. 4 THẺ KPI DINH DƯỠNG & KIỂM SOÁT PHÁP LÝ */}
      <div className="space-y-2">
        {/* KPI 1: Năng lượng Atwater */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              NĂNG LƯỢNG ATWATER
            </span>
            <span
              className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                totals.isCaloPass ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {totals.isCaloPass ? '✓ ĐẠT' : 'LỆCH CHUẨN'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-slate-900 tracking-tight">
              {formatNumber(totals.totalCalo, 1)} <span className="text-xs font-normal text-slate-500">Kcal/trẻ</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Chuẩn: 615 - 738 Kcal</span>
          </div>
        </div>

        {/* KPI 2: Cơ cấu P - L - G */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              TỶ LỆ CƠ CẤU P - L - G
            </span>
            <span className="font-bold text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
              {totals.isRatioPass ? 'ĐẠT CHUẨN' : 'CẦN CÂN ĐỐI'}
            </span>
          </div>

          <div className="flex items-center justify-between font-mono font-bold text-xs mb-1.5">
            <span className="text-rose-600">{totals.proteinPct.toFixed(1)}% P</span>
            <span className="text-amber-600">{totals.fatPct.toFixed(1)}% L</span>
            <span className="text-emerald-600">{totals.carbsPct.toFixed(1)}% G</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100">
            <div style={{ width: `${totals.proteinPct}%` }} className="bg-rose-500" />
            <div style={{ width: `${totals.fatPct}%` }} className="bg-amber-500" />
            <div style={{ width: `${totals.carbsPct}%` }} className="bg-emerald-500" />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
            <span>Đạm ĐV: <strong>{totals.animalProteinRatio.toFixed(1)}%</strong> (≥50%)</span>
            <span>Béo TV: <strong>{totals.plantFatRatio.toFixed(1)}%</strong> (≥45%)</span>
          </div>
        </div>

        {/* KPI 3: QĐ 2195 Natri & Đường */}
        <div
          onClick={onOpenAuditDrawer}
          className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-sm cursor-pointer transition"
          title="Bấm để mở Ngăn Thẩm Định Lượng & Chất (QĐ 2195)"
        >
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              KIỂM SOÁT QĐ 2195
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded hover:bg-indigo-100">
              CHI TIẾT &rarr;
            </span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Natri (Muối ăn):</span>
              <span className={`font-mono font-bold ${totals.isSodiumPass ? 'text-slate-800' : 'text-rose-600'}`}>
                {Math.round(totals.totalSodiumMg)} / ≤1200 mg
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Đường tự do:</span>
              <span className={`font-mono font-bold ${totals.isSugarPass ? 'text-slate-800' : 'text-rose-600'}`}>
                {totals.freeSugarCaloPct.toFixed(1)}% / ≤10% Calo
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Ngân sách bán trú */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <CircleDollarSign className="w-3.5 h-3.5 text-emerald-600" />
              NGÂN SÁCH ({studentCount} CHÁU)
            </span>
            <span
              className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                totals.budgetDifference >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {totals.budgetDifference >= 0 ? 'DƯ QUỸ' : 'BỘI CHI'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-black font-mono text-slate-900">
              {formatCurrency(totals.totalCost)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              BQ: {formatNumber(totals.costPerChild, 0)} đ/trẻ
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Chênh lệch ngân sách:</span>
            <strong className={`font-mono ${totals.budgetDifference >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatCurrency(totals.budgetDifference)}
            </strong>
          </div>
        </div>
      </div>
    </aside>
  );
};
