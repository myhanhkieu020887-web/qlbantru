'use client';

import React from 'react';
import { ComputedMenuItem, MealSession, NutritionTotals } from '../../types/nutrition';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { Lock, Unlock, Trash2, AlertCircle } from 'lucide-react';

interface Props {
  items: ComputedMenuItem[];
  totals: NutritionTotals;
  isLocked?: boolean;
  canEditNutrients?: boolean;
  onUpdateGam: (itemId: string, newGam: number) => void;
  onToggleFixed: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
}

const SESSION_LABELS: Record<MealSession, { label: string; color: string }> = {
  sang: { label: 'Ăn sáng', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  chinh_trua: { label: 'Bữa trưa', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  phu_trua: { label: 'Phụ trưa', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  xe: { label: 'Bữa xế', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  phu_xe: { label: 'Phụ xế', color: 'bg-rose-100 text-rose-900 border-rose-300' },
};

export const NutritionGrid: React.FC<Props> = ({
  items,
  totals,
  isLocked = false,
  canEditNutrients = true,
  onUpdateGam,
  onToggleFixed,
  onRemoveItem,
}) => {
  const isInputDisabled = isLocked || !canEditNutrients;
  return (
    <div className="flex-1 overflow-auto bg-white">
      <table className="w-full border-collapse text-xs text-left">
        <thead className="sticky top-0 bg-[#e8eef8] text-gray-800 z-10 shadow-sm border-b border-gray-300 font-bold">
          <tr>
            <th className="py-2 px-2 text-center border-r border-gray-300 w-10">STT</th>
            <th className="py-2 px-2 border-r border-gray-300 w-24 text-center">Bữa ăn</th>
            <th className="py-2 px-3 border-r border-gray-300 min-w-[180px]">Tên thực phẩm</th>
            <th className="py-2 px-2 border-r border-gray-300 w-16 text-center">ĐVT</th>
            <th className="py-2 px-2 border-r border-gray-300 w-24 text-right bg-blue-100/70 text-blue-950 font-black">
              Lượng 1 trẻ (g)
            </th>
            <th className="py-2 px-2 border-r border-gray-300 w-24 text-right">Thực ăn (kg)</th>
            <th className="py-2 px-2 border-r border-gray-300 w-16 text-right">Thải bỏ (%)</th>
            <th className="py-2 px-2 border-r border-gray-300 w-24 text-right">Thực mua (kg)</th>
            <th className="py-2 px-2 border-r border-gray-300 w-24 text-right">Đơn giá (đ)</th>
            <th className="py-2 px-2 border-r border-gray-300 w-28 text-right bg-amber-50 text-amber-950 font-black">
              Thành tiền (đ)
            </th>
            <th className="py-2 px-2 border-r border-gray-300 w-20 text-right text-rose-700">Đạm P (g)</th>
            <th className="py-2 px-2 border-r border-gray-300 w-20 text-right text-amber-700">Béo L (g)</th>
            <th className="py-2 px-2 border-r border-gray-300 w-20 text-right text-emerald-700">Đường G (g)</th>
            <th className="py-2 px-2 border-r border-gray-300 w-20 text-right bg-orange-50 text-orange-950 font-black">
              Calo (Kcal)
            </th>
            <th className="py-2 px-2 text-center w-16">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((it, index) => {
            const isFixed = it.isFixed || it.food.isFixed;
            const session = SESSION_LABELS[it.mealSession] || {
              label: 'Bữa trưa',
              color: 'bg-gray-100 text-gray-800 border-gray-300',
            };

            return (
              <tr
                key={it.id}
                className={`hover:bg-blue-50/50 transition-colors ${
                  index % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'
                }`}
              >
                {/* STT */}
                <td className="py-1 px-2 text-center border-r border-gray-200 font-mono text-gray-500">
                  {index + 1}
                </td>

                {/* Bữa ăn badge */}
                <td className="py-1 px-2 text-center border-r border-gray-200">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${session.color}`}>
                    {session.label}
                  </span>
                </td>

                {/* Tên thực phẩm */}
                <td className="py-1 px-3 border-r border-gray-200 font-medium text-gray-900">
                  <div className="flex items-center justify-between">
                    <span>{it.food.name}</span>
                    {it.food.allergens && it.food.allergens.length > 0 && (
                      <span
                        className="text-[9px] px-1 bg-red-100 text-red-800 rounded font-bold border border-red-200 ml-1"
                        title={`Có chất dị ứng: ${it.food.allergens.join(', ')}`}
                      >
                        Codex
                      </span>
                    )}
                  </div>
                </td>

                {/* ĐVT */}
                <td className="py-1 px-2 text-center border-r border-gray-200 text-gray-600 font-mono">
                  {it.food.unit}
                </td>

                {/* Lượng gam 1 trẻ (Có thể nhập và sửa trực tiếp nếu chưa khóa và có quyền) */}
                <td className="py-0.5 px-1 border-r border-gray-200 text-right bg-blue-50/30">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    disabled={isInputDisabled}
                    value={it.gamPerChild}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateGam(it.id, isNaN(val) ? 0 : val);
                    }}
                    className={`w-full text-right font-mono font-bold px-1.5 py-1 rounded focus:outline-none ${
                      isInputDisabled
                        ? 'bg-transparent text-gray-500 cursor-not-allowed'
                        : 'text-blue-900 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                  />
                </td>

                {/* Thực ăn (kg) */}
                <td className="py-1 px-2 text-right border-r border-gray-200 font-mono text-gray-700">
                  {formatNumber(it.actualEatKg, 3)}
                </td>

                {/* Hệ số thải bỏ (%) */}
                <td className="py-1 px-2 text-right border-r border-gray-200 font-mono text-gray-500">
                  {it.food.wasteFactor > 0 ? `${it.food.wasteFactor}%` : '0'}
                </td>

                {/* Thực mua (kg) */}
                <td className="py-1 px-2 text-right border-r border-gray-200 font-mono font-semibold text-gray-800">
                  {formatNumber(it.actualBuyKg, 3)}
                </td>

                {/* Đơn giá (đ) */}
                <td className="py-1 px-2 text-right border-r border-gray-200 font-mono text-gray-600">
                  {it.food.price.toLocaleString('vi-VN')}
                </td>

                {/* Thành tiền (đ) */}
                <td className="py-1 px-2 text-right border-r border-gray-200 font-mono font-bold text-gray-900 bg-amber-50/30">
                  {Math.round(it.totalPrice).toLocaleString('vi-VN')}
                </td>

                {/* Đạm P */}
                <td className="py-1 px-2 text-right border-r border-gray-200 font-mono text-rose-700">
                  {formatNumber(it.proteinAnimal + it.proteinPlant, 2)}
                </td>

                {/* Béo L */}
                <td className="py-1 px-2 text-right border-r border-gray-200 font-mono text-amber-700">
                  {formatNumber(it.fatAnimal + it.fatPlant, 2)}
                </td>

                {/* Đường G */}
                <td className="py-1 px-2 text-right border-r border-gray-200 font-mono text-emerald-700">
                  {formatNumber(it.carbs, 2)}
                </td>

                {/* Calo Atwater */}
                <td className="py-1 px-2 text-right border-r border-gray-200 font-mono font-black text-orange-950 bg-orange-50/30">
                  {formatNumber(it.calo, 1)}
                </td>

                {/* Thao tác */}
                <td className="py-1 px-1 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onToggleFixed(it.id)}
                      disabled={isInputDisabled}
                      title={
                        isInputDisabled
                          ? 'Không có quyền sửa hoặc thực đơn đã khóa'
                          : isFixed
                          ? 'Đang khóa cố định (Không bị solver thay đổi)'
                          : 'Tự do (Solver có thể điều chỉnh)'
                      }
                      className={`p-1 rounded ${
                        isInputDisabled
                          ? 'text-gray-300 cursor-not-allowed'
                          : isFixed
                          ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {isFixed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onRemoveItem(it.id)}
                      disabled={isInputDisabled}
                      title={isInputDisabled ? 'Không có quyền sửa hoặc thực đơn đã khóa' : 'Xóa thực phẩm'}
                      className={`p-1 rounded ${
                        isInputDisabled
                          ? 'text-gray-200 cursor-not-allowed'
                          : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* TỔNG CỘNG FOOTER */}
        <tfoot className="sticky bottom-0 bg-[#eef2f7] text-gray-900 font-bold border-t-2 border-gray-400 shadow-inner">
          <tr>
            <td colSpan={4} className="py-2.5 px-3 text-right border-r border-gray-300 uppercase tracking-wider text-xs">
              TỔNG CỘNG ({items.length} MÓN)
            </td>
            <td className="py-2.5 px-2 text-right border-r border-gray-300 font-mono font-black text-blue-900 bg-blue-100">
              {formatNumber(items.reduce((acc, it) => acc + it.gamPerChild, 0), 1)} g
            </td>
            <td className="py-2.5 px-2 text-right border-r border-gray-300 font-mono">
              {formatNumber(items.reduce((acc, it) => acc + it.actualEatKg, 0), 2)} kg
            </td>
            <td className="py-2.5 px-2 border-r border-gray-300"></td>
            <td className="py-2.5 px-2 text-right border-r border-gray-300 font-mono">
              {formatNumber(items.reduce((acc, it) => acc + it.actualBuyKg, 0), 2)} kg
            </td>
            <td className="py-2.5 px-2 border-r border-gray-300"></td>
            <td className="py-2.5 px-2 text-right border-r border-gray-300 font-mono font-black text-sm text-gray-900 bg-amber-100">
              {Math.round(totals.totalCost).toLocaleString('vi-VN')} đ
            </td>
            <td className="py-2.5 px-2 text-right border-r border-gray-300 font-mono font-black text-rose-700">
              {formatNumber(totals.totalProteinG, 1)} g
            </td>
            <td className="py-2.5 px-2 text-right border-r border-gray-300 font-mono font-black text-amber-700">
              {formatNumber(totals.totalFatG, 1)} g
            </td>
            <td className="py-2.5 px-2 text-right border-r border-gray-300 font-mono font-black text-emerald-700">
              {formatNumber(totals.carbsG, 1)} g
            </td>
            <td className="py-2.5 px-2 text-right border-r border-gray-300 font-mono font-black text-orange-950 bg-orange-100 text-sm">
              {formatNumber(totals.totalCalo, 1)}
            </td>
            <td className="py-2.5 px-2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
