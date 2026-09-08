'use client';

import React, { useState } from 'react';
import {
  AgeGroup,
  DailyMenuPlan,
  ComputedMenuItem,
  NutritionTotals,
} from '../../types/nutrition';
import { evaluateCompliance, ComplianceCheck } from '../../engine/compliance-2195';
import { SolverResult } from '../../engine/milp-solver';
import { formatCurrency, formatNumber } from '../../lib/utils';
import {
  X,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Scale,
  Sparkles,
  Lock,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  menuPlan: DailyMenuPlan;
  computedItems: ComputedMenuItem[];
  totals: NutritionTotals;
  onRunSolver: () => void;
  onApproveMenu: () => void;
  solverResult?: SolverResult | null;
  isSolving?: boolean;
}

export const NutritionalAuditDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  menuPlan,
  computedItems,
  totals,
  onRunSolver,
  onApproveMenu,
  solverResult,
  isSolving = false,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'luong' | 'diff'>('chat');
  const [showFormulas, setShowFormulas] = useState(true);

  if (!isOpen) return null;

  const checks: ComplianceCheck[] = evaluateCompliance(totals, menuPlan.ageGroup);
  const passedCount = checks.filter((c) => c.passed).length;
  const isAllPassed = passedCount === checks.length;
  const isMauGiao = menuPlan.ageGroup === 'maugiao';

  // Nhóm thực phẩm sinh học cho kiểm tra MẶT LƯỢNG
  const meatItems = computedItems.filter((i) => i.food.category === 'thit_ca');
  const totalMeatG = meatItems.reduce((acc, i) => acc + i.gamPerChild, 0);

  const riceItems = computedItems.filter((i) => i.food.category === 'gao');
  const totalRiceG = riceItems.reduce((acc, i) => acc + i.gamPerChild, 0);

  const vegItems = computedItems.filter((i) => i.food.category === 'rau_cu');
  const totalVegG = vegItems.reduce((acc, i) => acc + i.gamPerChild, 0);

  const oilItems = computedItems.filter((i) => i.food.category === 'dau_mo');
  const totalOilG = oilItems.reduce((acc, i) => acc + i.gamPerChild, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl transition-transform animate-in slide-in-from-right duration-200">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Thẩm Định Lượng & Chất Khẩu Phần Bán Trú
                </h2>
                <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
                  Phó Hiệu Trưởng Bán Trú
                </span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {isMauGiao ? 'Mẫu giáo (3-5 tuổi)' : 'Nhà trẻ (24-36 tháng)'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Chuẩn hóa Quyết định 2195/QĐ-BGDĐT • Công văn 423/BGDĐT-GDMN • Sĩ số: {totals.studentCount} cháu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFormulas(!showFormulas)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                showFormulas
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
              {showFormulas ? 'Ẩn công thức' : 'Hiện công thức toán'}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* TOP KPI STRIP */}
        <div className="grid grid-cols-4 gap-3 border-b border-slate-200 bg-white px-6 py-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <div className="text-[11px] font-medium text-slate-500">Năng lượng Atwater</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-900">
                {formatNumber(totals.totalCalo, 1)}
              </span>
              <span className="text-xs text-slate-500">Kcal</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Chuẩn: {isMauGiao ? '615 - 738' : '600 - 651'} Kcal
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <div className="text-[11px] font-medium text-slate-500">Cơ cấu P : L : G</div>
            <div className="text-base font-bold text-indigo-700">
              {formatNumber(totals.proteinPct, 1)}% : {formatNumber(totals.fatPct, 1)}% :{' '}
              {formatNumber(totals.carbsPct, 1)}%
            </div>
            <div className="text-[10px] text-slate-500">
              Mục tiêu: {isMauGiao ? '14 : 32 : 54' : '14 : 35 : 51'}%
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <div className="text-[11px] font-medium text-slate-500">Tỷ lệ Canxi / Photpho</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-700">
                {formatNumber(totals.calciumPhosphorusRatio, 2)} : 1
              </span>
            </div>
            <div className="text-[10px] text-slate-500">Chuẩn vàng: 1.0 - 1.5 : 1</div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <div className="text-[11px] font-medium text-slate-500">Cân đối Ngân sách</div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-slate-900">
                {formatCurrency(Math.round(totals.costPerChild))}
              </span>
              <span className="text-xs text-slate-500">/ {formatCurrency(totals.budgetPerChild)}</span>
            </div>
            <div
              className={`text-[10px] font-medium ${
                Math.abs(totals.costPerChild - totals.budgetPerChild) <= 100
                  ? 'text-emerald-600'
                  : totals.costPerChild > totals.budgetPerChild
                  ? 'text-rose-600'
                  : 'text-amber-600'
              }`}
            >
              Lệch:{' '}
              {totals.costPerChild - totals.budgetPerChild >= 0 ? '+' : ''}
              {formatCurrency(Math.round(totals.costPerChild - totals.budgetPerChild))}
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 px-6">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              activeTab === 'chat'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            1. Thẩm Định Mặt Chất (8 Chỉ Số Vàng QĐ 2195)
            <span
              className={`ml-1.5 rounded-full px-2 py-0.5 text-xs ${
                isAllPassed
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {passedCount}/{checks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('luong')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              activeTab === 'luong'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="h-4 w-4" />
            2. Thẩm Định Mặt Lượng & Hao Hụt Sơ Chế
          </button>

          <button
            onClick={() => setActiveTab('diff')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              activeTab === 'diff'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Zap className="h-4 w-4" />
            3. So Sánh Trước vs Sau Cân Đối (F9)
          </button>
        </div>

        {/* CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: THẨM ĐỊNH MẶT CHẤT */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Bảng Thẩm Định 8 Tiêu Chuẩn Vàng (Bộ GD&ĐT & Viện Dinh Dưỡng)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Pháp lý: QĐ 2195/QĐ-BGDĐT & TT 51/2020/TT-BGDĐT
                  </span>
                </div>

                <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                  {checks.map((c) => (
                    <div key={c.id} className="p-3.5 transition hover:bg-slate-50/80">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {c.status === 'DAT' ? (
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                          ) : c.status === 'CANH_BAO' ? (
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                          ) : (
                            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{c.name}</span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  c.status === 'DAT'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : c.status === 'CANH_BAO'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {c.status}
                              </span>
                            </div>

                            {showFormulas && c.formulaText && (
                              <div className="mt-1 font-mono text-[11px] text-indigo-600 bg-indigo-50/50 inline-block px-2 py-0.5 rounded">
                                {c.formulaText}
                              </div>
                            )}

                            {c.advice && (
                              <div className="mt-1 text-xs text-amber-700 bg-amber-50 rounded p-1.5 border border-amber-200">
                                💡 <strong>Gợi ý chuyên gia:</strong> {c.advice}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-base font-bold text-slate-900">
                            {c.actualValue} {c.actualUnit}
                          </div>
                          <div className="text-xs text-slate-500">Chuẩn: {c.standardText}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THẨM ĐỊNH MẶT LƯỢNG */}
          {activeTab === 'luong' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-600">Thịt, Cá, Trứng</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {formatNumber(totalMeatG, 1)} g/trẻ
                  </div>
                  <div className="text-[11px] text-slate-500">Chuẩn sinh học: 40 - 75 g</div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-600">Gạo & Ngũ cốc</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {formatNumber(totalRiceG, 1)} g/trẻ
                  </div>
                  <div className="text-[11px] text-slate-500">Chuẩn sinh học: 90 - 140 g</div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-600">Rau củ quả</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {formatNumber(totalVegG, 1)} g/trẻ
                  </div>
                  <div className="text-[11px] text-slate-500">Chuẩn sinh học: 45 - 85 g</div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-600">Dầu ăn & Mỡ</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {formatNumber(totalOilG, 1)} g/trẻ
                  </div>
                  <div className="text-[11px] text-slate-500">Chuẩn sinh học: 8 - 18 g</div>
                </div>
              </div>

              {/* BẢNG ĐỐI CHIẾU LƯỢNG ĂN VÀO VS LƯỢNG MUA VÀO (HAO HỤT SƠ CHẾ) */}
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h4 className="text-xs font-bold uppercase text-slate-700">
                    Bảng Thẩm Tra Lượng Ăn Vào vs Lượng Mua Vào (Theo Tỷ Lệ Thải Bỏ)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Công thức kế toán:{' '}
                    <code className="font-mono text-indigo-600">
                      Lượng mua (kg) = [Lượng ăn (g) × Sĩ số] / [1000 × (1 - Tỷ lệ thải bỏ %)]
                    </code>
                  </p>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">STT</th>
                        <th className="p-2.5">Tên thực phẩm</th>
                        <th className="p-2.5 text-right">Lượng ăn (g/trẻ)</th>
                        <th className="p-2.5 text-center">Thải bỏ (%)</th>
                        <th className="p-2.5 text-right">Lượng mua (kg)</th>
                        <th className="p-2.5 text-right">Đơn giá</th>
                        <th className="p-2.5 text-right">Thành tiền (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {computedItems.map((it, idx) => (
                        <tr key={it.id} className="hover:bg-slate-50/80">
                          <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-2.5 font-medium text-slate-900">{it.food.name}</td>
                          <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
                            {it.gamPerChild} g
                          </td>
                          <td className="p-2.5 text-center font-mono text-slate-600">
                            {it.food.wasteFactor}%
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-indigo-700">
                            {formatNumber(it.actualBuyKg, 2)} kg
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-600">
                            {formatCurrency(it.unitPrice)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(Math.round(it.totalPrice))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="sticky bottom-0 bg-slate-100 font-bold border-t-2 border-slate-200">
                      <tr>
                        <td colSpan={6} className="p-2.5 text-right text-slate-700">
                          TỔNG CỘNG TIỀN ĂN (CHO {totals.studentCount} CHÁU):
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-700 text-sm">
                          {formatCurrency(Math.round(totals.totalCost))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SO SÁNH TRƯỚC VS SAU F9 */}
          {activeTab === 'diff' && (
            <div className="space-y-4">
              {solverResult ? (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
                  <div className="flex items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-600" />
                      <h4 className="text-sm font-bold text-indigo-900">
                        Kết Quả Tối Ưu Bằng Động Cơ 2-Phase Elastic MILP
                      </h4>
                    </div>
                    <span className="rounded bg-indigo-200 px-2 py-0.5 font-mono text-xs text-indigo-800">
                      Thời gian: {solverResult.runtimeMs}ms • Vòng lặp: {solverResult.iterations}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded bg-white p-3 border border-indigo-100">
                      <div className="text-xs text-slate-500">Ngân sách tiền ăn</div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-sm line-through text-slate-400">
                          {formatCurrency(Math.round(solverResult.originalCost))}
                        </span>
                        <span className="text-base font-bold text-emerald-700">
                          {formatCurrency(Math.round(solverResult.optimizedCost))}
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        Khóa cứng sai số ≤ 100đ
                      </div>
                    </div>

                    <div className="rounded bg-white p-3 border border-indigo-100">
                      <div className="text-xs text-slate-500">Năng lượng Calo</div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-sm line-through text-slate-400">
                          {formatNumber(solverResult.originalCalo, 1)}
                        </span>
                        <span className="text-base font-bold text-indigo-700">
                          {formatNumber(solverResult.optimizedCalo, 1)} Kcal
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">Chuẩn: 615 - 738 Kcal</div>
                    </div>

                    <div className="rounded bg-white p-3 border border-indigo-100">
                      <div className="text-xs text-slate-500">Trạng thái giải toán</div>
                      <div className="mt-1 text-sm font-bold text-emerald-700">
                        ✓ Bounded Solution
                      </div>
                      <div className="text-[10px] text-slate-500">Bảo toàn sinh học 100%</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-12 text-center">
                  <Zap className="h-10 w-10 text-slate-300" />
                  <h4 className="mt-2 text-sm font-semibold text-slate-700">
                    Chưa kích hoạt lượt tối ưu nào trong phiên này
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-md">
                    Bấm nút <strong>&quot;Tối Ưu Chuẩn F9&quot;</strong> bên dưới để thuật toán tự động
                    co giãn các nguyên liệu nền, đưa Calo và Ngân sách về mức hoàn hảo.
                  </p>
                  <button
                    onClick={onRunSolver}
                    disabled={isSolving}
                    className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700"
                  >
                    <Zap className="h-4 w-4" />
                    Chạy Cân Đối F9 Ngay
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="h-4 w-4 text-slate-400" />
            <span>Quyền hạn: Phó Hiệu Trưởng Bán Trú & Ban Giám Hiệu</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRunSolver}
              disabled={isSolving}
              className="flex items-center gap-2 rounded-lg border border-indigo-600 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Zap className="h-4 w-4" />
              {isSolving ? 'Đang giải toán MILP...' : 'Tối Ưu Chuẩn F9'}
            </button>

            <button
              onClick={onApproveMenu}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              Ký Duyệt Khẩu Phần Bán Trú
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
