'use client';

import React, { useState } from 'react';
import {
  AgeGroup,
  ComputedMenuItem,
  NutritionTotals,
  MealCaloEvaluation,
} from '../../types/nutrition';
import { evaluateMealCaloDistribution } from '../../engine/atwater';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { RefreshCw, Info, AlertCircle, CheckCircle2, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

interface Props {
  computedItems: ComputedMenuItem[];
  totals: NutritionTotals;
  ageGroup: AgeGroup;
  onRunSolver: () => void;
  isSolving?: boolean;
}

export const NutritionMatrixFooter: React.FC<Props> = ({
  computedItems,
  totals,
  ageGroup,
  onRunSolver,
  isSolving = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [includeBreakfast, setIncludeBreakfast] = useState<boolean>(false);
  const isMauGiao = ageGroup === 'maugiao';

  // Định mức 1 ngày theo lứa tuổi (Mẫu giáo vs Nhà trẻ)
  const normProteinAnimal = isMauGiao ? 24.0 : 20.49;
  const normProteinPlant = isMauGiao ? 16.0 : 13.66;
  const normFatAnimal = isMauGiao ? 26.0 : 23.23;
  const normFatPlant = isMauGiao ? 18.0 : 15.48;
  const normCarbs = isMauGiao ? 135.0 : 121.95;
  const normCaloMin = isMauGiao ? 615 : 600;
  const normCaloMax = isMauGiao ? 738 : 651;

  // Tính tỷ lệ đạt (%) so với định mức
  const totalNormProtein = normProteinAnimal + normProteinPlant;
  const totalNormFat = normFatAnimal + normFatPlant;

  const proteinAchievedPct =
    totalNormProtein > 0 ? (totals.totalProteinG / totalNormProtein) * 100 : 0;
  const fatAchievedPct = totalNormFat > 0 ? (totals.totalFatG / totalNormFat) * 100 : 0;
  const carbsAchievedPct = normCarbs > 0 ? (totals.carbsG / normCarbs) * 100 : 0;

  // Cơ cấu áp dụng
  const targetP = isMauGiao ? 14 : 14;
  const targetL = isMauGiao ? 32 : 36;
  const targetG = isMauGiao ? 54 : 50;

  // Đánh giá tỉ lệ calo từng bữa
  const mealCaloEvals: MealCaloEvaluation[] = evaluateMealCaloDistribution(
    computedItems,
    totals.totalCalo,
    ageGroup
  );

  // Đánh giá chung
  const isQuantityPass = totals.isCaloPass;
  const isQualityPass = totals.isRatioPass && totals.isAnimalProteinPass && totals.isPlantFatPass;

  // NẾU ĐANG THU GỌN: Render Thanh Tóm Tắt Dinh Dưỡng Siêu Mỏng (Sticky 36px)
  if (!isExpanded) {
    return (
      <div className="border-t-2 border-[#81c784] bg-[#f9fdf8] px-3 py-1.5 text-xs select-none shrink-0 shadow-md flex items-center justify-between">
        {/* Bên trái: Nút mở rộng + Đánh giá Lượng/Chất */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded transition"
            title="Mở rộng bảng ma trận dinh dưỡng 7 dòng và phân bổ calo"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Ma trận dinh dưỡng</span>
          </button>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-500">Lượng:</span>
            <strong className={isQuantityPass ? 'text-emerald-700' : 'text-rose-600'}>
              {isQuantityPass ? '✓ Đạt' : '● Chưa đạt'}
            </strong>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Chất:</span>
            <strong className={isQualityPass ? 'text-emerald-700' : 'text-rose-600'}>
              {isQualityPass ? '✓ Cân đối' : '● Cần chỉnh'}
            </strong>
          </div>
        </div>

        {/* Ở giữa: Calo & Cơ cấu P-L-G */}
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div>
            <span className="text-slate-500 font-sans text-[10px]">Năng lượng: </span>
            <strong className="text-orange-900 font-black">{formatNumber(totals.totalCalo, 1)} Kcal</strong>
            <span className="text-slate-400 font-sans text-[10px]"> (615 - 738)</span>
          </div>

          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span className="text-slate-500 font-sans text-[10px]">Tỷ lệ P:L:G: </span>
            <span className="text-rose-700 font-bold">{totals.proteinPct.toFixed(1)}% P</span>
            <span>:</span>
            <span className="text-amber-700 font-bold">{totals.fatPct.toFixed(1)}% L</span>
            <span>:</span>
            <span className="text-emerald-700 font-bold">{totals.carbsPct.toFixed(1)}% G</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 text-[10px] text-slate-500 font-sans">
            <span>Đạm ĐV: <strong className="font-mono text-slate-800">{totals.animalProteinRatio.toFixed(1)}%</strong></span>
            <span>Béo TV: <strong className="font-mono text-slate-800">{totals.plantFatRatio.toFixed(1)}%</strong></span>
          </div>
        </div>

        {/* Bên phải: Nút Cân đối thực đơn */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRunSolver}
            disabled={isSolving}
            className="flex items-center gap-1 bg-[#f57c00] hover:bg-[#e65100] text-white py-1 px-2.5 rounded font-bold text-[11px] shadow-xs transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSolving ? 'animate-spin' : ''}`} />
            <span>{isSolving ? 'Đang cân đối...' : 'Cân đối thực đơn'}</span>
          </button>
        </div>
      </div>
    );
  }

  // TRẠNG THÁI MỞ RỘNG (EXPANDED):
  return (
    <div className="border-t-2 border-[#81c784] bg-[#f9fdf8] p-2.5 text-xs select-none shrink-0 shadow-lg relative">
      {/* NÚT THU GỌN Ở GÓC TRÊN CÙNG */}
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#c8e2bd]">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
          <span className="text-emerald-800">📊 MA TRẬN ĐÁNH GIÁ LƯỢNG & CHẤT CHI TIẾT</span>
          <span className="text-[10px] font-normal text-slate-500">(Theo Thông tư 51/2020 & QĐ 2195)</span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 px-2 py-0.5 rounded transition"
          title="Thu gọn ma trận để xem nhiều dòng thực phẩm hơn"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          <span>Thu gọn chân trang</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 items-stretch justify-between">
        {/* KHỐI TRÁI: ĐÁNH GIÁ LƯỢNG / CHẤT & NÚT CÂN ĐỐI */}
        <div className="w-full lg:w-48 shrink-0 flex flex-col justify-between border-r border-[#c8e2bd] pr-3 space-y-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <span>Đánh giá về lượng:</span>
                <Info className="w-3 h-3 text-slate-400" />
              </span>
              <span
                className={`font-bold text-[11px] ${
                  isQuantityPass ? 'text-emerald-700' : 'text-[#d32f2f]'
                }`}
              >
                {isQuantityPass ? '✓ Đạt' : '● Chưa đạt'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <span>Đánh giá về chất:</span>
                <Info className="w-3 h-3 text-slate-400" />
              </span>
              <span
                className={`font-bold text-[11px] ${
                  isQualityPass ? 'text-emerald-700' : 'text-[#d32f2f]'
                }`}
              >
                {isQualityPass ? '✓ Cân đối' : '● Chưa cân đối'}
              </span>
            </div>
          </div>

          {/* NÚT CAM NỔI BẬT CHUẨN QLMN: CÂN ĐỐI THỰC ĐƠN */}
          <button
            type="button"
            onClick={onRunSolver}
            disabled={isSolving}
            className="w-full flex items-center justify-center gap-1.5 bg-[#f57c00] hover:bg-[#e65100] text-white py-1.5 px-3 rounded-lg font-bold text-xs shadow transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSolving ? 'animate-spin' : ''}`} />
            <span>{isSolving ? 'Đang cân đối...' : 'Cân đối thực đơn'}</span>
          </button>

          {/* CHÚ THÍCH TRẠNG THÁI TỒN KHO */}
          <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-[#e0f0dc]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#4caf50] rounded-xs inline-block" /> Còn kho
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#ffeb3b] rounded-xs inline-block border border-slate-300" /> Sắp hết
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#f44336] rounded-xs inline-block" /> Đã hết
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#9e9e9e] rounded-xs inline-block" /> Đi chợ
            </span>
          </div>
        </div>

        {/* KHỐI GIỮA: MA TRẬN 7 DÒNG THÀNH PHẦN DINH DƯỠNG */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="font-black text-xs uppercase text-[#2e7d32] tracking-wide">
              ▼ THÀNH PHẦN DINH DƯỠNG :
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBreakfast}
                  onChange={(e) => setIncludeBreakfast(e.target.checked)}
                  className="rounded text-[#4caf50]"
                />
                <span className="text-slate-600">Ăn sáng</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                  className="rounded text-[#4caf50]"
                />
                <span className="text-slate-900 font-semibold">Ăn chính</span>
              </label>
            </div>
          </div>

          <table className="w-full text-center border-collapse border border-[#c8e2bd] text-[11px] bg-white">
            <thead>
              <tr className="bg-[#e8f5e9] text-slate-800 font-bold border-b border-[#c8e2bd]">
                <th rowSpan={2} className="border-r border-[#c8e2bd] px-2 py-1 text-left w-36">
                  Tiêu chí
                </th>
                <th colSpan={2} className="border-r border-[#c8e2bd] px-2 py-0.5">
                  Đạm (g)
                </th>
                <th colSpan={2} className="border-r border-[#c8e2bd] px-2 py-0.5">
                  Béo (g)
                </th>
                <th rowSpan={2} className="border-r border-[#c8e2bd] px-2 py-1">
                  Đường (g)
                </th>
                <th rowSpan={2} className="border-r border-[#c8e2bd] px-2 py-1">
                  Calo (kCal)
                </th>
                <th rowSpan={2} className="px-2 py-1 text-right">
                  Tiền 1 trẻ (VNĐ)
                </th>
              </tr>
              <tr className="bg-[#e8f5e9] text-slate-700 font-semibold border-b border-[#c8e2bd] text-[10px]">
                <th className="border-r border-[#c8e2bd] px-1.5 py-0.5">Động vật</th>
                <th className="border-r border-[#c8e2bd] px-1.5 py-0.5">Thực vật</th>
                <th className="border-r border-[#c8e2bd] px-1.5 py-0.5">Động vật</th>
                <th className="border-r border-[#c8e2bd] px-1.5 py-0.5">Thực vật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0f0dc] font-mono">
              {/* DÒNG 1: TỔNG CỘNG */}
              <tr className="hover:bg-[#f1f8e9]">
                <td className="text-left font-sans font-bold px-2 py-1 border-r border-[#c8e2bd] text-slate-800">
                  Tổng cộng
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">
                  {formatNumber(totals.proteinAnimalG, 2)}
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">
                  {formatNumber(totals.proteinPlantG, 2)}
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">
                  {formatNumber(totals.fatAnimalG, 2)}
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">
                  {formatNumber(totals.fatPlantG, 2)}
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd] font-bold">
                  {formatNumber(totals.carbsG, 2)}
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd] font-bold text-indigo-700">
                  {formatNumber(totals.totalCalo, 2)}
                </td>
                <td className="px-2 py-0.5 text-right font-bold text-emerald-800" rowSpan={4}>
                  <div className="font-bold text-xs">{formatNumber(totals.costPerChild, 2)}</div>
                  <div className="text-[10px] text-slate-500 font-sans">
                    Đ1: {formatNumber(totals.costPerChild, 2)}
                  </div>
                </td>
              </tr>

              {/* DÒNG 2: ĐỊNH MỨC MỘT NGÀY */}
              <tr className="bg-[#fafdfa] text-slate-600">
                <td className="text-left font-sans font-medium px-2 py-1 border-r border-[#c8e2bd]">
                  Định mức một ngày
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">{normProteinAnimal}</td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">{normProteinPlant}</td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">{normFatAnimal}</td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">{normFatPlant}</td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">{normCarbs}</td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">
                  {normCaloMin} - {normCaloMax}
                </td>
              </tr>

              {/* DÒNG 3: TỶ LỆ TỪNG LOẠI (%) */}
              <tr className="hover:bg-[#f1f8e9]">
                <td className="text-left font-sans font-medium px-2 py-1 border-r border-[#c8e2bd] text-slate-700">
                  Tỷ lệ từng loại (%)
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">
                  {formatNumber((totals.proteinAnimalG / (normProteinAnimal || 1)) * 100, 2)}
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">
                  {formatNumber((totals.proteinPlantG / (normProteinPlant || 1)) * 100, 2)}
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">
                  {formatNumber((totals.fatAnimalG / (normFatAnimal || 1)) * 100, 2)}
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">
                  {formatNumber((totals.fatPlantG / (normFatPlant || 1)) * 100, 2)}
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">
                  {formatNumber(carbsAchievedPct, 2)}
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd]">
                  {formatNumber((totals.totalCalo / normCaloMin) * 100, 2)}
                </td>
              </tr>

              {/* DÒNG 4: ĐỘNG VẬT - THỰC VẬT (%) */}
              <tr className="bg-[#fafdfa]">
                <td className="text-left font-sans font-medium px-2 py-1 border-r border-[#c8e2bd] text-slate-700">
                  Động vật - Thực vật (%)
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd] font-bold text-rose-700">
                  {formatNumber(totals.animalProteinRatio, 2)}
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd] font-bold text-emerald-700">
                  {formatNumber(100 - totals.animalProteinRatio, 2)}
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd] font-bold text-amber-700">
                  {formatNumber(100 - totals.plantFatRatio, 2)}
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd] font-bold text-emerald-700">
                  {formatNumber(totals.plantFatRatio, 2)}
                </td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd] text-slate-400">-</td>
                <td className="px-1.5 py-0.5 border-r border-[#c8e2bd] text-slate-400">-</td>
              </tr>

              {/* DÒNG 5: TỶ LỆ ĐẠT (%) - MÀU VÀNG QLMN */}
              <tr className="bg-[#fff9c4] font-bold text-slate-900 border-t border-[#fbc02d]">
                <td className="text-left font-sans px-2 py-1 border-r border-[#fbc02d]">
                  Tỷ lệ đạt (%)
                </td>
                <td colSpan={2} className="border-r border-[#fbc02d] px-2 py-0.5 text-center">
                  {formatNumber(proteinAchievedPct, 2)}
                </td>
                <td colSpan={2} className="border-r border-[#fbc02d] px-2 py-0.5 text-center">
                  {formatNumber(fatAchievedPct, 2)}
                </td>
                <td className="border-r border-[#fbc02d] px-1.5 py-0.5">
                  {formatNumber(carbsAchievedPct, 2)}
                </td>
                <td className="border-r border-[#fbc02d] px-1.5 py-0.5 text-slate-400">-</td>
                <td className="px-2 py-0.5 text-slate-400">-</td>
              </tr>

              {/* DÒNG 6: CƠ CẤU ÁP DỤNG */}
              <tr className="bg-white text-slate-700">
                <td className="text-left font-sans font-medium px-2 py-1 border-r border-[#c8e2bd]">
                  Cơ cấu áp dụng
                </td>
                <td colSpan={2} className="border-r border-[#c8e2bd] px-2 py-0.5 font-bold text-rose-700">
                  {targetP}
                </td>
                <td colSpan={2} className="border-r border-[#c8e2bd] px-2 py-0.5 font-bold text-amber-700">
                  {targetL}
                </td>
                <td className="border-r border-[#c8e2bd] px-1.5 py-0.5 font-bold text-emerald-700">
                  {targetG}
                </td>
                <td className="border-r border-[#c8e2bd] px-1.5 py-0.5 text-slate-400">-</td>
                <td className="px-2 py-0.5 text-slate-400">-</td>
              </tr>

              {/* DÒNG 7: TỶ LỆ P:L:G (%) - MÀU VÀNG QLMN */}
              <tr className="bg-[#fff9c4] font-bold text-slate-900 border-t border-[#fbc02d]">
                <td className="text-left font-sans px-2 py-1 border-r border-[#fbc02d]">
                  Tỷ lệ P:L:G (%)
                </td>
                <td colSpan={2} className="border-r border-[#fbc02d] px-2 py-0.5 text-rose-800">
                  {formatNumber(totals.proteinPct, 1)}
                </td>
                <td colSpan={2} className="border-r border-[#fbc02d] px-2 py-0.5 text-amber-800">
                  {formatNumber(totals.fatPct, 1)}
                </td>
                <td className="border-r border-[#fbc02d] px-1.5 py-0.5 text-emerald-800">
                  {formatNumber(totals.carbsPct, 1)}
                </td>
                <td className="border-r border-[#fbc02d] px-1.5 py-0.5 text-slate-400">-</td>
                <td className="px-2 py-0.5 text-slate-400">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* KHỐI PHẢI: BẢNG ĐÁNH GIÁ TỈ LỆ CALO TỪNG BỮA */}
        <div className="w-full lg:w-80 shrink-0 border-l border-[#c8e2bd] pl-3">
          <div className="font-bold text-xs text-[#2e7d32] uppercase mb-1">
            ĐÁNH GIÁ TỈ LỆ CALO TỪNG BỮA
          </div>

          <table className="w-full text-center border-collapse border border-[#c8e2bd] text-[11px] bg-white">
            <thead>
              <tr className="bg-[#e8f5e9] text-slate-800 font-bold border-b border-[#c8e2bd]">
                <th className="border-r border-[#c8e2bd] px-2 py-1 text-left">Bữa ăn</th>
                <th className="border-r border-[#c8e2bd] px-1.5 py-1">Tỉ lệ đạt (%)</th>
                <th className="border-r border-[#c8e2bd] px-1.5 py-1">Định mức (%)</th>
                <th className="px-1.5 py-1">Tỉ lệ kCal (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0f0dc] font-mono">
              {mealCaloEvals.map((m) => {
                const isUnder = m.actualPct < m.standardMinPct;
                const isOver = m.actualPct > m.standardMaxPct;

                return (
                  <tr key={m.session} className="hover:bg-[#f1f8e9]">
                    <td className="text-left font-sans font-medium px-2 py-1 border-r border-[#c8e2bd] flex items-center justify-between">
                      <span>{m.sessionLabel}</span>
                      <Info className="w-3 h-3 text-amber-500" />
                    </td>
                    <td
                      className={`px-1.5 py-1 border-r border-[#c8e2bd] font-bold ${
                        m.calo === 0
                          ? 'text-slate-400'
                          : isUnder
                          ? 'text-[#d32f2f]'
                          : isOver
                          ? 'text-[#2e7d32]'
                          : 'text-slate-800'
                      }`}
                    >
                      {m.actualPct > 0 ? formatNumber(m.actualPct, 2) : 0}
                    </td>
                    <td className="px-1.5 py-1 border-r border-[#c8e2bd] text-slate-600 font-sans">
                      {m.standardMinPct} - {m.standardMaxPct}
                    </td>
                    <td className="px-1.5 py-1 font-bold text-indigo-700">
                      {m.caloSharePct > 0 ? formatNumber(m.caloSharePct, 2) : 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* CHÚ THÍCH ĐÈN ĐÁNH GIÁ */}
          <div className="flex items-center gap-4 text-[10px] text-slate-600 mt-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#d32f2f] rounded-xs inline-block" /> Chưa đạt
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#2e7d32] rounded-xs inline-block" /> Vượt quá định mức
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
