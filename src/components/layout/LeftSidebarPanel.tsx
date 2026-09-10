'use client';

import React, { useState } from 'react';
import { AgeGroup, DayMenuBundle, NutritionTotals, MealSession, MenuItem } from '@/types/nutrition';
import { DishItem } from '@/types/dish';
import { SEED_DISH_ITEMS } from '@/data/seed-dishes';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  Calendar,
  Sparkles,
  Copy,
  Flame,
  Scale,
  ShieldCheck,
  CircleDollarSign,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Utensils,
  Layers,
  Plus,
  Trash2,
  X,
  Search,
  CookingPot,
} from 'lucide-react';

interface Props {
  schedule: DayMenuBundle[];
  selectedDate: string;
  onSelectDate: (d: string) => void;
  currentSegment: AgeGroup;
  onSegmentChange: (seg: AgeGroup) => void;
  studentCount: number;
  onStudentCountChange: (count: number) => void;
  mealPrice: number;
  onMealPriceChange: (price: number) => void;
  canEditPrice?: boolean;
  totals: NutritionTotals;
  onOpenTemplateModal: () => void;
  onCloneCurrentDay: () => void;
  onOpenAuditDrawer?: () => void;
  onOpenAuto20DaysModal?: () => void;
  dishCatalog?: DishItem[];
  onAddDishToMenu?: (dish: DishItem, session: MealSession) => void;
  onRemoveDishFromMenu?: (dishName: string, session: MealSession) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const LeftSidebarPanel: React.FC<Props> = ({
  schedule,
  selectedDate,
  onSelectDate,
  currentSegment,
  onSegmentChange,
  studentCount,
  onStudentCountChange,
  mealPrice,
  onMealPriceChange,
  canEditPrice = true,
  totals,
  onOpenTemplateModal,
  onCloneCurrentDay,
  onOpenAuditDrawer,
  onOpenAuto20DaysModal,
  dishCatalog = SEED_DISH_ITEMS,
  onAddDishToMenu,
  onRemoveDishFromMenu,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [isDishPickerOpen, setIsDishPickerOpen] = useState<boolean>(false);
  const [activePickerSession, setActivePickerSession] = useState<MealSession>('chinh_trua');
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerCategory, setPickerCategory] = useState<string>('all');

  const selectedBundle = schedule.find((d) => d.date === selectedDate) || schedule[0];
  const currentPlan = selectedBundle
    ? currentSegment === 'maugiao'
      ? selectedBundle.maugiao
      : currentSegment === 'nhatre'
      ? selectedBundle.nhatre
      : selectedBundle.ansang
    : null;

  const getDishesInSession = (session: MealSession) => {
    if (!currentPlan || !currentPlan.items) return [];
    const sessionItems = currentPlan.items.filter((it) => it.mealSession === session);
    const dishMap = new Map<string, { name: string; count: number }>();
    sessionItems.forEach((it) => {
      const name = it.dishName || it.food.name;
      if (!dishMap.has(name)) dishMap.set(name, { name, count: 0 });
      dishMap.get(name)!.count += 1;
    });
    return Array.from(dishMap.values());
  };

  const breakfastDishes = getDishesInSession('sang');
  const lunchDishes = getDishesInSession('chinh_trua');
  const snackDishes = getDishesInSession('xe');
  const lateSnackDishes = getDishesInSession('phu_xe');

  const filteredDishes = dishCatalog.filter((dish) => {
    const matchSearch =
      !pickerSearch.trim() ||
      dish.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      dish.code.toLowerCase().includes(pickerSearch.toLowerCase());
    const matchCat = pickerCategory === 'all' || dish.category === pickerCategory;
    return matchSearch && matchCat;
  });

  const getSessionTitle = (session: MealSession) => {
    switch (session) {
      case 'sang':
        return 'Bữa sáng';
      case 'chinh_trua':
        return 'Bữa trưa';
      case 'phu_trua':
        return 'Tráng miệng trưa';
      case 'xe':
        return 'Bữa xế';
      case 'phu_xe':
        return 'Bữa phụ xế';
      default:
        return 'Bữa ăn';
    }
  };
  // NẾU ĐANG THU GỌN: Render thanh dọc mini (w-12)
  if (isCollapsed) {
    return (
      <aside className="w-11 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-2 shrink-0 select-none text-slate-600 justify-between">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
            title="Mở rộng menu trái (Alt + B)"
          >
            <PanelLeftOpen className="w-4 h-4 text-blue-600" />
          </button>
          <div className="w-6 h-[1px] bg-slate-200" />
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-600 hover:text-blue-700"
            title="Lịch tuần"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-600 hover:text-blue-700"
            title="Nhóm trẻ"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-600 hover:text-blue-700"
            title="Cây món ăn"
          >
            <Utensils className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onOpenAuditDrawer}
            className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-700"
            title="Thẩm định QĐ 2195"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  // TRẠNG THÁI MỞ RỘNG: Bề rộng chuẩn gọn gàng w-64 (256px)
  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50/80 p-2.5 flex flex-col gap-2.5 overflow-y-auto shrink-0 select-none text-xs">
      {/* 1. LỊCH TUẦN 5 NGÀY */}
      <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1 font-bold text-slate-800 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>TUẦN 02 / THÁNG 09</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenTemplateModal}
              className="px-1.5 py-0.2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[9px] transition-colors"
              title="Áp dụng thực đơn mẫu"
            >
              Mẫu
            </button>
            <button
              type="button"
              onClick={onCloneCurrentDay}
              className="px-1.5 py-0.2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[9px] transition-colors"
              title="Sao chép ngày"
            >
              Copy
            </button>
            {onOpenAuto20DaysModal && (
              <button
                type="button"
                onClick={onOpenAuto20DaysModal}
                className="px-1.5 py-0.2 rounded bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-[9px] hover:from-teal-600 hover:to-emerald-700 shadow-2xs flex items-center gap-0.5 transition-all"
                title="Tự động sinh thực đơn 4 tuần chuẩn QĐ 2195"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-200 animate-pulse" />
                <span>4 Tuần</span>
              </button>
            )}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ml-1"
                title="Thu gọn Sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 5 Date items list */}
        <div className="space-y-1">
          {schedule.map((day) => {
            const isSelected = day.date === selectedDate;
            const currentPlan =
              currentSegment === 'maugiao'
                ? day.maugiao
                : currentSegment === 'nhatre'
                ? day.nhatre
                : day.ansang;

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDate(day.date)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-between border ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-300 text-blue-950 font-bold shadow-xs'
                    : 'bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-12 text-[11px] font-semibold">{day.dayOfWeek}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {day.date.split('-').slice(1).reverse().join('/')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                      currentPlan.status === 'LOCKED'
                        ? 'bg-purple-100 text-purple-700'
                        : currentPlan.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : currentPlan.status === 'OPTIMIZED'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {currentPlan.status === 'LOCKED'
                      ? 'Khóa sổ'
                      : currentPlan.status === 'APPROVED'
                      ? 'Duyệt'
                      : currentPlan.status === 'OPTIMIZED'
                      ? 'Cân đối'
                      : 'Nháp'}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PHÂN HỆ BÁN TRÚ (NHÓM TRẺ - THỰC ĐƠN CHUẨN QLMN) */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            NHÓM TRẺ - THỰC ĐƠN
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="px-2 py-0.5 rounded bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] shadow-xs transition-colors"
              title="Tổng hợp các nhóm trẻ"
            >
              Tổng hợp
            </button>
            <button
              type="button"
              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs transition-colors"
              title="Thêm thực đơn nhóm trẻ"
            >
              + Thêm
            </button>
          </div>
        </div>

        {/* Danh sách 3 nhóm trẻ có số lượng cháu chuẩn QLMN */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSegmentChange('nhatre')}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-all border ${
              currentSegment === 'nhatre'
                ? 'bg-blue-50/90 border-blue-300 text-blue-950 font-bold shadow-xs'
                : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-5 text-center font-mono font-bold text-slate-400">1.</span>
              <span>Nhà trẻ</span>
            </div>
            <span className="font-mono text-slate-500 font-semibold">(0)</span>
          </button>

          <button
            type="button"
            onClick={() => onSegmentChange('maugiao')}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-all border ${
              currentSegment === 'maugiao'
                ? 'bg-blue-50/90 border-blue-300 text-blue-950 font-bold shadow-xs'
                : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-5 text-center font-mono font-bold text-blue-600">2.</span>
              <span className="font-bold">Mẫu giáo</span>
            </div>
            <span className="font-mono text-blue-700 font-bold">({studentCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onSegmentChange('ansang')}
            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-all border ${
              currentSegment === 'ansang'
                ? 'bg-blue-50/90 border-blue-300 text-blue-950 font-bold shadow-xs'
                : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-5 text-center font-mono font-bold text-slate-400">3.</span>
              <span>Ăn sáng</span>
            </div>
            <span className="font-mono text-slate-500 font-semibold">(0)</span>
          </button>
        </div>

        {/* Cấu hình Sĩ số và Đơn giá */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase">SĨ SỐ ĂN (CHÁU)</label>
            <input
              type="number"
              value={studentCount}
              onChange={(e) => onStudentCountChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-800 text-center focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase">TIỀN ĂN (Đ/CHÁU)</label>
            <input
              type="number"
              step="1000"
              disabled={!canEditPrice}
              value={mealPrice}
              onChange={(e) => onMealPriceChange(Math.max(1000, parseInt(e.target.value) || 1000))}
              className={`w-full mt-1 border rounded-lg px-2 py-1 font-mono font-bold text-right focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                canEditPrice ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 3. KHỐI CÂY MÓN ĂN THEO BỮA (THÔNG TIN THỰC ĐƠN CHUẨN QLMN) */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            THÔNG TIN THỰC ĐƠN
          </label>
          <span className="text-[10px] text-slate-400">Cây món ăn</span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Bữa sáng */}
          <div className="rounded-lg border border-amber-200 overflow-hidden">
            <div className="bg-amber-50 px-2.5 py-1 flex items-center justify-between font-bold text-amber-950 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span>Bữa sáng</span>
                <span className="text-[10px] font-normal text-amber-700">({breakfastDishes.length})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setActivePickerSession('sang');
                  setIsDishPickerOpen(true);
                }}
                className="text-amber-800 hover:text-amber-950 bg-amber-200/60 hover:bg-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5"
                title="Thêm món cho Bữa sáng"
              >
                <Plus className="w-3 h-3" /> Thêm
              </button>
            </div>
            <div className="px-2.5 py-1.5 bg-white space-y-1 text-[11px] text-slate-700 border-t border-amber-100">
              {breakfastDishes.length > 0 ? (
                breakfastDishes.map((dish) => (
                  <div key={dish.name} className="flex items-center justify-between group hover:bg-amber-50/50 px-1 py-0.5 rounded">
                    <div className="flex items-center gap-1.5 truncate pr-1">
                      <span className="text-amber-500 text-[10px]">•</span>
                      <span className="truncate font-medium text-slate-800" title={dish.name}>{dish.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono shrink-0">({dish.count} NL)</span>
                    </div>
                    {onRemoveDishFromMenu && (
                      <button
                        type="button"
                        onClick={() => onRemoveDishFromMenu(dish.name, 'sang')}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5 rounded"
                        title={`Xóa món "${dish.name}" khỏi Bữa sáng`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-slate-400 italic py-0.5 text-center">Chưa có món - Bấm + Thêm</div>
              )}
            </div>
          </div>

          {/* Bữa trưa */}
          <div className="rounded-lg border border-blue-200 overflow-hidden">
            <div className="bg-blue-50 px-2.5 py-1 flex items-center justify-between font-bold text-blue-950 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                <span>Bữa trưa</span>
                <span className="text-[10px] font-normal text-blue-700">({lunchDishes.length})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setActivePickerSession('chinh_trua');
                  setIsDishPickerOpen(true);
                }}
                className="text-blue-800 hover:text-blue-950 bg-blue-200/60 hover:bg-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5"
                title="Thêm món cho Bữa trưa"
              >
                <Plus className="w-3 h-3" /> Thêm
              </button>
            </div>
            <div className="px-2.5 py-1.5 bg-white space-y-1 text-[11px] text-slate-700 border-t border-blue-100">
              {lunchDishes.length > 0 ? (
                lunchDishes.map((dish) => (
                  <div key={dish.name} className="flex items-center justify-between group hover:bg-blue-50/50 px-1 py-0.5 rounded">
                    <div className="flex items-center gap-1.5 truncate pr-1">
                      <span className="text-blue-500 text-[10px]">•</span>
                      <span className="truncate font-medium text-slate-800" title={dish.name}>{dish.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono shrink-0">({dish.count} NL)</span>
                    </div>
                    {onRemoveDishFromMenu && (
                      <button
                        type="button"
                        onClick={() => onRemoveDishFromMenu(dish.name, 'chinh_trua')}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5 rounded"
                        title={`Xóa món "${dish.name}" khỏi Bữa trưa`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-slate-400 italic py-0.5 text-center">Chưa có món - Bấm + Thêm</div>
              )}
            </div>
          </div>

          {/* Bữa xế */}
          <div className="rounded-lg border border-emerald-200 overflow-hidden">
            <div className="bg-emerald-50 px-2.5 py-1 flex items-center justify-between font-bold text-emerald-950 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>Bữa xế</span>
                <span className="text-[10px] font-normal text-emerald-700">({snackDishes.length})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setActivePickerSession('xe');
                  setIsDishPickerOpen(true);
                }}
                className="text-emerald-800 hover:text-emerald-950 bg-emerald-200/60 hover:bg-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5"
                title="Thêm món cho Bữa xế"
              >
                <Plus className="w-3 h-3" /> Thêm
              </button>
            </div>
            <div className="px-2.5 py-1.5 bg-white space-y-1 text-[11px] text-slate-700 border-t border-emerald-100">
              {snackDishes.length > 0 ? (
                snackDishes.map((dish) => (
                  <div key={dish.name} className="flex items-center justify-between group hover:bg-emerald-50/50 px-1 py-0.5 rounded">
                    <div className="flex items-center gap-1.5 truncate pr-1">
                      <span className="text-emerald-500 text-[10px]">•</span>
                      <span className="truncate font-medium text-slate-800" title={dish.name}>{dish.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono shrink-0">({dish.count} NL)</span>
                    </div>
                    {onRemoveDishFromMenu && (
                      <button
                        type="button"
                        onClick={() => onRemoveDishFromMenu(dish.name, 'xe')}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5 rounded"
                        title={`Xóa món "${dish.name}" khỏi Bữa xế`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-slate-400 italic py-0.5 text-center">Chưa có món - Bấm + Thêm</div>
              )}
            </div>
          </div>

          {/* Bữa phụ */}
          <div className="rounded-lg border border-purple-200 overflow-hidden">
            <div className="bg-purple-50 px-2.5 py-1 flex items-center justify-between font-bold text-purple-950 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                <span>Bữa phụ</span>
                <span className="text-[10px] font-normal text-purple-700">({lateSnackDishes.length})</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setActivePickerSession('phu_xe');
                  setIsDishPickerOpen(true);
                }}
                className="text-purple-800 hover:text-purple-950 bg-purple-200/60 hover:bg-purple-200 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5"
                title="Thêm món cho Bữa phụ"
              >
                <Plus className="w-3 h-3" /> Thêm
              </button>
            </div>
            <div className="px-2.5 py-1.5 bg-white space-y-1 text-[11px] text-slate-700 border-t border-purple-100">
              {lateSnackDishes.length > 0 ? (
                lateSnackDishes.map((dish) => (
                  <div key={dish.name} className="flex items-center justify-between group hover:bg-purple-50/50 px-1 py-0.5 rounded">
                    <div className="flex items-center gap-1.5 truncate pr-1">
                      <span className="text-purple-500 text-[10px]">•</span>
                      <span className="truncate font-medium text-slate-800" title={dish.name}>{dish.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono shrink-0">({dish.count} NL)</span>
                    </div>
                    {onRemoveDishFromMenu && (
                      <button
                        type="button"
                        onClick={() => onRemoveDishFromMenu(dish.name, 'phu_xe')}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5 rounded"
                        title={`Xóa món "${dish.name}" khỏi Bữa phụ`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-slate-400 italic py-0.5 text-center">Chưa có món - Bấm + Thêm</div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* 3. 4 THẺ KPI DINH DƯỠNG & KIỂM SOÁT PHÁP LÝ */}
      <div className="space-y-2">
        {/* KPI 1: Năng lượng Atwater */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              NĂNG LƯỢNG ATWATER
            </span>
            <span
              className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                totals.isCaloPass ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {totals.isCaloPass ? '✓ ĐẠT' : 'LỆCH CHUẨN'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-slate-900 tracking-tight">
              {formatNumber(totals.totalCalo, 1)} <span className="text-xs font-normal text-slate-500">Kcal/trẻ</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Chuẩn: 615 - 738 Kcal</span>
          </div>
        </div>

        {/* KPI 2: Cơ cấu P - L - G */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              TỶ LỆ CƠ CẤU P - L - G
            </span>
            <span className="font-bold text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
              {totals.isRatioPass ? 'ĐẠT CHUẨN' : 'CẦN CÂN ĐỐI'}
            </span>
          </div>

          <div className="flex items-center justify-between font-mono font-bold text-xs mb-1.5">
            <span className="text-rose-600">{totals.proteinPct.toFixed(1)}% P</span>
            <span className="text-amber-600">{totals.fatPct.toFixed(1)}% L</span>
            <span className="text-emerald-600">{totals.carbsPct.toFixed(1)}% G</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100">
            <div style={{ width: `${totals.proteinPct}%` }} className="bg-rose-500" />
            <div style={{ width: `${totals.fatPct}%` }} className="bg-amber-500" />
            <div style={{ width: `${totals.carbsPct}%` }} className="bg-emerald-500" />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
            <span>Đạm ĐV: <strong>{totals.animalProteinRatio.toFixed(1)}%</strong> (≥50%)</span>
            <span>Béo TV: <strong>{totals.plantFatRatio.toFixed(1)}%</strong> (≥45%)</span>
          </div>
        </div>

        {/* KPI 3: QĐ 2195 Natri & Đường */}
        <div
          onClick={onOpenAuditDrawer}
          className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-sm cursor-pointer transition"
          title="Bấm để mở Ngăn Thẩm Định Lượng & Chất (QĐ 2195)"
        >
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              KIỂM SOÁT QĐ 2195
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded hover:bg-indigo-100">
              CHI TIẾT &rarr;
            </span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Natri (Muối ăn):</span>
              <span className={`font-mono font-bold ${totals.isSodiumPass ? 'text-slate-800' : 'text-rose-600'}`}>
                {Math.round(totals.totalSodiumMg)} / ≤1200 mg
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Đường tự do:</span>
              <span className={`font-mono font-bold ${totals.isSugarPass ? 'text-slate-800' : 'text-rose-600'}`}>
                {totals.freeSugarCaloPct.toFixed(1)}% / ≤10% Calo
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Ngân sách bán trú */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <CircleDollarSign className="w-3.5 h-3.5 text-emerald-600" />
              NGÂN SÁCH ({studentCount} CHÁU)
            </span>
            <span
              className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                totals.budgetDifference >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {totals.budgetDifference >= 0 ? 'DƯ QUỸ' : 'BỘI CHI'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-black font-mono text-slate-900">
              {formatCurrency(totals.totalCost)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              BQ: {formatNumber(totals.costPerChild, 0)} đ/trẻ
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Chênh lệch ngân sách:</span>
            <strong className={`font-mono ${totals.budgetDifference >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatCurrency(totals.budgetDifference)}
            </strong>
          </div>
        </div>
      </div>

      {/* MODAL CHỌN MÓN ĂN DINH DƯỠNG (BUNG NGUYÊN LIỆU BOM) */}
      {isDishPickerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in duration-200">
            {/* Header Modal */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <CookingPot className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm tracking-wide">CHỌN MÓN ĂN DINH DƯỠNG</h3>
                  <p className="text-[11px] text-slate-300">
                    Bung BOM tự động vào: <span className="font-bold text-amber-300 uppercase">{getSessionTitle(activePickerSession)}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDishPickerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toolbar tìm kiếm & Lọc danh mục */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50 space-y-2.5 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm món ăn theo tên (vd: canh bí đỏ, xíu mại, cá thu, sữa)..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  autoFocus
                />
              </div>

              {/* Bộ lọc danh mục */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'Tất cả nhóm' },
                  { id: 'mon_man', label: 'Món mặn' },
                  { id: 'mon_canh', label: 'Món canh' },
                  { id: 'mon_xao', label: 'Món xào' },
                  { id: 'tinh_bot', label: 'Cơm / Tinh bột' },
                  { id: 'trang_mieng', label: 'Tráng miệng' },
                  { id: 'sua_phu', label: 'Sữa / Phụ' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setPickerCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      pickerCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Danh sách món ăn */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50">
              {filteredDishes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredDishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 mr-1.5">
                              {dish.code}
                            </span>
                            <span className="text-[10px] font-medium text-blue-600">
                              {dish.categoryLabel}
                            </span>
                            <h4 className="font-bold text-slate-800 text-xs mt-0.5 group-hover:text-blue-700">
                              {dish.name}
                            </h4>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                            {formatCurrency(dish.totalCost)}
                          </span>
                        </div>

                        {/* Chỉ số dinh dưỡng tóm tắt */}
                        <div className="grid grid-cols-4 gap-1 bg-slate-50 rounded-lg p-1.5 my-2 text-[10px] text-center font-mono">
                          <div>
                            <span className="text-slate-400 block text-[9px]">Calo</span>
                            <strong className="text-amber-700">{Math.round(dish.totalCalo)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">Đạm (P)</span>
                            <strong className="text-rose-600">{dish.totalProtein}g</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">Béo (L)</span>
                            <strong className="text-amber-600">{dish.totalFat}g</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">Đường (G)</span>
                            <strong className="text-emerald-600">{dish.totalCarbs}g</strong>
                          </div>
                        </div>

                        {/* Danh sách nguyên liệu cấu thành (BOM) */}
                        <div className="text-[10px] text-slate-500 mb-2">
                          <span className="font-semibold text-slate-700">Nguyên liệu ({dish.ingredients.length}): </span>
                          <span className="text-slate-600">
                            {dish.ingredients.map((ing) => `${ing.foodName} (${ing.gamPerChild}g)`).join(', ')}
                          </span>
                        </div>
                      </div>

                      {/* Nút thêm món */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onAddDishToMenu) {
                            onAddDishToMenu(dish, activePickerSession);
                          }
                        }}
                        className="w-full mt-2 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-blue-200 hover:border-blue-600 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm vào {getSessionTitle(activePickerSession)}</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Không tìm thấy món ăn nào phù hợp với bộ lọc tìm kiếm.
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <p className="text-[11px] text-slate-500 italic">
                * Khi chọn món, hệ thống tự động bung toàn bộ danh sách nguyên liệu và định lượng vào lưới kế toán 13 cột.
              </p>
              <button
                type="button"
                onClick={() => setIsDishPickerOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
