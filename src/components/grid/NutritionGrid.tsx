'use client';

import React, { useState } from 'react';
import { ComputedMenuItem, MealSession, NutritionTotals, SchoolBranch } from '../../types/nutrition';
import { formatCurrency, formatNumber } from '../../lib/utils';
import {
  Lock,
  Unlock,
  Trash2,
  Layers,
  ListFilter,
  AlertCircle,
  ShoppingCart,
  Archive,
  SlidersHorizontal,
  ChevronDown,
  CheckSquare,
  Square,
  ArrowUpDown,
  BookmarkPlus,
  Scale,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';

interface Props {
  items: ComputedMenuItem[];
  totals: NutritionTotals;
  branches?: SchoolBranch[];
  isLocked?: boolean;
  canEditNutrients?: boolean;
  onUpdateGam: (itemId: string, newGam: number) => void;
  onUpdateBranchBuy?: (itemId: string, branchId: string, newQty: number) => void;
  onUpdatePrice?: (itemId: string, newPrice: number) => void;
  onToggleFixed: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onScaleNutrientGroup?: (category: 'protein' | 'carbs' | 'fat' | 'veg', percent: number) => void;
  onSaveAsTemplate?: () => void;
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
  branches = [],
  isLocked = false,
  canEditNutrients = true,
  onUpdateGam,
  onUpdateBranchBuy,
  onUpdatePrice,
  onToggleFixed,
  onRemoveItem,
  onScaleNutrientGroup,
  onSaveAsTemplate,
}) => {
  const [groupByDish, setGroupByDish] = useState<boolean>(true);
  const [showColSettings, setShowColSettings] = useState<boolean>(false);
  const [colConfig, setColConfig] = useState({
    showBranches: true,
    showWaste: true,
    showExchange: true,
    showPrice: true,
    showNutrients: true,
  });

  const isInputDisabled = isLocked || !canEditNutrients;

  // Lấy mã thực phẩm hiển thị dạng số hoặc code
  const getFoodCode = (it: ComputedMenuItem) => {
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
      HANH_CU: '733',
      HANH_LA: '7736',
      HAT_TIEU: '1198',
      KHOAI_TAY: '630',
      MUOI_IOT: '6322',
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
      {/* THANH ĐIỀU KHIỂN NHÓM VIEW & TÙY BIẾN CỘT */}
      <div className="h-8 px-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600 shrink-0 relative">
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
            <span>{groupByDish ? 'Đang nhóm theo Món ăn' : 'Hiển thị phẳng'}</span>
          </button>

          {/* NÚT CẤU HÌNH TÙY BIẾN CỘT CHUẨN YÊU CẦU NGƯỜI DÙNG */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColSettings(!showColSettings)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-[11px] shadow-2xs"
              title="Bật/Tắt ẩn hiện các cột theo nhu cầu"
            >
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
              <span>Tùy biến cột</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Popover Bật/Tắt Cột */}
            {showColSettings && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-300 rounded-lg shadow-xl p-2 z-50 text-[11px] space-y-1.5">
                <div className="font-bold text-slate-800 pb-1 border-b border-slate-100 flex items-center justify-between">
                  <span>Cột hiển thị trên bảng:</span>
                  <button
                    type="button"
                    onClick={() => setShowColSettings(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={colConfig.showBranches}
                    onChange={(e) => setColConfig({ ...colConfig, showBranches: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Thực mua theo Điểm trường (Đ1, Đ2)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={colConfig.showWaste}
                    onChange={(e) => setColConfig({ ...colConfig, showWaste: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Hệ số thải bỏ (%)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={colConfig.showExchange}
                    onChange={(e) => setColConfig({ ...colConfig, showExchange: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Quy đổi gam</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={colConfig.showPrice}
                    onChange={(e) => setColConfig({ ...colConfig, showPrice: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Đơn giá theo ĐVT</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={colConfig.showNutrients}
                    onChange={(e) => setColConfig({ ...colConfig, showNutrients: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Cột Dinh dưỡng (P, L, G, Calo)</span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSaveAsTemplate && (
            <button
              type="button"
              onClick={onSaveAsTemplate}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors"
              title="Lưu toàn bộ cấu hình món và định lượng ngày hôm nay vào Thư viện Thực đơn mẫu của trường"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Lưu làm Thực đơn mẫu</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
            {branches.length > 1 && (
              <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                Phân bổ: {branches.map(b => `${b.code}: ${b.studentCount} trẻ`).join(' | ')}
              </span>
            )}
            <span>Tổng số: <strong>{items.length}</strong> thực phẩm</span>
          </div>
        </div>
      </div>

      {/* THANH CÔNG CỤ CO GIÃN ĐỊNH LƯỢNG NHANH (SCALING FACTOR) CHUẨN ĐIỀU HÀNH BẾP */}
      {onScaleNutrientGroup && !isLocked && (
        <div className="bg-amber-50/80 border-b border-amber-200 px-3 py-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-amber-900 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold flex items-center gap-1 text-amber-950">
              <Scale className="w-3.5 h-3.5 text-amber-700" />
              <span>Co giãn định lượng nhanh:</span>
            </span>

            {/* Cụm Đạm */}
            <div className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
              <span className="font-semibold text-rose-700 text-[10.5px]">Đạm (Thịt/Cá):</span>
              <button
                type="button"
                onClick={() => onScaleNutrientGroup('protein', -2)}
                className="px-1 py-0.2 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-mono text-[10px] font-bold"
                title="Giảm 2% định lượng đạm"
              >
                -2%
              </button>
              <button
                type="button"
                onClick={() => onScaleNutrientGroup('protein', 2)}
                className="px-1 py-0.2 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-mono text-[10px] font-bold"
                title="Tăng 2% định lượng đạm"
              >
                +2%
              </button>
              <button
                type="button"
                onClick={() => onScaleNutrientGroup('protein', 5)}
                className="px-1 py-0.2 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-mono text-[10px] font-bold"
                title="Tăng 5% định lượng đạm"
              >
                +5%
              </button>
            </div>

            {/* Cụm Tinh bột */}
            <div className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
              <span className="font-semibold text-amber-800 text-[10.5px]">Tinh bột (Gạo):</span>
              <button
                type="button"
                onClick={() => onScaleNutrientGroup('carbs', -3)}
                className="px-1 py-0.2 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-mono text-[10px] font-bold"
                title="Giảm 3% định lượng gạo"
              >
                -3%
              </button>
              <button
                type="button"
                onClick={() => onScaleNutrientGroup('carbs', 3)}
                className="px-1 py-0.2 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-mono text-[10px] font-bold"
                title="Tăng 3% định lượng gạo"
              >
                +3%
              </button>
            </div>

            {/* Cụm Rau củ */}
            <div className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
              <span className="font-semibold text-emerald-800 text-[10.5px]">Rau củ:</span>
              <button
                type="button"
                onClick={() => onScaleNutrientGroup('veg', -5)}
                className="px-1 py-0.2 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-mono text-[10px] font-bold"
              >
                -5%
              </button>
              <button
                type="button"
                onClick={() => onScaleNutrientGroup('veg', 5)}
                className="px-1 py-0.2 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-mono text-[10px] font-bold"
              >
                +5%
              </button>
            </div>

            {/* Cụm Dầu mỡ */}
            <div className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
              <span className="font-semibold text-orange-800 text-[10.5px]">Dầu mỡ:</span>
              <button
                type="button"
                onClick={() => onScaleNutrientGroup('fat', -5)}
                className="px-1 py-0.2 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-mono text-[10px] font-bold"
              >
                -5%
              </button>
              <button
                type="button"
                onClick={() => onScaleNutrientGroup('fat', 5)}
                className="px-1 py-0.2 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-mono text-[10px] font-bold"
              >
                +5%
              </button>
            </div>
          </div>

          <span className="text-[10px] text-amber-800/80 italic">
            * Nhấn để tinh chỉnh nhanh khẩu phần khi thừa/thiếu Kcal nhẹ
          </span>
        </div>
      )}

      {/* BẢNG DỮ LIỆU CHÍNH (CÓ CỤM CỘT ĐIỂM TRƯỜNG & SỐ NGUYÊN) */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs text-left">
          <thead className="sticky top-0 bg-[#e8eef8] text-slate-800 z-10 shadow-xs border-b border-slate-300 font-bold text-[10.5px]">
            <tr>
              <th className="py-1.5 px-1 text-center border-r border-slate-300 w-8">STT</th>
              <th className="py-1.5 px-1 text-center border-r border-slate-300 w-13">Mã TP</th>
              <th className="py-1.5 px-2 border-r border-slate-300 min-w-[150px]">Tên thực phẩm</th>
              <th className="py-1.5 px-1 text-right border-r border-slate-300 w-16 bg-blue-100/70 text-blue-950 font-black">
                Lượng (g)
              </th>
              <th className="py-1.5 px-1.5 border-r border-slate-300 w-16 text-right">Thực ăn (kg)</th>
              {colConfig.showWaste && (
                <th className="py-1.5 px-1 text-center border-r border-slate-300 w-11">Thải %</th>
              )}
              <th className="py-1.5 px-1.5 border-r border-slate-300 w-16 text-right font-bold text-slate-900">
                Thực mua (kg)
              </th>

              {/* CỤM CỘT THỰC MUA THEO ĐVT CHIA THEO ĐIỂM TRƯỜNG CHUẨN ẢNH QLMN */}
              {colConfig.showBranches && branches.length > 0 && branches.map((b) => (
                <th
                  key={b.id}
                  className="py-1.5 px-1 text-right border-r border-slate-300 w-16 bg-amber-50/80 text-amber-950 font-bold"
                  title={`Lượng thực mua cho ${b.name} (${b.studentCount} trẻ) - Nhập số nguyên`}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{b.code}</span>
                    <span className="text-[9px] font-normal text-slate-500">({b.studentCount})</span>
                  </div>
                </th>
              ))}

              {/* CỘT TỔNG THỰC MUA THEO ĐVT */}
              <th className="py-1.5 px-1 text-right border-r border-slate-300 w-14 font-black text-slate-900 bg-amber-100/50">
                Tổng mua
              </th>
              <th className="py-1.5 px-1 text-center border-r border-slate-300 w-10">ĐVT</th>

              {colConfig.showExchange && (
                <th className="py-1.5 px-1 text-right border-r border-slate-300 w-12 font-mono text-slate-400 text-[10px]">
                  Quy đổi
                </th>
              )}

              {colConfig.showPrice && (
                <th className="py-1.5 px-1.5 border-r border-slate-300 w-16 text-right">Đơn giá</th>
              )}

              <th className="py-1.5 px-2 border-r border-slate-300 w-22 text-right bg-amber-50 text-amber-950 font-black">
                Thành tiền (đ)
              </th>

              {colConfig.showNutrients && (
                <>
                  <th className="py-1.5 px-1 text-right border-r border-slate-300 w-12 text-rose-700">Đạm P</th>
                  <th className="py-1.5 px-1 text-right border-r border-slate-300 w-12 text-amber-700">Béo L</th>
                  <th className="py-1.5 px-1 text-right border-r border-slate-300 w-12 text-emerald-700">Đường G</th>
                  <th className="py-1.5 px-1 text-right border-r border-slate-300 w-13 bg-orange-50 text-orange-950 font-black">
                    Calo
                  </th>
                </>
              )}

              <th className="py-1.5 px-0.5 text-center w-11">Thao tác</th>
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
                    <tr className="bg-[#f2f7fc] border-t-2 border-b border-blue-200 font-bold text-slate-800 text-[11px]">
                      <td colSpan={3} className="py-1 px-2 border-r border-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1 py-0.2 rounded text-[9px] border ${sessionInfo.color}`}>
                            {sessionInfo.label}
                          </span>
                          <span className="text-blue-950 text-xs">🍲 {group.name}</span>
                          <span className="text-[10px] text-slate-500 font-normal">({group.items.length} món)</span>
                        </div>
                      </td>
                      <td className="py-1 px-1 border-r border-slate-300 text-right font-mono text-blue-900 bg-blue-50/50">
                        {formatNumber(group.items.reduce((s, it) => s + it.gamPerChild, 0), 1)}g
                      </td>
                      <td className="py-1 px-1 border-r border-slate-300 text-right font-mono text-slate-700">
                        {formatNumber(group.items.reduce((s, it) => s + it.actualEatKg, 0), 2)}kg
                      </td>
                      {colConfig.showWaste && <td className="py-1 px-1 border-r border-slate-300"></td>}
                      <td className="py-1 px-1.5 border-r border-slate-300 text-right font-mono text-slate-800 font-bold">
                        {formatNumber(group.items.reduce((s, it) => s + it.actualBuyKg, 0), 2)}kg
                      </td>

                      {/* Điểm trường colspan */}
                      {colConfig.showBranches && branches.length > 0 && branches.map((b) => (
                        <td key={b.id} className="py-1 px-1 border-r border-slate-300 text-right font-mono text-amber-900 font-bold bg-amber-50/30">
                          {formatNumber(group.items.reduce((s, it) => s + (it.branchBuyUnits?.[b.id] ?? 0), 0), 0)}
                        </td>
                      ))}

                      <td className="py-1 px-1 border-r border-slate-300 text-right font-mono font-bold text-slate-900 bg-amber-100/30">
                        {formatNumber(group.items.reduce((s, it) => s + it.actualBuyUnit, 0), 1)}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-300"></td>

                      {colConfig.showExchange && <td className="py-1 px-1 border-r border-slate-300"></td>}
                      {colConfig.showPrice && <td className="py-1 px-1 border-r border-slate-300"></td>}

                      <td className="py-1 px-1.5 border-r border-slate-300 text-right font-mono font-bold text-slate-900 bg-amber-50">
                        {Math.round(groupCost).toLocaleString('vi-VN')}đ
                      </td>

                      {colConfig.showNutrients && (
                        <>
                          <td colSpan={3} className="py-1 px-1 border-r border-slate-300"></td>
                          <td className="py-1 px-1 border-r border-slate-300 text-right font-mono font-bold text-orange-900 bg-orange-50">
                            {formatNumber(groupCalo, 1)}
                          </td>
                        </>
                      )}
                      <td className="py-1 px-0.5"></td>
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
                          <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono text-slate-400 text-[10.5px]">
                            {idx + 1}
                          </td>

                          <td className="py-0.5 px-1 text-center border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <span className={`w-1.5 h-3 rounded-full shrink-0 ${statusCfg.color}`} title={statusCfg.label} />
                              <span className="font-mono text-slate-700 font-semibold text-[10.5px]">{foodCode}</span>
                            </div>
                          </td>

                          <td className="py-0.5 px-2 border-r border-slate-200 font-medium text-slate-900 pl-4 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span>{it.food.name}</span>
                              {it.food.allergens && it.food.allergens.length > 0 && (
                                <span className="text-[8.5px] px-1 bg-red-100 text-red-800 rounded font-bold border border-red-200">Codex</span>
                              )}
                            </div>
                          </td>

                          {/* Lượng ăn 1 trẻ (g) */}
                          <td className="py-0.2 px-0.5 border-r border-slate-200 text-right bg-blue-50/30">
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
                              className={`w-full text-right font-mono font-bold px-1 py-0.2 rounded text-[11px] focus:outline-none ${
                                isInputDisabled
                                  ? 'bg-transparent text-slate-500 cursor-not-allowed'
                                  : 'text-blue-900 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-500'
                              }`}
                            />
                          </td>

                          <td className="py-0.5 px-1.5 text-right border-r border-slate-200 font-mono text-slate-700 text-[11px]">
                            {formatNumber(it.actualEatKg, 3)}
                          </td>

                          {colConfig.showWaste && (
                            <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono text-slate-500 text-[10.5px]">
                              {it.food.wasteFactor > 0 ? `${it.food.wasteFactor}%` : '0'}
                            </td>
                          )}

                          <td className="py-0.5 px-1.5 text-right border-r border-slate-200 font-mono font-bold text-slate-800 text-[11px]">
                            <div className="flex flex-col items-end">
                              <span>{formatNumber(it.actualBuyKg, 3)}</span>
                              {it.inventoryDeductedKg !== undefined && it.inventoryDeductedKg > 0 && (
                                <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200 font-normal">
                                  -kho: {formatNumber(it.inventoryDeductedKg, 2)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* CỘT THỰC MUA SỐ NGUYÊN TỪNG ĐIỂM TRƯỜNG */}
                          {colConfig.showBranches && branches.length > 0 && branches.map((b) => {
                            const branchQty = it.branchBuyUnits?.[b.id] ?? 0;
                            return (
                              <td key={b.id} className="py-0.2 px-0.5 border-r border-slate-200 text-right bg-amber-50/40">
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  disabled={isInputDisabled}
                                  value={branchQty}
                                  onChange={(e) => {
                                    const val = Math.round(parseFloat(e.target.value) || 0);
                                    if (onUpdateBranchBuy) onUpdateBranchBuy(it.id, b.id, val);
                                  }}
                                  title={`Định dạng phải là số nguyên cho ${b.code}`}
                                  className={`w-full text-right font-mono font-bold px-1 py-0.2 rounded text-[11px] focus:outline-none ${
                                    isInputDisabled
                                      ? 'bg-transparent text-slate-500 cursor-not-allowed'
                                      : 'text-amber-950 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                                  }`}
                                />
                              </td>
                            );
                          })}

                          {/* Cột Tổng Thực Mua Theo ĐVT */}
                          <td className="py-0.5 px-1 text-right border-r border-slate-200 font-mono font-bold text-slate-900 bg-amber-50/20 text-[11px]">
                            {formatNumber(it.actualBuyUnit, 1)}
                          </td>

                          <td className="py-0.5 px-1 text-center border-r border-slate-200 text-slate-600 font-mono text-[10.5px]">
                            {it.food.unit}
                          </td>

                          {colConfig.showExchange && (
                            <td className="py-0.5 px-1 text-right border-r border-slate-200 font-mono text-slate-400 text-[10px]">
                              {it.food.gamExchange || 1000}g
                            </td>
                          )}

                          {colConfig.showPrice && (
                            <td className="py-0.5 px-1.5 text-right border-r border-slate-200 font-mono text-slate-600 text-[11px]">
                              {it.food.price.toLocaleString('vi-VN')}
                            </td>
                          )}

                          <td className="py-0.5 px-2 text-right border-r border-slate-200 font-mono font-bold text-slate-900 bg-amber-50/30 text-[11px]">
                            {Math.round(it.totalPrice).toLocaleString('vi-VN')}
                          </td>

                          {colConfig.showNutrients && (
                            <>
                              <td className="py-0.5 px-1 text-right border-r border-slate-200 font-mono text-rose-700 text-[10.5px]">
                                {formatNumber(it.proteinAnimal + it.proteinPlant, 2)}
                              </td>
                              <td className="py-0.5 px-1 text-right border-r border-slate-200 font-mono text-amber-700 text-[10.5px]">
                                {formatNumber(it.fatAnimal + it.fatPlant, 2)}
                              </td>
                              <td className="py-0.5 px-1 text-right border-r border-slate-200 font-mono text-emerald-700 text-[10.5px]">
                                {formatNumber(it.carbs, 2)}
                              </td>
                              <td className="py-0.5 px-1 text-right border-r border-slate-200 font-mono font-bold text-orange-950 bg-orange-50/30 text-[11px]">
                                {formatNumber(it.calo, 1)}
                              </td>
                            </>
                          )}

                          <td className="py-0.5 px-0.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onToggleFixed(it.id)}
                                disabled={isInputDisabled}
                                className={`p-0.5 rounded ${
                                  isInputDisabled
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : isFixed
                                    ? 'text-amber-700 bg-amber-100'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                {isFixed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => onRemoveItem(it.id)}
                                disabled={isInputDisabled}
                                className={`p-0.5 rounded ${
                                  isInputDisabled
                                    ? 'text-slate-200 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-rose-600'
                                }`}
                              >
                                <Trash2 className="w-3 h-3" />
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
              // HIỂN THỊ DẠNG PHẲNG
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
                    <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono text-slate-400 text-[10.5px]">
                      {index + 1}
                    </td>

                    <td className="py-0.5 px-1 text-center border-r border-slate-200">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`w-1.5 h-3 rounded-full shrink-0 ${statusCfg.color}`} title={statusCfg.label} />
                        <span className="font-mono text-slate-700 font-semibold text-[10.5px]">{foodCode}</span>
                      </div>
                    </td>

                    <td className="py-0.5 px-2 border-r border-slate-200 font-medium text-slate-900 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span>{it.food.name}</span>
                        {it.dishName && <span className="text-[10px] text-slate-400 font-normal ml-1">({it.dishName})</span>}
                      </div>
                    </td>

                    <td className="py-0.2 px-0.5 border-r border-slate-200 text-right bg-blue-50/30">
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
                        className={`w-full text-right font-mono font-bold px-1 py-0.2 rounded text-[11px] focus:outline-none ${
                          isInputDisabled
                            ? 'bg-transparent text-slate-500 cursor-not-allowed'
                            : 'text-blue-900 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-500'
                        }`}
                      />
                    </td>

                    <td className="py-0.5 px-1.5 text-right border-r border-slate-200 font-mono text-slate-700 text-[11px]">
                      {formatNumber(it.actualEatKg, 3)}
                    </td>

                    {colConfig.showWaste && (
                      <td className="py-0.5 px-1 text-center border-r border-slate-200 font-mono text-slate-500 text-[10.5px]">
                        {it.food.wasteFactor > 0 ? `${it.food.wasteFactor}%` : '0'}
                      </td>
                    )}

                    <td className="py-0.5 px-1.5 text-right border-r border-slate-200 font-mono font-bold text-slate-800 text-[11px]">
                      {formatNumber(it.actualBuyKg, 3)}
                    </td>

                    {/* Điểm trường từng ô */}
                    {colConfig.showBranches && branches.length > 0 && branches.map((b) => (
                      <td key={b.id} className="py-0.2 px-0.5 border-r border-slate-200 text-right bg-amber-50/40">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          disabled={isInputDisabled}
                          value={it.branchBuyUnits?.[b.id] ?? 0}
                          onChange={(e) => {
                            const val = Math.round(parseFloat(e.target.value) || 0);
                            if (onUpdateBranchBuy) onUpdateBranchBuy(it.id, b.id, val);
                          }}
                          title={`Định dạng phải là số nguyên cho ${b.code}`}
                          className={`w-full text-right font-mono font-bold px-1 py-0.2 rounded text-[11px] focus:outline-none ${
                            isInputDisabled
                              ? 'bg-transparent text-slate-500 cursor-not-allowed'
                              : 'text-amber-950 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                          }`}
                        />
                      </td>
                    ))}

                    <td className="py-0.5 px-1 text-right border-r border-slate-200 font-mono font-bold text-slate-900 bg-amber-50/20 text-[11px]">
                      {formatNumber(it.actualBuyUnit, 1)}
                    </td>

                    <td className="py-0.5 px-1 text-center border-r border-slate-200 text-slate-600 font-mono text-[10.5px]">
                      {it.food.unit}
                    </td>

                    {colConfig.showExchange && (
                      <td className="py-0.5 px-1 text-right border-r border-slate-200 font-mono text-slate-400 text-[10px]">
                        {it.food.gamExchange || 1000}g
                      </td>
                    )}

                    {colConfig.showPrice && (
                      <td className="py-0.5 px-1.5 text-right border-r border-slate-200 font-mono text-slate-600 text-[11px]">
                        {it.food.price.toLocaleString('vi-VN')}
                      </td>
                    )}

                    <td className="py-0.5 px-2 text-right border-r border-slate-200 font-mono font-bold text-slate-900 bg-amber-50/30 text-[11px]">
                      {Math.round(it.totalPrice).toLocaleString('vi-VN')}
                    </td>

                    {colConfig.showNutrients && (
                      <>
                        <td className="py-0.5 px-1 text-right border-r border-slate-200 font-mono text-rose-700 text-[10.5px]">
                          {formatNumber(it.proteinAnimal + it.proteinPlant, 2)}
                        </td>
                        <td className="py-0.5 px-1 text-right border-r border-slate-200 font-mono text-amber-700 text-[10.5px]">
                          {formatNumber(it.fatAnimal + it.fatPlant, 2)}
                        </td>
                        <td className="py-0.5 px-1 text-right border-r border-slate-200 font-mono text-emerald-700 text-[10.5px]">
                          {formatNumber(it.carbs, 2)}
                        </td>
                        <td className="py-0.5 px-1 text-right border-r border-slate-200 font-mono font-bold text-orange-950 bg-orange-50/30 text-[11px]">
                          {formatNumber(it.calo, 1)}
                        </td>
                      </>
                    )}

                    <td className="py-0.5 px-0.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onToggleFixed(it.id)}
                          disabled={isInputDisabled}
                          className={`p-0.5 rounded ${
                            isInputDisabled ? 'text-slate-300' : isFixed ? 'text-amber-700 bg-amber-100' : 'text-slate-400'
                          }`}
                        >
                          {isFixed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => onRemoveItem(it.id)}
                          disabled={isInputDisabled}
                          className={`p-0.5 rounded ${isInputDisabled ? 'text-slate-200' : 'text-slate-400 hover:text-rose-600'}`}
                        >
                          <Trash2 className="w-3 h-3" />
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
              <td colSpan={3} className="py-1.5 px-2 text-right border-r border-slate-300 uppercase tracking-wider text-[10.5px]">
                TỔNG CỘNG ({items.length} MÓN)
              </td>
              <td className="py-1.5 px-1 text-right border-r border-slate-300 font-mono font-black text-blue-900 bg-blue-100">
                {formatNumber(items.reduce((acc, it) => acc + it.gamPerChild, 0), 1)}g
              </td>
              <td className="py-1.5 px-1 text-right border-r border-slate-300 font-mono">
                {formatNumber(items.reduce((acc, it) => acc + it.actualEatKg, 0), 2)}kg
              </td>
              {colConfig.showWaste && <td className="py-1.5 px-1 border-r border-slate-300"></td>}
              <td className="py-1.5 px-1.5 text-right border-r border-slate-300 font-mono font-bold">
                {formatNumber(items.reduce((acc, it) => acc + it.actualBuyKg, 0), 2)}kg
              </td>

              {/* Tổng các điểm trường */}
              {colConfig.showBranches && branches.length > 0 && branches.map((b) => (
                <td key={b.id} className="py-1.5 px-1 text-right border-r border-slate-300 font-mono font-black text-amber-950 bg-amber-100">
                  {formatNumber(items.reduce((acc, it) => acc + (it.branchBuyUnits?.[b.id] ?? 0), 0), 0)}
                </td>
              ))}

              <td className="py-1.5 px-1 text-right border-r border-slate-300 font-mono font-black text-slate-900 bg-amber-100/60">
                {formatNumber(items.reduce((acc, it) => acc + it.actualBuyUnit, 0), 1)}
              </td>
              <td className="py-1.5 px-1 border-r border-slate-300"></td>

              {colConfig.showExchange && <td className="py-1.5 px-1 border-r border-slate-300"></td>}
              {colConfig.showPrice && <td className="py-1.5 px-1 border-r border-slate-300"></td>}

              <td className="py-1.5 px-2 text-right border-r border-slate-300 font-mono font-black text-xs text-slate-900 bg-amber-100">
                {Math.round(totals.totalCost).toLocaleString('vi-VN')} đ
              </td>

              {colConfig.showNutrients && (
                <>
                  <td className="py-1.5 px-1 text-right border-r border-slate-300 font-mono font-bold text-rose-700">
                    {formatNumber(totals.totalProteinG, 1)}
                  </td>
                  <td className="py-1.5 px-1 text-right border-r border-slate-300 font-mono font-bold text-amber-700">
                    {formatNumber(totals.totalFatG, 1)}
                  </td>
                  <td className="py-1.5 px-1 text-right border-r border-slate-300 font-mono font-bold text-emerald-700">
                    {formatNumber(totals.carbsG, 1)}
                  </td>
                  <td className="py-1.5 px-1 text-right border-r border-slate-300 font-mono font-black text-orange-950 bg-orange-100">
                    {formatNumber(totals.totalCalo, 1)}
                  </td>
                </>
              )}
              <td className="py-1.5 px-0.5"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* THANH TRẠNG THÁI TỒN KHO & CÔNG CỤ CHUẨN QLMN */}
      <div className="h-8 px-3 bg-[#f8fafc] border-t border-slate-300 flex items-center justify-between text-xs text-slate-700 shrink-0">
        {/* Vạch trạng thái kho */}
        <div className="flex items-center gap-4 text-[11px]">
          <span className="font-semibold text-slate-600">Trạng thái kho:</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Còn kho</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Sắp hết</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Đã hết</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Đi chợ</span>
            </span>
          </div>
        </div>

        {/* Các nút công cụ kế toán tiếp phẩm */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[10.5px] font-medium shadow-2xs"
            title="Lấy theo định mức mẫu"
          >
            Lấy theo định mức
          </button>
          <button
            type="button"
            className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[10.5px] font-medium shadow-2xs"
            title="Lấy giá theo ngày gần nhất"
          >
            Lấy giá ngày gần nhất
          </button>
          <button
            type="button"
            className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 text-[10.5px] font-bold shadow-2xs flex items-center gap-1"
          >
            <Archive className="w-3 h-3" />
            <span>Kho tổng hợp</span>
          </button>
        </div>
      </div>
    </div>
  );
};

