'use client';

import React from 'react';
import { AgeGroup, NutritionTotals } from '../../types/nutrition';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { AlertTriangle, CheckCircle2, DollarSign, Flame, HeartPulse, Scale, ShieldCheck } from 'lucide-react';

interface Props {
  totals: NutritionTotals;
  ageGroup: AgeGroup;
}

export const NutritionSummary: React.FC<Props> = ({ totals, ageGroup }) => {
  const isMG = ageGroup === 'maugiao';
  const caloTargetText = isMG ? '615 - 738 Kcal' : '600 - 651 Kcal';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-white border-b border-gray-200">
      {/* CARD 1: Năng lượng Kcal */}
      <div className="p-3 rounded-lg border bg-gradient-to-br from-amber-50 to-orange-50/40 border-amber-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-600" /> Năng lượng Atwater
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
              totals.isCaloPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {totals.isCaloPass ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {totals.isCaloPass ? 'ĐẠT' : 'LỆCH'}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black font-mono tracking-tight text-gray-900">
            {formatNumber(totals.totalCalo, 1)}
          </span>
          <span className="text-xs text-gray-600 font-medium">Kcal / trẻ</span>
        </div>
        <div className="mt-1 text-xs text-gray-500 flex justify-between">
          <span>Chuẩn TT 51/2020:</span>
          <span className="font-semibold text-gray-700">{caloTargetText}</span>
        </div>
      </div>

      {/* CARD 2: Cơ cấu P - L - G */}
      <div className="p-3 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50/40 border-blue-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-blue-600" /> Tỷ lệ P - L - G
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              totals.isRatioPass ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {totals.isRatioPass ? 'ĐẠT CHUẨN' : 'CHƯA CÂN ĐỐI'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 my-1 text-sm font-bold font-mono">
          <span className="text-rose-600">{formatNumber(totals.proteinPct, 1)}% P</span>
          <span className="text-gray-400">•</span>
          <span className="text-amber-600">{formatNumber(totals.fatPct, 1)}% L</span>
          <span className="text-gray-400">•</span>
          <span className="text-emerald-600">{formatNumber(totals.carbsPct, 1)}% G</span>
        </div>
        {/* Progress bar P-L-G */}
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden flex mt-2">
          <div style={{ width: `${totals.proteinPct}%` }} className="bg-rose-500" title="Protein" />
          <div style={{ width: `${totals.fatPct}%` }} className="bg-amber-400" title="Lipid" />
          <div style={{ width: `${totals.carbsPct}%` }} className="bg-emerald-500" title="Glucid" />
        </div>
        <div className="mt-1 text-[11px] text-gray-500 flex justify-between">
          <span>Đạm ĐV: <b className="text-gray-700">{formatNumber(totals.animalProteinRatio, 1)}%</b> (≥50%)</span>
          <span>Béo TV: <b className="text-gray-700">{formatNumber(totals.plantFatRatio, 1)}%</b> (≥45%)</span>
        </div>
      </div>

      {/* CARD 3: Kiểm soát QĐ 2195 (Natri & Đường) */}
      <div className="p-3 rounded-lg border bg-gradient-to-br from-purple-50 to-pink-50/40 border-purple-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-purple-600" /> Kiểm soát QĐ 2195
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-200 text-purple-900 rounded">
            BẮT BUỘC
          </span>
        </div>
        <div className="space-y-1.5 text-xs mt-1.5">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Natri (Muối ăn):</span>
            <span
              className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                totals.isSodiumPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {Math.round(totals.totalSodiumMg)} mg / ≤1200mg
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Đường tự do (Free Sugar):</span>
            <span
              className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                totals.isSugarPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {formatNumber(totals.freeSugarCaloPct, 1)}% / ≤10% Calo
            </span>
          </div>
        </div>
      </div>

      {/* CARD 4: Cân đối Tài chính */}
      <div
        className={`p-3 rounded-lg border ${
          totals.budgetDifference < 0
            ? 'bg-gradient-to-br from-rose-50 to-red-50/40 border-rose-300'
            : 'bg-gradient-to-br from-emerald-50 to-green-50/40 border-emerald-200'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Ngân sách ({totals.studentCount} cháu)
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              totals.budgetDifference < 0 ? 'bg-rose-200 text-rose-900' : 'bg-emerald-200 text-emerald-900'
            }`}
          >
            {totals.budgetDifference < 0 ? 'BỘI CHI' : 'CÒN DƯ'}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-black font-mono text-gray-900">
            {formatCurrency(totals.totalCost)}
          </span>
          <span className="text-xs text-gray-500">
            {formatNumber(totals.costPerChild, 0)} đ/trẻ
          </span>
        </div>
        <div className="mt-2 text-xs flex justify-between items-center pt-1 border-t border-gray-200/60">
          <span className="text-gray-600">Chênh lệch ngân sách:</span>
          <span
            className={`font-mono font-bold ${
              totals.budgetDifference < 0 ? 'text-rose-600' : 'text-emerald-700'
            }`}
          >
            {totals.budgetDifference > 0 ? '+' : ''}
            {formatCurrency(totals.budgetDifference)}
          </span>
        </div>
      </div>
    </div>
  );
};
