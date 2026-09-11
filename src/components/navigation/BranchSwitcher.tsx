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
    <div className="inline-flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-md border border-slate-200 text-[11px] shadow-2xs select-none shrink-0">
      {/* Nút Toàn trường */}
      <button
        type="button"
        onClick={() => onBranchChange('all')}
        className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer ${
          selectedBranchId === 'all'
            ? 'bg-white text-blue-700 font-bold shadow-2xs border border-slate-200/80'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
        title={`Tổng hợp toàn trường: ${totalStudents} trẻ`}
      >
        <Building2 className={`w-3 h-3 ${selectedBranchId === 'all' ? 'text-blue-600' : 'text-slate-400'}`} />
        <span>Toàn trường</span>
        <span
          className={`font-mono text-[10px] px-1 py-0.1 rounded font-bold ${
            selectedBranchId === 'all'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-slate-200/70 text-slate-600'
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
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer ${
              isSelected
                ? 'bg-white text-emerald-700 font-bold shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title={`${b.name}: ${b.studentCount} trẻ`}
          >
            <School className={`w-3 h-3 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{b.name}</span>
            <span className="sm:hidden">{b.code}</span>
            <span
              className={`font-mono text-[10px] px-1 py-0.1 rounded font-bold ${
                isSelected
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-200/70 text-slate-600'
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
