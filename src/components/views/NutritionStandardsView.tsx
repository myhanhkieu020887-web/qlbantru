'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Save,
  RotateCcw,
  Sparkles,
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Utensils,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { NutritionStandardConfig } from '@/types/nutrition-standard';
import { AgeGroup } from '@/types/nutrition';
import { formatCurrency } from '@/lib/utils';

interface Props {
  standards: Record<string, NutritionStandardConfig>;
  onSaveStandard: (standard: NutritionStandardConfig) => void;
  onResetStandard: (ageGroup: AgeGroup) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const NutritionStandardsView: React.FC<Props> = ({
  standards,
  onSaveStandard,
  onResetStandard,
  onShowToast,
}) => {
  const [activeGroup, setActiveGroup] = useState<AgeGroup>('maugiao');
  const [currentConfig, setCurrentConfig] = useState<NutritionStandardConfig>(
    standards[activeGroup] || standards.maugiao
  );

  // Khi chuyển tab nhóm tuổi
  const handleSwitchTab = (group: AgeGroup) => {
    setActiveGroup(group);
    setCurrentConfig(standards[group]);
  };

  const handleSave = () => {
    onSaveStandard(currentConfig);
    onShowToast(`✓ Đã cập nhật định mức & tỷ lệ 3 bữa cho nhóm: ${currentConfig.title}`, 'success');
  };

  const handleReset = () => {
    onResetStandard(activeGroup);
    setCurrentConfig(standards[activeGroup]);
    onShowToast(`Đã khôi phục định mức chuẩn QĐ 2195 cho ${currentConfig.title}`, 'info');
  };

  const mealBudgetSum =
    currentConfig.mealBudgetRatio.lunchPct +
    currentConfig.mealBudgetRatio.afternoonSnackPct +
    currentConfig.mealBudgetRatio.lateSnackPct;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 font-sans">
      {/* 1. HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Sliders className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Cấu hình Định mức Dinh dưỡng & Tỷ lệ Phân bổ 3 Bữa
              </h1>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Chuẩn QĐ 2195/QĐ-BGDĐT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Trường MN Hàm Thắng 2 • Tùy chỉnh tỷ lệ Calo, P-L-G và phân bổ ngân sách tiền ăn 3 bữa tự động đồng bộ vào Solver MILP
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>Khôi phục gốc</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Lưu & Đồng bộ MILP</span>
            </button>
          </div>
        </div>

        {/* Tabs chọn 3 phân hệ lứa tuổi */}
        <div className="flex items-center gap-2 mt-4">
          {[
            { id: 'maugiao', label: '1. Mẫu giáo (3 - 6 tuổi)', sub: '615 - 726 Kcal' },
            { id: 'nhatre', label: '2. Nhà trẻ (24 - 36 tháng)', sub: '600 - 651 Kcal' },
            { id: 'ansang', label: '3. Bữa ăn sáng (Tự chọn)', sub: '200 - 260 Kcal' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSwitchTab(tab.id as AgeGroup)}
              className={`flex flex-col items-start px-4 py-2 rounded-xl border text-left transition-all ${
                activeGroup === tab.id
                  ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-bold">{tab.label}</span>
              <span className="text-[10px] text-slate-400">{tab.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. NỘI DUNG CẤU HÌNH */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CARD 1: KHOẢNG NĂNG LƯỢNG CALO & GIÁ TIỀN BÁN TRÚ */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <Scale className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Khoảng Năng lượng Calo & Mức tiền ăn</h2>
                <p className="text-[11px] text-slate-400">Quy định mức năng lượng tối thiểu - tối đa tại trường</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Calo tối thiểu (Min Kcal)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={currentConfig.minCalo}
                    onChange={(e) =>
                      setCurrentConfig({ ...currentConfig, minCalo: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">Kcal</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Calo tối đa (Max Kcal)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={currentConfig.maxCalo}
                    onChange={(e) =>
                      setCurrentConfig({ ...currentConfig, maxCalo: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">Kcal</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mức tiền ăn 1 trẻ/ngày (VNĐ)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={1000}
                  value={currentConfig.defaultDailyPrice}
                  onChange={(e) =>
                    setCurrentConfig({ ...currentConfig, defaultDailyPrice: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold text-emerald-700"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">đ / trẻ</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>{currentConfig.appliedCircular}</span>
            </div>
          </div>

          {/* CARD 2: PHÂN BỔ NGÂN SÁCH & NĂNG LƯỢNG 3 BỮA ĂN */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <PieChart className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Tỷ lệ phân bổ tiền ăn & Calo 3 bữa</h2>
                  <p className="text-[11px] text-slate-400">Chia tỷ trọng ngân sách cho Bữa Trưa, Phụ Xế và Phụ Chiều</p>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  mealBudgetSum === 100
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                Tổng: {mealBudgetSum}%
              </span>
            </div>

            <div className="space-y-3">
              {/* Bữa chính trưa */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">1. Bữa chính trưa (Cơm + Thức ăn mặn + Canh):</span>
                  <span className="font-bold text-blue-600 font-mono">
                    {currentConfig.mealBudgetRatio.lunchPct}% (~
                    {formatCurrency((currentConfig.defaultDailyPrice * currentConfig.mealBudgetRatio.lunchPct) / 100)})
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="80"
                  value={currentConfig.mealBudgetRatio.lunchPct}
                  onChange={(e) =>
                    setCurrentConfig({
                      ...currentConfig,
                      mealBudgetRatio: {
                        ...currentConfig.mealBudgetRatio,
                        lunchPct: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Bữa phụ xế */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">2. Bữa phụ xế (Cháo, súp, bún hoặc sữa):</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {currentConfig.mealBudgetRatio.afternoonSnackPct}% (~
                    {formatCurrency((currentConfig.defaultDailyPrice * currentConfig.mealBudgetRatio.afternoonSnackPct) / 100)})
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={currentConfig.mealBudgetRatio.afternoonSnackPct}
                  onChange={(e) =>
                    setCurrentConfig({
                      ...currentConfig,
                      mealBudgetRatio: {
                        ...currentConfig.mealBudgetRatio,
                        afternoonSnackPct: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-emerald-600"
                />
              </div>

              {/* Bữa phụ chiều */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">3. Bữa phụ chiều (Sữa chua, bánh gạo, hoa quả):</span>
                  <span className="font-bold text-amber-600 font-mono">
                    {currentConfig.mealBudgetRatio.lateSnackPct}% (~
                    {formatCurrency((currentConfig.defaultDailyPrice * currentConfig.mealBudgetRatio.lateSnackPct) / 100)})
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={currentConfig.mealBudgetRatio.lateSnackPct}
                  onChange={(e) =>
                    setCurrentConfig({
                      ...currentConfig,
                      mealBudgetRatio: {
                        ...currentConfig.mealBudgetRatio,
                        lateSnackPct: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-amber-600"
                />
              </div>
            </div>

            {mealBudgetSum !== 100 && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Tổng tỷ lệ 3 bữa phải bằng 100% (Hiện tại là {mealBudgetSum}%)</span>
              </div>
            )}
          </div>

          {/* CARD 3: TỶ LỆ P - L - G (PROTEIN - LIPID - GLUCID) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                <Layers className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Tỷ lệ Năng lượng 3 Nhóm Sinh Dưỡng (P - L - G)</h2>
                <p className="text-[11px] text-slate-400">Ràng buộc tối thiểu - tối đa theo Thông tư 28/2016/TT-BGDĐT</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Protein */}
              <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900">Protein (Chất đạm)</span>
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">1g = 4 Kcal</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Tối thiểu:</span>
                    <input
                      type="number"
                      value={currentConfig.macroRatio.proteinPctMin}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          macroRatio: { ...currentConfig.macroRatio, proteinPctMin: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-bold font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Tối đa:</span>
                    <input
                      type="number"
                      value={currentConfig.macroRatio.proteinPctMax}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          macroRatio: { ...currentConfig.macroRatio, proteinPctMax: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-bold font-mono"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-rose-600 block">Chuẩn Bộ: 13% - 20%</span>
              </div>

              {/* Lipid */}
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">Lipid (Chất béo)</span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded">1g = 9 Kcal</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Tối thiểu:</span>
                    <input
                      type="number"
                      value={currentConfig.macroRatio.fatPctMin}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          macroRatio: { ...currentConfig.macroRatio, fatPctMin: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-bold font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Tối đa:</span>
                    <input
                      type="number"
                      value={currentConfig.macroRatio.fatPctMax}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          macroRatio: { ...currentConfig.macroRatio, fatPctMax: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-bold font-mono"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-amber-600 block">
                  {activeGroup === 'maugiao' ? 'Chuẩn MG: 25% - 35%' : 'Chuẩn NT: 30% - 40%'}
                </span>
              </div>

              {/* Carbs */}
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900">Glucid (Đường bột)</span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded">1g = 4 Kcal</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Tối thiểu:</span>
                    <input
                      type="number"
                      value={currentConfig.macroRatio.carbsPctMin}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          macroRatio: { ...currentConfig.macroRatio, carbsPctMin: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-bold font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Tối đa:</span>
                    <input
                      type="number"
                      value={currentConfig.macroRatio.carbsPctMax}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          macroRatio: { ...currentConfig.macroRatio, carbsPctMax: Number(e.target.value) },
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-bold font-mono"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-blue-600 block">Chuẩn Bộ: 52% - 60%</span>
              </div>
            </div>

            {/* Tỷ lệ ĐV / TV & Natri */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Đạm động vật tối thiểu:</span>
                <div className="relative">
                  <input
                    type="number"
                    value={currentConfig.animalProteinRatioMin}
                    onChange={(e) =>
                      setCurrentConfig({ ...currentConfig, animalProteinRatioMin: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-bold font-mono"
                  />
                  <span className="absolute right-2 top-1.5 text-slate-400">%</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Béo thực vật tối thiểu:</span>
                <div className="relative">
                  <input
                    type="number"
                    value={currentConfig.plantFatRatioMin}
                    onChange={(e) =>
                      setCurrentConfig({ ...currentConfig, plantFatRatioMin: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-bold font-mono"
                  />
                  <span className="absolute right-2 top-1.5 text-slate-400">%</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Natri tối đa (Muối):</span>
                <div className="relative">
                  <input
                    type="number"
                    value={currentConfig.maxSodiumMg}
                    onChange={(e) =>
                      setCurrentConfig({ ...currentConfig, maxSodiumMg: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-bold font-mono"
                  />
                  <span className="absolute right-2 top-1.5 text-slate-400">mg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
