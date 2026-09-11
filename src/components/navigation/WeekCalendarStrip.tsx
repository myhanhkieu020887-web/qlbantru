'use client';

import React from 'react';
import { DayMenuBundle, MenuStatus, AgeGroup } from '../../types/nutrition';
import { Calendar, CheckCircle, Copy, FileText, Lock, Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  schedule: DayMenuBundle[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  currentSegment: AgeGroup;
  onOpenTemplateModal: () => void;
  onCloneCurrentDay: () => void;
  onFillMonth?: () => void;
  isFillingMonth?: boolean;
}

const STATUS_BADGE: Record<MenuStatus, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: {
    label: 'Đang lập',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: <FileText className="w-3 h-3" />,
  },
  OPTIMIZED: {
    label: 'Đã tối ưu MILP',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: <Sparkles className="w-3 h-3 text-blue-600" />,
  },
  APPROVED: {
    label: 'Hiệu trưởng duyệt',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: <CheckCircle className="w-3 h-3 text-emerald-600" />,
  },
  LOCKED: {
    label: 'Đã khóa sổ',
    color: 'bg-purple-100 text-purple-900 border-purple-300',
    icon: <Lock className="w-3 h-3 text-purple-700" />,
  },
};

export const WeekCalendarStrip: React.FC<Props> = ({
  schedule,
  selectedDate,
  onSelectDate,
  currentSegment,
  onOpenTemplateModal,
  onCloneCurrentDay,
  onFillMonth,
  isFillingMonth = false,
}) => {
  return (
    <div className="bg-[#f0f3f8] border-b border-gray-300 px-3 py-1.5 flex items-center justify-between gap-3 text-xs select-none">
      {/* 1. Header Lịch tuần */}
      <div className="flex items-center gap-2 pr-3 border-r border-gray-300">
        <Calendar className="w-4 h-4 text-blue-700" />
        <div>
          <div className="font-bold text-gray-900 leading-tight">TUẦN 02 / THÁNG 09</div>
          <div className="text-[10px] text-gray-500">Chu kỳ 4 tuần QĐ 2195</div>
        </div>
      </div>

      {/* 2. Dải 5 ngày trong tuần */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto py-0.5">
        {schedule.map((bundle) => {
          const isSelected = bundle.date === selectedDate;
          const plan =
            currentSegment === 'maugiao'
              ? bundle.maugiao
              : currentSegment === 'nhatre'
              ? bundle.nhatre
              : bundle.ansang;

          const badge = STATUS_BADGE[plan.status] || STATUS_BADGE.DRAFT;

          return (
            <button
              key={bundle.date}
              onClick={() => onSelectDate(bundle.date)}
              className={`flex-1 min-w-[150px] max-w-[220px] p-1.5 rounded-lg border text-left transition-all relative ${
                isSelected
                  ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-400/30'
                  : 'bg-white/70 hover:bg-white border-gray-300 hover:border-gray-400 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className={`font-bold text-xs ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                  {bundle.dayOfWeek}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {bundle.date.split('-').slice(1).reverse().join('/')}
                </span>
              </div>

              <div className="text-[11px] text-gray-600 truncate font-medium mb-1">
                {plan.menuTitle.trua || plan.menuTitle.sang || 'Chưa lên thực đơn'}
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded font-semibold border ${badge.color}`}
                >
                  {badge.icon} {badge.label}
                </span>
                <span className="text-[10px] font-mono text-gray-500 font-semibold">
                  {plan.studentCount} cháu
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Tác vụ nhanh lịch tuần */}
      <div className="flex items-center gap-1.5 pl-3 border-l border-gray-300">
        {onFillMonth && (
          <button
            onClick={onFillMonth}
            disabled={isFillingMonth}
            title="Tự động gán thực đơn 4 tuần xoay vòng cho cả tháng"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 font-semibold text-xs shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{isFillingMonth ? 'Đang fill...' : 'Fill tháng'}</span>
          </button>
        )}
        <button
          onClick={onOpenTemplateModal}
          title="Áp dụng thực đơn mẫu tuần theo QĐ 2195"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold text-xs shadow-sm active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Thực đơn mẫu</span>
        </button>
        <button
          onClick={onCloneCurrentDay}
          title="Sao chép thực đơn ngày này sang ngày khác"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold text-xs shadow-sm active:scale-95 cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5 text-blue-600" />
          <span>Sao chép ngày</span>
        </button>
      </div>
    </div>
  );
};
