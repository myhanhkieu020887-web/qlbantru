'use client';

import React from 'react';
import { Building2, School, Users } from 'lucide-react';
import { SchoolBranch } from '@/types/nutrition';

interface BranchSwitcherProps {
  selectedBranchId: string; // 'all' | 'branch_1' | 'branch_2'
  onBranchChange: (branchId: string) => void;
  branches: SchoolBranch[];
  totalStudents: number;
}

export const BranchSwitcher: React.FC<BranchSwitcherProps> = ({
  selectedBranchId,
  onBranchChange,
  branches,
  totalStudents,
}) => {
  return (
    <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 shadow-inner">
      {/* Nút Toàn trường */}
      <button
        type="button"
        onClick={() => onBranchChange('all')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
          selectedBranchId === 'all'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
        }`}
        title={`Tổng hợp toàn trường: ${totalStudents} trẻ`}
      >
        <Building2 className="w-3.5 h-3.5 text-blue-300" />
        <span>Toàn trường</span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
            selectedBranchId === 'all'
              ? 'bg-blue-700 text-blue-100'
              : 'bg-slate-700 text-slate-300'
          }`}
        >
          {totalStudents}
        </span>
      </button>

      {/* Các điểm trường con */}
      {branches.map((b) => {
        const isSelected = selectedBranchId === b.id;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onBranchChange(b.id)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
              isSelected
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title={`${b.name}: ${b.studentCount} trẻ`}
          >
            <School className="w-3 h-3 text-emerald-300" />
            <span>{b.name}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                isSelected
                  ? 'bg-emerald-700 text-emerald-100'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {b.studentCount}
            </span>
          </button>
        );
      })}
    </div>
  );
};
