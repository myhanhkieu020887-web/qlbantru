'use client';

import React from 'react';
import { AgeGroup } from '../../types/nutrition';
import { Users, Sun, Baby, GraduationCap, ClipboardCheck } from 'lucide-react';

interface Props {
  currentSegment: AgeGroup;
  onSegmentChange: (segment: AgeGroup) => void;
  mauGiaoCount: number;
  nhaTreCount: number;
  anSangCount: number;
  onOpenAttendanceModal: () => void;
}

export const SegmentSwitcher: React.FC<Props> = ({
  currentSegment,
  onSegmentChange,
  mauGiaoCount,
  nhaTreCount,
  anSangCount,
  onOpenAttendanceModal,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-3 py-1 flex items-center justify-between text-xs select-none shadow-sm">
      {/* 3 Tabs Phân hệ Bán trú */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-gray-500 uppercase tracking-wider text-[11px] pr-2 border-r border-gray-200">
          Phân hệ Bán trú:
        </span>

        {/* Tab 1: Mẫu giáo */}
        <button
          onClick={() => onSegmentChange('maugiao')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-all ${
            currentSegment === 'maugiao'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>MẪU GIÁO (3 - 6 TUỔI)</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              currentSegment === 'maugiao' ? 'bg-blue-900 text-blue-100' : 'bg-gray-200 text-gray-800'
            }`}
          >
            {mauGiaoCount} cháu • 21.000đ
          </span>
        </button>

        {/* Tab 2: Nhà trẻ */}
        <button
          onClick={() => onSegmentChange('nhatre')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-all ${
            currentSegment === 'nhatre'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <Baby className="w-4 h-4" />
          <span>NHÀ TRẺ (18 - 36 THÁNG)</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              currentSegment === 'nhatre' ? 'bg-purple-900 text-purple-100' : 'bg-gray-200 text-gray-800'
            }`}
          >
            {nhaTreCount} cháu • 21.000đ
          </span>
        </button>

        {/* Tab 3: Ăn sáng */}
        <button
          onClick={() => onSegmentChange('ansang')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold transition-all ${
            currentSegment === 'ansang'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>PHÂN HỆ ĂN SÁNG</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              currentSegment === 'ansang' ? 'bg-amber-800 text-amber-100' : 'bg-gray-200 text-gray-800'
            }`}
          >
            {anSangCount} cháu • 7.000đ
          </span>
        </button>
      </div>

      {/* Nút Báo ăn & Điểm danh lớp học */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenAttendanceModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold transition-all shadow-sm"
        >
          <ClipboardCheck className="w-4 h-4 text-emerald-600" />
          <span>Báo ăn & Điểm danh 9 lớp</span>
          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-mono">
            {mauGiaoCount + nhaTreCount} cháu
          </span>
        </button>
      </div>
    </div>
  );
};
