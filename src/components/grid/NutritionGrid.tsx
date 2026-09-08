'use client';

import React, { useState } from 'react';
import { ComputedMenuItem, MealSession, NutritionTotals } from '../../types/nutrition';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { Lock, Unlock, Trash2, Layers, ListFilter, AlertCircle, ShoppingCart, Archive } from 'lucide-react';

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

// Định nghĩa màu sắc vạch trạng thái kho chuẩn QLMN
const INVENTORY_STATUS_CONFIG = {
  con_kho: { label: 'Còn kho', color: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  sap_het: { label: 'Sắp hết', color: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-300' },
  da_het: { label: 'Đã hết', color: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-300' },
  di_cho: { label: 'Đi chợ', color: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 border-purple-300' },
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
  const [groupByDish, setGroupByDish] = useState<boolean>(true);
  const isInputDisabled = isLocked || !canEditNutrients;

  // Lấy mã thực phẩm hiển thị dạng số hoặc code
  const getFoodCode = (it: ComputedMenuItem) => {
    // Nếu có mã số QLMN cụ thể trong foodId hoặc code
    const codeMap: Record<string, string> = {
      GAO_THOM: '48949',
      GAO_TE_MAY: '48949',
      THIT_HEO_NAC: '6364',
      THIT_BA_CHI: '49576',
      CA_NAC: '6364',
      BAU: '693',
      CHUOI_GIA: '845',
      CA_CHUA: '697',
      CA_ROT: '50720',
      DAU_MEIZAN: '6210',
      DAU_TUONG_AN: '6210',
      NUOC_MAM: '6021',
      NAM_BAO_NGU: '829',
      RAU_NGO: '791',
      RAU_TAN_O: '6001',
      SU_SU: '798',
      SUA_METACARE: '48912',
      TOM_DONG: '49238',
      DUONG_CAT: '1178',
    };
    return codeMap[it.food.code] || it.food.code.replace('food_', '');
  };

  // Gom nhóm theo dishName nếu bật chế độ Group
  const dishes: { name: string; session: MealSession; items: ComputedMenuItem[] }[] = [];
  if (groupByDish) {
    const dishMap = new Map<string, { name: string; session: MealSession; items: ComputedMenuItem[] }>();
    items.forEach((it) => {
      const dName = it.dishName || (it.mealSession === 'chinh_trua' ? 'Bữa trưa chính' : it.mealSession === 'xe' ? 'Món xế' : 'Món phụ');
      const key = `${it.mealSession}_${dName}`;
      if (!dishMap.has(key)) {
        dishMap.set(key, { name: dName, session: it.mealSession, items: [] });
      }
      dishMap.get(key)!.items.push(it);
    });
    dishes.push(...dishMap.values());
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* THANH ĐIỀU KHIỂN NHÓM VIEW */}
      <div className="h-8 px-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">Dữ liệu kế toán tiếp phẩm:</span>
          <button
            type="button"
            onClick={() => setGroupByDish(!groupByDish)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-all ${
              groupByDish
                ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>{groupByDish ? 'Đang nhóm theo Món ăn' : 'Hiển thị danh sách phẳng'}</span>
          </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
          <span>Tổng số dòng: <strong>{items.length}</strong> thực phẩm</span>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU CHÍNH (13 CỘT QLMN - COMPACT MODE) */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs text-left">
          <thead className="sticky top-0 bg-[#e8eef8] text-slate-800 z-10 shadow-xs border-b border-slate-300 font-bold text-[10.5px]">
            <tr>
              <th className="py-1 px-1 text-center border-r border-slate-300 w-8">STT</th>
              <th className="py-1 px-1 text-center border-r border-slate-300 w-13">Mã TP</th>
              <th className="py-1 px-2 border-r border-slate-300 min-w-[160px]">Tên thực phẩm</th>
              <th className="py-1 px-1.5 border-r border-slate-300 w-16 text-right bg-blue-100/70 text-blue-950 font-black">
                Lượng (g)
              </th>
              <th className="py-1 px-1.5 border-r border-slate-300 w-16 text-right">Ăn (kg)</th>
              <th className="py-1 px-1 text-center border-r border-slate-300 w-12">Thải %</th>
              <th className="py-1 px-1.5 border-r border-slate-300 w-16 text-right font-bold text-slate-900">Mua (kg)</th>
              <th className="py-1 px-1 text-center border-r border-slate-300 w-10">ĐVT</th>
              <th className="py-1 px-1 text-right border-r border-slate-300 w-13 font-mono text-slate-500 text-[10px]">Quy đổi</th>
              <th className="py-1 px-1.5 border-r border-slate-300 w-16 text-right">Đơn giá</th>
              <th className="py-1 px-1.5 border-r border-slate-300 w-20 text-right bg-amber-50 text-amber-950 font-black">
                Thành tiền (đ)
              </th>
              <th className="py-1 px-1 text-right border-r border-slate-300 w-12 text-rose-700">Đạm P</th>
              <th className="py-1 px-1 text-right border-r border-slate-300 w-12 text-amber-700">Béo L</th>
              <th className="py-1 px-1 text-right border-r border-slate-300 w-12 text-emerald-700">Đường G</th>
              <th className="py-1 px-1.5 border-r border-slate-300 w-13 text-right bg-orange-50 text-orange-950 font-black">
                Calo
              </th>
              <th className="py-1 px-0.5 text-center w-11">Khóa/Xóa</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {groupByDish ? (
              // HIỂN THỊ THEO NHÓM MÓN ĂN
              dishes.map((group, gIdx) => {
                const sessionInfo = SESSION_LABELS[group.session] || {
                  label: 'Bữa ăn',
                  color: 'bg-slate-100 text-slate-800 border-slate-300',
                };
                const groupCost = group.items.reduce((sum, it) => sum + it.totalPrice, 0);
                const groupCalo = group.items.reduce((sum, it) => sum + it.calo, 0);

                return (
                  <React.Fragment key={`dish_group_${gIdx}`}>
                    {/* Header Dòng Món Ăn */}
                    <tr className="bg-[#f2f7fc] border-t-2 border-b border-blue-200 font-bold text-slate-800">
                      <td colSpan={3} className="py-1.5 px-3 border-r border-slate-300">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] border ${sessionInfo.color}`}>
                            {sessionInfo.label}
                          </span>
                          <span className="text-blue-950 text-xs tracking-tight">🍲 {group.name}</span>
                          <span className="text-[10px] text-slate-500 font-normal">({group.items.length} nguyên liệu)</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-300 text-right font-mono text-blue-900 bg-blue-50/50">
                        {formatNumber(group.items.reduce((s, it) => s + it.gamPerChild, 0), 1)}g
                      </td>
                      <td className="py-1.5 px-2 border-r border-slate-300 text-right font-mono text-slate-700">
                        {formatNumber(group.items.reduce((s, it) => s + it.actualEatKg, 0), 2)}kg
                      </td>
                      <td className="py-1.5 px-1 border-r border-slate-300"></td>
                      <td className="py-1.5 px-2 border-r border-slate-300 text-right font-mono text-slate-800 font-bold">
                        {formatNumber(group.items.reduce((s, it) => s + it.actualBuyKg, 0), 2)}kg
                      </td>
                      <td colSpan={3} className="py-1.5 px-2 border-r border-slate-300"></td>
                      <td className="py-1.5 px-2 border-r border-slate-300 text-right font-mono font-bold text-slate-900 bg-amber-50">
                        {Math.round(groupCost).toLocaleString('vi-VN')}đ
                      </td>
                      <td colSpan={3} className="py-1.5 px-2 border-r border-slate-300"></td>
                      <td className="py-1.5 px-2 border-r border-slate-300 text-right font-mono font-bold text-orange-900 bg-orange-50">
                        {formatNumber(groupCalo, 1)}
                      </td>
                      <td className="py-1.5 px-1"></td>
                    </tr>

                    {/* Danh sách nguyên liệu trong món */}
                    {group.items.map((it, idx) => {
                      const isFixed = it.isFixed || it.food.isFixed;
                      const foodCode = getFoodCode(it);
                      const invStatus = it.food.inventoryStatus || 'con_kho';
                      const statusCfg = INVENTORY_STATUS_CONFIG[invStatus] || INVENTORY_STATUS_CONFIG.con_kho;

                      return (
                        <tr
                          key={it.id}
                          className={`hover:bg-blue-50/50 transition-colors ${
                            idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                          }`}
                        >
                          {/* STT */}
                          <td className="py-1 px-1 text-center border-r border-slate-200 font-mono text-slate-400 text-[11px]">
                            {idx + 1}
                          </td>

                          {/* Mã TP + Vạch trạng thái kho */}
                          <td className="py-1 px-1.5 text-center border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                className={`w-1.5 h-3.5 rounded-full shrink-0 ${statusCfg.color}`}
                                title={statusCfg.label}
                              />
                              <span className="font-mono text-slate-700 font-semibold text-[11px]">
                                {foodCode}
                              </span>
                            </div>
                          </td>

                          {/* Tên thực phẩm */}
                          <td className="py-1 px-3 border-r border-slate-200 font-medium text-slate-900 pl-6">
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

                          {/* Lượng ăn 1 trẻ (g) */}
                          <td className="py-0.5 px-1 border-r border-slate-200 text-right bg-blue-50/30">
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
                              className={`w-full text-right font-mono font-bold px-1.5 py-0.5 rounded focus:outline-none text-xs ${
                                isInputDisabled
                                  ? 'bg-transparent text-slate-500 cursor-not-allowed'
                                  : 'text-blue-900 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                              }`}
                            />
                          </td>

                          {/* Thực ăn (kg) */}
                          <td className="py-1 px-2 text-right border-r border-slate-200 font-mono text-slate-700">
                            {formatNumber(it.actualEatKg, 3)}
                          </td>

                          {/* Hệ số thải bỏ (%) */}
                          <td className="py-1 px-1 text-center border-r border-slate-200 font-mono text-slate-500 text-[11px]">
                            {it.food.wasteFactor > 0 ? `${it.food.wasteFactor}%` : '0'}
                          </td>

                          {/* Thực mua (kg) */}
                          <td className="py-1 px-2 text-right border-r border-slate-200 font-mono font-bold text-slate-800">
                            {formatNumber(it.actualBuyKg, 3)}
                          </td>

                          {/* ĐVT */}
                          <td className="py-1 px-2 text-center border-r border-slate-200 text-slate-600 font-mono">
                            {it.food.unit}
                          </td>

                          {/* Quy đổi gam */}
                          <td className="py-1 px-1.5 text-right border-r border-slate-200 font-mono text-slate-400 text-[10px]">
                            {it.food.gamExchange || 1000}g
                          </td>

                          {/* Đơn giá (đ) */}
                          <td className="py-1 px-2 text-right border-r border-slate-200 font-mono text-slate-600">
                            {it.food.price.toLocaleString('vi-VN')}
                          </td>

                          {/* Thành tiền (đ) */}
                          <td className="py-1 px-2 text-right border-r border-slate-200 font-mono font-bold text-slate-900 bg-amber-50/30">
                            {Math.round(it.totalPrice).toLocaleString('vi-VN')}
                          </td>

                          {/* Đạm P */}
                          <td className="py-1 px-2 text-right border-r border-slate-200 font-mono text-rose-700">
                            {formatNumber(it.proteinAnimal + it.proteinPlant, 2)}
                          </td>

                          {/* Béo L */}
                          <td className="py-1 px-2 text-right border-r border-slate-200 font-mono text-amber-700">
                            {formatNumber(it.fatAnimal + it.fatPlant, 2)}
                          </td>

                          {/* Đường G */}
                          <td className="py-1 px-2 text-right border-r border-slate-200 font-mono text-emerald-700">
                            {formatNumber(it.carbs, 2)}
                          </td>

                          {/* Calo Atwater */}
                          <td className="py-1 px-2 text-right border-r border-slate-200 font-mono font-bold text-orange-950 bg-orange-50/30">
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
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : isFixed
                                    ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                                    : 'text-slate-400 hover:text-slate-600'
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
                                    ? 'text-slate-200 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            ) : (
              // HIỂN THỊ DẠNG PHẲNG (FLAT VIEW)
              items.map((it, index) => {
                const isFixed = it.isFixed || it.food.isFixed;
                const foodCode = getFoodCode(it);
                const invStatus = it.food.inventoryStatus || 'con_kho';
                const statusCfg = INVENTORY_STATUS_CONFIG[invStatus] || INVENTORY_STATUS_CONFIG.con_kho;

                return (
                  <tr
                    key={it.id}
                    className={`hover:bg-blue-50/50 transition-colors ${
                      index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                    }`}
                  >
                    <td className="py-1 px-1 text-center border-r border-slate-200 font-mono text-slate-400 text-[11px]">
                      {index + 1}
                    </td>

                    <td className="py-1 px-1.5 text-center border-r border-slate-200">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`w-1.5 h-3.5 rounded-full shrink-0 ${statusCfg.color}`} title={statusCfg.label} />
                        <span className="font-mono text-slate-700 font-semibold text-[11px]">{foodCode}</span>
                      </div>
                    </td>

                    <td className="py-1 px-3 border-r border-slate-200 font-medium text-slate-900">
                      <div className="flex items-center justify-between">
                        <span>{it.food.name}</span>
                        {it.dishName && (
                          <span className="text-[10px] text-slate-400 font-normal ml-2">({it.dishName})</span>
                        )}
                      </div>
                    </td>

                    <td className="py-0.5 px-1 border-r border-slate-200 text-right bg-blue-50/30">
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
                        className={`w-full text-right font-mono font-bold px-1.5 py-0.5 rounded focus:outline-none text-xs ${
                          isInputDisabled
                            ? 'bg-transparent text-slate-500 cursor-not-allowed'
                            : 'text-blue-900 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        }`}
                      />
                    </td>

                    <td className="py-1 px-2 text-right border-r border-slate-200 font-mono text-slate-700">
                      {formatNumber(it.actualEatKg, 3)}
                    </td>

                    <td className="py-1 px-1 text-center border-r border-slate-200 font-mono text-slate-500 text-[11px]">
                      {it.food.wasteFactor > 0 ? `${it.food.wasteFactor}%` : '0'}
                    </td>

                    <td className="py-1 px-2 text-right border-r border-slate-200 font-mono font-bold text-slate-800">
                      {formatNumber(it.actualBuyKg, 3)}
                    </td>

                    <td className="py-1 px-2 text-center border-r border-slate-200 text-slate-600 font-mono">
                      {it.food.unit}
                    </td>

                    <td className="py-1 px-1.5 text-right border-r border-slate-200 font-mono text-slate-400 text-[10px]">
                      {it.food.gamExchange || 1000}g
                    </td>

                    <td className="py-1 px-2 text-right border-r border-slate-200 font-mono text-slate-600">
                      {it.food.price.toLocaleString('vi-VN')}
                    </td>

                    <td className="py-1 px-2 text-right border-r border-slate-200 font-mono font-bold text-slate-900 bg-amber-50/30">
                      {Math.round(it.totalPrice).toLocaleString('vi-VN')}
                    </td>

                    <td className="py-1 px-2 text-right border-r border-slate-200 font-mono text-rose-700">
                      {formatNumber(it.proteinAnimal + it.proteinPlant, 2)}
                    </td>

                    <td className="py-1 px-2 text-right border-r border-slate-200 font-mono text-amber-700">
                      {formatNumber(it.fatAnimal + it.fatPlant, 2)}
                    </td>

                    <td className="py-1 px-2 text-right border-r border-slate-200 font-mono text-emerald-700">
                      {formatNumber(it.carbs, 2)}
                    </td>

                    <td className="py-1 px-2 text-right border-r border-slate-200 font-mono font-bold text-orange-950 bg-orange-50/30">
                      {formatNumber(it.calo, 1)}
                    </td>

                    <td className="py-1 px-1 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onToggleFixed(it.id)}
                          disabled={isInputDisabled}
                          className={`p-1 rounded ${
                            isInputDisabled
                              ? 'text-slate-300 cursor-not-allowed'
                              : isFixed
                              ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {isFixed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => onRemoveItem(it.id)}
                          disabled={isInputDisabled}
                          className={`p-1 rounded ${
                            isInputDisabled
                              ? 'text-slate-200 cursor-not-allowed'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* DÒNG TỔNG CỘNG CHÂN BẢNG */}
          <tfoot className="sticky bottom-0 bg-[#eef2f7] text-slate-900 font-bold border-t-2 border-slate-400 shadow-inner text-[11px]">
            <tr>
              <td colSpan={3} className="py-2 px-3 text-right border-r border-slate-300 uppercase tracking-wider text-xs">
                TỔNG CỘNG ({items.length} MÓN)
              </td>
              <td className="py-2 px-2 text-right border-r border-slate-300 font-mono font-black text-blue-900 bg-blue-100">
                {formatNumber(items.reduce((acc, it) => acc + it.gamPerChild, 0), 1)} g
              </td>
              <td className="py-2 px-2 text-right border-r border-slate-300 font-mono">
                {formatNumber(items.reduce((acc, it) => acc + it.actualEatKg, 0), 2)} kg
              </td>
              <td className="py-2 px-1 border-r border-slate-300"></td>
              <td className="py-2 px-2 text-right border-r border-slate-300 font-mono font-bold">
                {formatNumber(items.reduce((acc, it) => acc + it.actualBuyKg, 0), 2)} kg
              </td>
              <td colSpan={2} className="py-2 px-2 border-r border-slate-300"></td>
              <td className="py-2 px-2 border-r border-slate-300"></td>
              <td className="py-2 px-2 text-right border-r border-slate-300 font-mono font-black text-xs text-slate-900 bg-amber-100">
                {Math.round(totals.totalCost).toLocaleString('vi-VN')} đ
              </td>
              <td className="py-2 px-2 text-right border-r border-slate-300 font-mono font-bold text-rose-700">
                {formatNumber(totals.totalProteinG, 1)}
              </td>
              <td className="py-2 px-2 text-right border-r border-slate-300 font-mono font-bold text-amber-700">
                {formatNumber(totals.totalFatG, 1)}
              </td>
              <td className="py-2 px-2 text-right border-r border-slate-300 font-mono font-bold text-emerald-700">
                {formatNumber(totals.carbsG, 1)}
              </td>
              <td className="py-2 px-2 text-right border-r border-slate-300 font-mono font-black text-orange-950 bg-orange-100">
                {formatNumber(totals.totalCalo, 1)}
              </td>
              <td className="py-2 px-1"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* THANH TRẠNG THÁI TỒN KHO & CÔNG CỤ CHUẨN QLMN */}
      <div className="h-9 px-3 bg-[#f8fafc] border-t border-slate-300 flex items-center justify-between text-xs text-slate-700 shrink-0">
        {/* Vạch trạng thái kho */}
        <div className="flex items-center gap-4 text-[11px]">
          <span className="font-semibold text-slate-600">Trạng thái kho:</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Còn kho</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Sắp hết</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Đã hết</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Đi chợ</span>
            </span>
          </div>
        </div>

        {/* Các nút công cụ kế toán tiếp phẩm */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-medium shadow-xs"
            title="Lấy theo định mức mẫu"
          >
            Lấy theo định mức
          </button>
          <button
            type="button"
            className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-medium shadow-xs"
            title="Lấy giá theo ngày gần nhất"
          >
            Lấy giá ngày gần nhất
          </button>
          <button
            type="button"
            className="px-2.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 text-[11px] font-bold shadow-xs flex items-center gap-1"
          >
            <Archive className="w-3 h-3" />
            <span>Kho tổng hợp</span>
          </button>
        </div>
      </div>
    </div>
  );
};

