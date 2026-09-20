'use client';

import React, { useState } from 'react';
import { Sliders, X, Sparkles, Check, RotateCcw } from 'lucide-react';
import { SolverOptions } from '../../engine/milp-solver';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: SolverOptions;
  onSaveConfig: (newConfig: SolverOptions) => void;
  onRunSolverWithConfig: (customConfig: SolverOptions) => void;
}

export const SolverConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onRunSolverWithConfig,
}) => {
  const [costWeight, setCostWeight] = useState<number>(config.costWeight ?? 1.2);
  const [caloWeight, setCaloWeight] = useState<number>(config.caloWeight ?? 3.0);
  const [macroWeight, setMacroWeight] = useState<number>(config.macroWeight ?? 1.0);
  const [minScaleFactor, setMinScaleFactor] = useState<number>(config.minScaleFactor ?? 0.5);
  const [maxScaleFactor, setMaxScaleFactor] = useState<number>(config.maxScaleFactor ?? 1.6);

  // Cấu hình bước làm tròn ĐVT
  const [milkStep, setMilkStep] = useState<number>(config.roundingConfig?.milkStep ?? 1);
  const [eggStep, setEggStep] = useState<number>(config.roundingConfig?.eggStep ?? 1);
  const [oilStep, setOilStep] = useState<number>(config.roundingConfig?.oilStep ?? 0.5);
  const [fishSauceStep, setFishSauceStep] = useState<number>(config.roundingConfig?.fishSauceStep ?? 0.1);
  const [seasoningStep, setSeasoningStep] = useState<number>(config.roundingConfig?.seasoningStep ?? 0.1);

  if (!isOpen) return null;

  const handleResetDefault = () => {
    setCostWeight(1.2);
    setCaloWeight(3.0);
    setMacroWeight(1.0);
    setMinScaleFactor(0.5);
    setMaxScaleFactor(1.6);
    setMilkStep(1);
    setEggStep(1);
    setOilStep(0.5);
    setFishSauceStep(0.1);
    setSeasoningStep(0.1);
  };

  const currentOptions: SolverOptions = {
    ...config,
    costWeight,
    caloWeight,
    macroWeight,
    minScaleFactor,
    maxScaleFactor,
    roundingConfig: {
      milkStep,
      eggStep,
      oilStep,
      fishSauceStep,
      seasoningStep,
      otherStep: 0.01,
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-sm">Cấu hình thuật toán Solver MILP</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Sliders */}
        <div className="p-5 space-y-4 text-xs">
          {/* Preset buttons */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Chế độ mẫu:</span>
            <button
              onClick={() => {
                setCostWeight(1.2);
                setCaloWeight(3.0);
                setMacroWeight(1.0);
              }}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px]"
            >
              Chuẩn QĐ 2195
            </button>
            <button
              onClick={() => {
                setCostWeight(2.2);
                setCaloWeight(2.0);
                setMacroWeight(0.8);
              }}
              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-[10px]"
            >
              Tiết kiệm chi phí
            </button>
            <button
              onClick={() => {
                setCostWeight(0.8);
                setCaloWeight(4.5);
                setMacroWeight(1.5);
              }}
              className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-[10px]"
            >
              Tối đa Năng lượng
            </button>
          </div>

          {/* Slider 1: Ưu tiên chi phí */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-700">Trọng số kiểm soát Chi phí:</span>
              <span className="font-mono text-blue-600 font-bold">{costWeight.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.1"
              value={costWeight}
              onChange={(e) => setCostWeight(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">Trọng số cao sẽ thắt chặt sai số tiền ăn khớp với mức thu/trẻ.</p>
          </div>

          {/* Slider 2: Ưu tiên Calo */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-700">Trọng số kiểm soát Năng lượng (Calo):</span>
              <span className="font-mono text-blue-600 font-bold">{caloWeight.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.2"
              value={caloWeight}
              onChange={(e) => setCaloWeight(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">Trọng số cao sẽ ưu tiên đưa tổng calo vào giữa dải vàng QĐ 2195.</p>
          </div>

          {/* Slider 3: Cân bằng P-L-G */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-700">Trọng số cân bằng Tỷ lệ P - L - C:</span>
              <span className="font-mono text-blue-600 font-bold">{macroWeight.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={macroWeight}
              onChange={(e) => setMacroWeight(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Slider 4: Biên độ co giãn khối lượng */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-700">Biên độ co giãn định lượng món:</span>
              <span className="font-mono text-blue-600 font-bold">
                {Math.round(minScaleFactor * 100)}% - {Math.round(maxScaleFactor * 100)}%
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-[10px] text-slate-400">Min:</span>
              <input
                type="range"
                min="0.3"
                max="0.8"
                step="0.05"
                value={minScaleFactor}
                onChange={(e) => setMinScaleFactor(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Max:</span>
              <input
                type="range"
                min="1.2"
                max="2.2"
                step="0.05"
                value={maxScaleFactor}
                onChange={(e) => setMaxScaleFactor(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Quy tắc làm tròn ĐVT khi chạy Solver */}
          <div className="pt-3 border-t border-slate-100">
            <span className="font-bold text-slate-800 text-[11px] block mb-1.5">
              Quy tắc làm tròn Thực mua ĐVT (Solver):
            </span>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Sữa (Hộp/Vỉ):</span>
                <select
                  value={milkStep}
                  onChange={(e) => setMilkStep(parseFloat(e.target.value))}
                  className="px-1.5 py-0.5 rounded border border-slate-300 font-mono font-bold text-[10.5px] bg-white"
                >
                  <option value={1}>1 hộp (nguyên)</option>
                  <option value={4}>4 hộp (1 lốc)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Trứng (Quả):</span>
                <select
                  value={eggStep}
                  onChange={(e) => setEggStep(parseFloat(e.target.value))}
                  className="px-1.5 py-0.5 rounded border border-slate-300 font-mono font-bold text-[10.5px] bg-white"
                >
                  <option value={1}>1 quả (nguyên)</option>
                  <option value={5}>5 quả</option>
                  <option value={10}>10 quả (1 chục)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Dầu ăn:</span>
                <select
                  value={oilStep}
                  onChange={(e) => setOilStep(parseFloat(e.target.value))}
                  className="px-1.5 py-0.5 rounded border border-slate-300 font-mono font-bold text-[10.5px] bg-white"
                >
                  <option value={0.5}>0.5 lít</option>
                  <option value={1}>1 lít / chai</option>
                  <option value={2}>2 lít / can</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Nước mắm:</span>
                <select
                  value={fishSauceStep}
                  onChange={(e) => setFishSauceStep(parseFloat(e.target.value))}
                  className="px-1.5 py-0.5 rounded border border-slate-300 font-mono font-bold text-[10.5px] bg-white"
                >
                  <option value={0.1}>0.1 lít</option>
                  <option value={0.5}>0.5 lít</option>
                  <option value={1}>1 lít / chai</option>
                </select>
              </div>

              <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-600">Gia vị nấu (muối, đường, hành...):</span>
                <select
                  value={seasoningStep}
                  onChange={(e) => setSeasoningStep(parseFloat(e.target.value))}
                  className="px-1.5 py-0.5 rounded border border-slate-300 font-mono font-bold text-[10.5px] bg-white"
                >
                  <option value={0.1}>0.1 kg (1 lạng)</option>
                  <option value={0.5}>0.5 kg (nửa cân)</option>
                  <option value={1}>1 kg</option>
                </select>
              </div>

              <div className="col-span-2 text-[10px] text-emerald-700 bg-emerald-50/70 px-2 py-1 rounded">
                ✓ <strong>Thực phẩm tươi sống & ngũ cốc</strong> (thịt, cá, tôm, rau, củ, quả, gạo, bún): <strong>để lẻ tự nhiên</strong> (bước 0.01 kg), không ép nguyên.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleResetDefault}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs font-medium cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onSaveConfig(currentOptions);
                onClose();
              }}
              className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
            >
              Lưu cấu hình
            </button>
            <button
              onClick={() => {
                onSaveConfig(currentOptions);
                onRunSolverWithConfig(currentOptions);
                onClose();
              }}
              className="flex items-center gap-1 px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chạy Solver ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
