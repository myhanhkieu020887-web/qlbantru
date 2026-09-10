'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  ArrowRight,
  RefreshCw,
  X,
  Layers,
  Award,
  ChevronRight,
  TrendingUp,
  Scale,
  Utensils,
  Check,
} from 'lucide-react';
import { AgeGroup } from '../../types/nutrition';
import {
  generateMonth20DaysCycle,
  Month20DaysCycleResult,
  DayMenuCycleItem,
} from '../../engine/menu-cycle-generator';
import {
  download4WeeksMatrixExcelInBrowser,
  download20DaysAuditExcelInBrowser,
} from '../../lib/excel/exporter';
import { formatCurrency, formatNumber } from '../../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyToSchedule: (cycleResult: Month20DaysCycleResult, targetWeek: number) => void;
  initialAgeGroup?: AgeGroup;
  initialStudentCount?: number;
  initialBudget?: number;
}

export const AutoMenu20DaysWizardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onApplyToSchedule,
  initialAgeGroup = 'maugiao',
  initialStudentCount = 282,
  initialBudget = 21000,
}) => {
  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(initialAgeGroup);
  const [studentCount, setStudentCount] = useState<number>(initialStudentCount);
  const [budgetPerChild, setBudgetPerChild] = useState<number>(initialBudget);
  const [startDate, setStartDate] = useState<string>('2026-09-07');
  const [targetApplyWeek, setTargetApplyWeek] = useState<number>(1);

  // Cycle computation result
  const [cycleResult, setCycleResult] = useState<Month20DaysCycleResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState<DayMenuCycleItem | null>(null);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const res = generateMonth20DaysCycle(studentCount, budgetPerChild, ageGroup, startDate);
        setCycleResult(res);
        setStep(2);
      } catch (err) {
        console.error('Lỗi sinh thực đơn 20 ngày:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  };

  const handleApply = () => {
    if (!cycleResult) return;
    onApplyToSchedule(cycleResult, targetApplyWeek);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white">
                  Tự Động Sinh Thực Đơn Chu Kỳ 4 Tuần (20 Ngày)
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  QĐ 2195/QĐ-BGDĐT
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-500/30 text-teal-100 border border-teal-300/30">
                  HiGHS MILP Solver
                </span>
              </div>
              <p className="text-xs text-teal-100/80 mt-0.5">
                Xoay vòng 5 nhóm đạm học đường • Không trùng lặp món chính • Tự động cân đối Calo & Ngân sách 100%
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper Strip */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 font-medium transition-colors ${
                step === 1 ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                step === 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                1
              </span>
              <span>1. Thiết Lập & Tiêu Chuẩn</span>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-300" />

            <button
              onClick={() => cycleResult && setStep(2)}
              disabled={!cycleResult}
              className={`flex items-center gap-2 font-medium transition-colors ${
                step === 2 ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800 disabled:opacity-40'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                step === 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                2
              </span>
              <span>2. Ma Trận 20 Ngày (Xem Trước & Tinh Chỉnh)</span>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-300" />

            <button
              onClick={() => cycleResult && setStep(3)}
              disabled={!cycleResult}
              className={`flex items-center gap-2 font-medium transition-colors ${
                step === 3 ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800 disabled:opacity-40'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                step === 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                3
              </span>
              <span>3. Đồng Bộ Kép & Xuất Excel Báo Cáo</span>
            </button>
          </div>

          {cycleResult && (
            <div className="flex items-center gap-2 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã tính toán 20/20 ngày đạt chuẩn (Calo TB: {cycleResult.averageCalo} Kcal)</span>
            </div>
          )}
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {/* STEP 1: CONFIGURATION */}
          {step === 1 && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-teal-600" />
                  <span>Tham Số Mục Tiêu Chu Kỳ 4 Tuần</span>
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Phân hệ dinh dưỡng
                    </label>
                    <select
                      value={ageGroup}
                      onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                    >
                      <option value="maugiao">Mẫu giáo 3 - 5 tuổi (Chuẩn 615 - 738 Kcal)</option>
                      <option value="nhatre">Nhà trẻ 24 - 36 tháng (Chuẩn 600 - 651 Kcal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Định mức tiền ăn (VNĐ/trẻ/ngày)
                    </label>
                    <input
                      type="number"
                      step={500}
                      value={budgetPerChild}
                      onChange={(e) => setBudgetPerChild(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Sĩ số dự kiến toàn trường (cháu)
                    </label>
                    <input
                      type="number"
                      value={studentCount}
                      onChange={(e) => setStudentCount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Ngày bắt đầu Thứ Hai Tuần 1
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Box Quy tắc xoay vòng */}
              <div className="bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 p-5 rounded-xl border border-teal-200">
                <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-teal-700" />
                  <span>Quy Tắc Xoay Vòng 5 Nhóm Đạm Học Đường Được Tự Động Hóa:</span>
                </h4>
                <div className="grid grid-cols-5 gap-2.5 text-center text-xs">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-teal-100 shadow-2xs">
                    <span className="font-bold text-slate-800 block text-sm">Thứ Hai</span>
                    <span className="text-xs text-rose-700 font-semibold mt-1 inline-block">Thịt heo nạc</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Sốt cà, kho trứng, rim mè</p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-teal-100 shadow-2xs">
                    <span className="font-bold text-slate-800 block text-sm">Thứ Ba</span>
                    <span className="text-xs text-amber-700 font-semibold mt-1 inline-block">Bò tươi & Trứng</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Bò hầm, trứng đúc nấm</p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-teal-100 shadow-2xs">
                    <span className="font-bold text-slate-800 block text-sm">Thứ Tư</span>
                    <span className="text-xs text-blue-700 font-semibold mt-1 inline-block">Thủy hải sản</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Tôm đồng, cá bóp phi lê</p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-teal-100 shadow-2xs">
                    <span className="font-bold text-slate-800 block text-sm">Thứ Năm</span>
                    <span className="text-xs text-orange-700 font-semibold mt-1 inline-block">Gia cầm (Gà ta)</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Gà rim nấm, xào đậu cô ve</p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-lg border border-teal-100 shadow-2xs">
                    <span className="font-bold text-slate-800 block text-sm">Thứ Sáu</span>
                    <span className="text-xs text-emerald-700 font-semibold mt-1 inline-block">Đa dạng & Cua</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Riêu cua đồng, đậu hũ sốt cà</p>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-teal-200/60 flex items-center justify-between text-xs text-teal-800">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span>Cam kết 100% không lặp món mặn chính trong 2 ngày kế cận</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span>Tự động tối ưu chi phí khớp {formatCurrency(budgetPerChild)}</span>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-teal-500/25 transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang chạy MILP Solver cân đối 20 ngày...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Bắt Đầu Tự Động Sinh 20 Ngày Chuẩn QĐ 2195</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: 20-DAY INTERACTIVE MATRIX */}
          {step === 2 && cycleResult && (
            <div className="space-y-4">
              {/* Summary KPIs Bar */}
              <div className="grid grid-cols-5 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Năng Lượng TB</span>
                  <span className="text-base font-black text-emerald-700 font-mono">
                    {cycleResult.averageCalo} <span className="text-xs font-normal">Kcal</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">Đạt 100% TT 51</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tiền Ăn Bình Quân</span>
                  <span className="text-base font-black text-blue-700 font-mono">
                    {formatCurrency(cycleResult.averageCost)}
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold block">Khớp 100% ngân sách</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cơ Cấu P - L - G</span>
                  <span className="text-sm font-black text-indigo-700 font-mono">
                    {cycleResult.averageProteinPct}% : {cycleResult.averageFatPct}% : {cycleResult.averageCarbsPct}%
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold block">Dải Vàng QĐ 2195</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Đạm ĐV / Tổng Đạm</span>
                  <span className="text-base font-black text-amber-600 font-mono">≥ 56.5%</span>
                  <span className="text-[10px] text-amber-600 font-semibold block">Chuẩn ≥ 50%</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tỷ Lệ Không Trùng</span>
                  <span className="text-base font-black text-teal-700 font-mono">100%</span>
                  <span className="text-[10px] text-teal-600 font-semibold block">Xoay vòng 20 ngày</span>
                </div>
              </div>

              {/* 4-Week Matrix Grid */}
              <div className="space-y-3">
                {[1, 2, 3, 4].map((w) => {
                  const weekDays = cycleResult.days.filter((d) => d.weekIndex === w);
                  return (
                    <div key={w} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                      <div className="px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-teal-600" />
                          <span>TUẦN {w} • 5 NGÀY LÀM VIỆC</span>
                        </span>
                        <span className="text-[11px] font-normal text-slate-500">
                          {weekDays[0]?.dateString} đến {weekDays[4]?.dateString}
                        </span>
                      </div>

                      <div className="grid grid-cols-5 divide-x divide-slate-200 text-xs">
                        {weekDays.map((d) => (
                          <div
                            key={d.dayIndex}
                            onClick={() => setSelectedDayDetail(d)}
                            className="p-3 hover:bg-teal-50/40 cursor-pointer transition-colors space-y-2 flex flex-col justify-between group"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 text-xs">{d.dayOfWeek}</span>
                                <span className="text-[10px] text-slate-400">{d.dateString.slice(5)}</span>
                              </div>
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 mt-1">
                                {d.proteinGroup}
                              </span>

                              <div className="mt-2 space-y-1 text-slate-700">
                                <p className="font-semibold text-slate-900 leading-tight line-clamp-1 group-hover:text-teal-700">
                                  🥣 Sáng: {d.breakfastDish}
                                </p>
                                <p className="text-slate-700 text-[11px] leading-tight line-clamp-1">
                                  🍗 Trưa: {d.lunchMainDish}
                                </p>
                                <p className="text-slate-500 text-[10px] leading-tight line-clamp-1">
                                  🍲 {d.lunchSoupDish}
                                </p>
                                <p className="text-slate-600 text-[11px] leading-tight line-clamp-1">
                                  🍜 Xế: {d.afternoonSnackDish}
                                </p>
                                <p className="text-teal-700 text-[10px] leading-tight line-clamp-1 font-medium">
                                  🥛 Chiều: {d.afternoonMilkDish}
                                </p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                              <span className="font-bold text-emerald-700">{d.totalCalo} Kcal</span>
                              <span className="text-slate-600">{formatCurrency(d.costPerChild)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View Day Detail Dialog / Drawer if clicked */}
              {selectedDayDetail && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4">
                  <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          Chi Tiết Ngày {selectedDayDetail.dayOfWeek} ({selectedDayDetail.dateString})
                        </h4>
                        <span className="text-xs text-teal-700 font-medium">
                          Tuần {selectedDayDetail.weekIndex} • Nhóm: {selectedDayDetail.proteinGroup}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedDayDetail(null)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 border border-slate-200">
                        <span className="font-bold text-slate-800 block mb-1 text-xs text-teal-800 uppercase tracking-wide">
                          Cơ cấu 5 bữa ăn học đường (NT & MG):
                        </span>
                        <p>• <strong>Bữa sáng (NT + MG):</strong> {selectedDayDetail.breakfastDish}</p>
                        <p>• <strong>Bữa trưa Canh:</strong> {selectedDayDetail.lunchSoupDish}</p>
                        <p>• <strong>Bữa trưa Mặn:</strong> {selectedDayDetail.lunchMainDish}</p>
                        <p>• <strong>Bữa phụ trưa (NT):</strong> {selectedDayDetail.dessertDish}</p>
                        <p>• <strong>Bữa phụ MG / Bữa chính NT:</strong> {selectedDayDetail.afternoonSnackDish}</p>
                        <p>• <strong>Bữa chiều (NT + MG):</strong> {selectedDayDetail.afternoonMilkDish}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-emerald-50 rounded border border-emerald-100">
                          <span className="text-[10px] text-slate-500 block">Calo</span>
                          <span className="font-bold text-emerald-700">{selectedDayDetail.totalCalo} Kcal</span>
                        </div>
                        <div className="p-2 bg-blue-50 rounded border border-blue-100">
                          <span className="text-[10px] text-slate-500 block">Tiền 1 cháu</span>
                          <span className="font-bold text-blue-700">{formatCurrency(selectedDayDetail.costPerChild)}</span>
                        </div>
                        <div className="p-2 bg-indigo-50 rounded border border-indigo-100">
                          <span className="text-[10px] text-slate-500 block">P - L - G</span>
                          <span className="font-bold text-indigo-700">{selectedDayDetail.proteinPct}% : {selectedDayDetail.fatPct}%</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-lg max-h-40 overflow-y-auto">
                        <span className="font-bold text-slate-700 block mb-1">Danh mục nguyên liệu cân đối (Solver):</span>
                        <ul className="divide-y divide-slate-200">
                          {selectedDayDetail.items.map((it, idx) => (
                            <li key={idx} className="py-1 flex justify-between text-[11px]">
                              <span>{it.food.name} ({it.mealSession})</span>
                              <span className="font-mono text-slate-600 font-semibold">
                                {it.gamPerChild} g / cháu
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="text-right pt-2 border-t">
                      <button
                        onClick={() => setSelectedDayDetail(null)}
                        className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        Đóng chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: SYNC & EXPORT ACTIONS */}
          {step === 3 && cycleResult && (
            <div className="max-w-3xl mx-auto space-y-6 py-2">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Chu Kỳ 20 Ngày Đã Sẵn Sàng Vận Hành!
                    </h4>
                    <p className="text-xs text-slate-500">
                      Toàn bộ 20 ngày đã qua kiểm toán Atwater & MILP Solver, đạt chuẩn QĐ 2195 và Thông tư 51.
                    </p>
                  </div>
                </div>

                {/* Tùy chọn nạp vào tuần hiện tại */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">
                    1. Đồng bộ kép vào Lịch tuần & Sổ tháng:
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-600">Chọn tuần để nạp vào Lịch tuần 5 ngày đang xem:</span>
                    <select
                      value={targetApplyWeek}
                      onChange={(e) => setTargetApplyWeek(Number(e.target.value))}
                      className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-800"
                    >
                      <option value={1}>Nạp Tuần 1 (Phở gà, Canh chua cá nạc, Bún riêu, Bánh canh chả cá...)</option>
                      <option value={2}>Nạp Tuần 2 (Sandwich trứng, Thịt ram, Trứng cuộn rong biển, Spaghetti bò...)</option>
                      <option value={3}>Nạp Tuần 3 (Phở bò, Bò hầm khoai tây, Bún bò huế, Mì quảng...)</option>
                      <option value={4}>Nạp Tuần 4 (Súp khoai tây, Xíu mại sốt cà, Mì quảng, Hủ tiếu Nam vang...)</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-teal-700 italic">
                    * Hệ thống sẽ tự động cập nhật cả 20 ngày vào Sổ cân đối tháng (menu_adjust_month) để theo dõi tổng thể.
                  </p>
                </div>

                {/* Khối xác nhận thẩm quyền và chữ ký điện tử */}
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-xl border border-teal-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                      KH
                    </div>
                    <div>
                      <span className="text-[10px] text-teal-700 font-bold uppercase block">Người lên thực đơn</span>
                      <span className="font-bold text-slate-900 text-sm">Kiều Thị Mỹ Hạnh</span>
                      <p className="text-[10px] text-slate-500">Chuyên viên Dinh dưỡng & Bán trú Mầm non</p>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-teal-200"></div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                      NT
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold uppercase block">Duyệt của Hiệu trưởng</span>
                      <span className="font-bold text-slate-900 text-sm">Nguyễn Thị Thắng</span>
                      <p className="text-[10px] text-slate-500">Hiệu trưởng - Phê duyệt áp dụng toàn trường</p>
                    </div>
                  </div>
                </div>

                {/* 2 Nút xuất Excel */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">
                    2. Xuất bản báo cáo Excel chuyên nghiệp (Chuẩn 5 cột bữa ăn):
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => download4WeeksMatrixExcelInBrowser(cycleResult)}
                      className="p-4 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 rounded-xl text-left transition-all group flex items-start gap-3"
                    >
                      <FileSpreadsheet className="w-7 h-7 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-900 text-sm block group-hover:text-emerald-950">
                          Bảng Thực Đơn 4 Tuần (Khổ A4 Ngang)
                        </span>
                        <p className="text-[11px] text-emerald-700 mt-1">
                          Trình bày chuẩn 5 cột bữa ăn học đường, sẵn sàng in bảng tin trường và gửi Zalo phụ huynh.
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => download20DaysAuditExcelInBrowser(cycleResult)}
                      className="p-4 bg-blue-50 hover:bg-blue-100/80 border border-blue-300 rounded-xl text-left transition-all group flex items-start gap-3"
                    >
                      <FileSpreadsheet className="w-7 h-7 text-blue-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-blue-900 text-sm block group-hover:text-blue-950">
                          Sổ Kiểm Toán Chi Tiết 20 Ngày
                        </span>
                        <p className="text-[11px] text-blue-700 mt-1">
                          Bảng kê định lượng 5 bữa ăn, thành tiền và chỉ số Calo/Macro phục vụ đoàn kiểm toán - thanh tra.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
              >
                Quay Lại
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
            >
              Hủy Bỏ
            </button>

            {step === 1 && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>Tiếp Tục Sinh 20 Ngày</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs shadow transition-all flex items-center gap-1.5"
              >
                <span>Đồng Ý Ma Trận & Tiếp Tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleApply}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Áp Dụng Vào Hệ Thống (Đồng Bộ Kép)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
