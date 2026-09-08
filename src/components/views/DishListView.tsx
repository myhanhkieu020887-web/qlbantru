'use client';

import React, { useState, useMemo } from 'react';
import { DishItem, DishCategory, DishMealSession, DishIngredient } from '../../types/dish';
import {
  Search,
  PlusCircle,
  Trash2,
  Settings,
  CookingPot,
  Eye,
  Pencil,
  X,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Utensils,
  ChevronDown,
  CheckSquare,
  Square,
  Flame,
  DollarSign,
  Scale,
} from 'lucide-react';

interface Props {
  initialDishes: DishItem[];
  onAddDish?: (dish: DishItem) => void;
  onUpdateDish?: (dish: DishItem) => void;
  onDeleteDish?: (id: string) => void;
  onApplyToMenu?: (dish: DishItem) => void;
}

export const DishListView: React.FC<Props> = ({
  initialDishes,
  onAddDish,
  onUpdateDish,
  onDeleteDish,
  onApplyToMenu,
}) => {
  const [dishes, setDishes] = useState<DishItem[]>(initialDishes);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDishDetail, setSelectedDishDetail] = useState<DishItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form state cho tạo món mới
  const [newDishName, setNewDishName] = useState<string>('');
  const [newDishCode, setNewDishCode] = useState<string>('HT-M11');
  const [newDishCategory, setNewDishCategory] = useState<DishCategory>('mon_man');
  const [newDishSession, setNewDishSession] = useState<DishMealSession>('trua');
  const [newDishGuide, setNewDishGuide] = useState<string>('');

  // Lọc dữ liệu
  const filteredDishes = useMemo(() => {
    return dishes.filter((d) => {
      const matchSearch =
        searchTerm.trim() === '' ||
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSession = sessionFilter === 'all' || d.mealSession === sessionFilter;
      const matchCategory = categoryFilter === 'all' || d.category === categoryFilter;

      return matchSearch && matchSession && matchCategory;
    });
  }, [dishes, searchTerm, sessionFilter, categoryFilter]);

  const isAllSelected =
    filteredDishes.length > 0 && selectedIds.length === filteredDishes.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDishes.map((d) => d.id));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((it) => it !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} món ăn đã chọn?`)) {
      setDishes((prev) => prev.filter((d) => !selectedIds.includes(d.id)));
      selectedIds.forEach((id) => onDeleteDish?.(id));
      setSelectedIds([]);
    }
  };

  // Tạo món mới
  const handleCreateDish = (e: React.FormEvent) => {
    e.preventDefault();
    const newDish: DishItem = {
      id: `dish_${Date.now()}`,
      code: newDishCode,
      name: newDishName,
      category: newDishCategory,
      categoryLabel:
        newDishCategory === 'mon_man'
          ? 'Món mặn đạm'
          : newDishCategory === 'mon_canh'
          ? 'Món canh rau'
          : newDishCategory === 'mon_xao'
          ? 'Món xào'
          : 'Tinh bột',
      mealSession: newDishSession,
      mealSessionLabel: newDishSession === 'trua' ? 'Bữa trưa' : 'Bữa sáng',
      ageGroup: 'tat_ca',
      ageGroupLabel: 'Dùng chung',
      ingredients: [],
      totalCalo: 120,
      totalProtein: 8.5,
      totalFat: 5.0,
      totalCarbs: 10.2,
      totalCost: 4500,
      cookingGuide: newDishGuide,
      updatedAt: new Date().toLocaleString('vi-VN'),
    };

    setDishes([newDish, ...dishes]);
    onAddDish?.(newDish);
    setIsAddModalOpen(false);
    setNewDishName('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden text-slate-800 font-sans">
      {/* 1. THANH CÔNG CỤ LỌC & THAO TÁC */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tìm kiếm */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tên hoặc mã món ăn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Lọc Bữa ăn */}
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1.5 text-xs bg-white text-slate-800 font-semibold focus:outline-none"
          >
            <option value="all">-- Tất cả bữa ăn --</option>
            <option value="trua">Bữa trưa</option>
            <option value="sang">Bữa sáng</option>
            <option value="chieu">Bữa chiều xế</option>
            <option value="phu">Bữa phụ</option>
          </select>

          {/* Lọc Phân loại */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1.5 text-xs bg-white text-slate-800 font-semibold focus:outline-none"
          >
            <option value="all">-- Tất cả phân loại --</option>
            <option value="mon_man">Món mặn đạm</option>
            <option value="mon_canh">Món canh rau</option>
            <option value="mon_xao">Món xào</option>
            <option value="tinh_bot">Cơm / Bún / Bánh mì</option>
            <option value="sua_phu">Sữa & Bánh phụ</option>
            <option value="trang_mieng">Tráng miệng</option>
          </select>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm món ăn mới</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
              selectedIds.length > 0
                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 cursor-pointer'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
          </button>

          <button
            type="button"
            title="Cài đặt danh mục"
            className="p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. BẢNG DANH MỤC MÓN ĂN (10 CỘT CHUẨN PMS) */}
      <div className="flex-1 overflow-auto bg-white p-3">
        <div className="border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 select-none">
              <tr>
                <th className="py-2.5 px-2 text-center w-10 border-r border-slate-200">#</th>
                <th className="py-2.5 px-2 text-center w-10 border-r border-slate-200">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-slate-500 hover:text-blue-600"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600 inline" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 inline" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-3 w-24 border-r border-slate-200">Mã món</th>
                <th className="py-2.5 px-3 min-w-[220px] border-r border-slate-200">Tên món ăn</th>
                <th className="py-2.5 px-3 w-28 border-r border-slate-200">Bữa ăn</th>
                <th className="py-2.5 px-3 w-32 border-r border-slate-200">Phân loại</th>
                <th className="py-2.5 px-3 text-center w-28 border-r border-slate-200">Nguyên liệu</th>
                <th className="py-2.5 px-3 text-right w-24 border-r border-slate-200">Calo (Kcal)</th>
                <th className="py-2.5 px-3 text-right w-28 border-r border-slate-200">Đơn giá/suất</th>
                <th className="py-2.5 px-3 text-center w-36">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDishes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                    Không tìm thấy món ăn nào phù hợp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredDishes.map((dish, idx) => {
                  const isChecked = selectedIds.includes(dish.id);
                  return (
                    <tr
                      key={dish.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isChecked ? 'bg-blue-50/20' : idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                    >
                      <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectItem(dish.id)}
                          className="text-slate-500 hover:text-blue-600"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600 inline" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 inline" />
                          )}
                        </button>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-700 border-r border-slate-200">
                        {dish.code}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <div className="font-bold text-slate-900">{dish.name}</div>
                        {dish.allergenWarning && (
                          <div className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{dish.allergenWarning}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <span className="text-[10.5px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {dish.mealSessionLabel}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-700 border-r border-slate-200">
                        <span
                          className={`text-[10.5px] px-2 py-0.5 rounded font-bold ${
                            dish.category === 'mon_man'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : dish.category === 'mon_canh'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : dish.category === 'tinh_bot'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {dish.categoryLabel}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        <button
                          type="button"
                          onClick={() => setSelectedDishDetail(dish)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-[11px] underline"
                        >
                          <Utensils className="w-3 h-3" />
                          <span>{dish.ingredients.length} nguyên liệu</span>
                        </button>
                      </td>
                      <td className="py-2 px-3 text-right font-black text-slate-800 border-r border-slate-200">
                        {Math.round(dish.totalCalo)} Kcal
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 border-r border-slate-200">
                        {dish.totalCost.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedDishDetail(dish)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                            title="Xem công thức chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedDishDetail(dish)}
                            className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded"
                            title="Chỉnh sửa món ăn"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. MODAL CHI TIẾT CÔNG THỨC MÓN ĂN (DISH RECIPE DETAIL) */}
      {selectedDishDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CookingPot className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="font-bold text-sm block">
                    {selectedDishDetail.code} - {selectedDishDetail.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Phân loại: {selectedDishDetail.categoryLabel} • {selectedDishDetail.mealSessionLabel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDishDetail(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto text-xs">
              {/* Thẻ tóm tắt dinh dưỡng */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                <div>
                  <span className="text-slate-500 text-[10px] block">Năng lượng:</span>
                  <span className="font-black text-sm text-slate-800">
                    {selectedDishDetail.totalCalo} <span className="text-[10px] font-normal">Kcal</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Đạm (Protein):</span>
                  <span className="font-bold text-sm text-rose-600">
                    {selectedDishDetail.totalProtein}g
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Béo (Lipid):</span>
                  <span className="font-bold text-sm text-amber-600">
                    {selectedDishDetail.totalFat}g
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Giá 1 suất:</span>
                  <span className="font-black text-sm text-emerald-600">
                    {selectedDishDetail.totalCost.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              {/* Bảng nguyên liệu cấu thành */}
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-blue-600" />
                  Định lượng Nguyên liệu Cấu thành (trên 1 trẻ):
                </span>
                <table className="w-full text-left text-xs border border-slate-200 rounded">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Thực phẩm</th>
                      <th className="p-2 text-right">Định lượng (g)</th>
                      <th className="p-2 text-right">Đơn giá (đ/kg)</th>
                      <th className="p-2 text-right">Thành tiền</th>
                      <th className="p-2 text-right">Calo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDishDetail.ingredients.map((ing, i) => (
                      <tr key={i}>
                        <td className="p-2 font-medium text-slate-800">
                          {ing.foodName} <span className="text-[10px] text-slate-400">({ing.foodCode})</span>
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-blue-700">
                          {ing.gamPerChild} {ing.unit}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-600">
                          {ing.unitPrice.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-2 text-right font-mono font-semibold text-emerald-700">
                          {Math.round(ing.costPerChild).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-2 text-right font-mono text-slate-700">
                          {ing.caloPerChild}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quy trình chế biến */}
              {selectedDishDetail.cookingGuide && (
                <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200/80">
                  <span className="font-bold text-amber-900 block mb-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    Kỹ thuật sơ chế & chế biến bếp mầm non:
                  </span>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    {selectedDishDetail.cookingGuide}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDishDetail(null)}
                className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Đóng
              </button>
              {onApplyToMenu && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyToMenu(selectedDishDetail);
                    setSelectedDishDetail(null);
                  }}
                  className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Áp dụng vào Thực đơn ngày</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL THÊM MÓN ĂN MỚI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                Thêm món ăn mới vào Danh mục trường
              </span>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDish} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã món:</label>
                  <input
                    type="text"
                    required
                    value={newDishCode}
                    onChange={(e) => setNewDishCode(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white font-mono uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Tên món ăn:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: HT. Canh cua mồng tơi"
                    value={newDishName}
                    onChange={(e) => setNewDishName(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bữa ăn:</label>
                  <select
                    value={newDishSession}
                    onChange={(e) => setNewDishSession(e.target.value as DishMealSession)}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs bg-white"
                  >
                    <option value="trua">Bữa trưa</option>
                    <option value="sang">Bữa sáng</option>
                    <option value="chieu">Bữa chiều xế</option>
                    <option value="phu">Bữa phụ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phân loại món:</label>
                  <select
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value as DishCategory)}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs bg-white"
                  >
                    <option value="mon_man">Món mặn đạm</option>
                    <option value="mon_canh">Món canh rau</option>
                    <option value="mon_xao">Món xào</option>
                    <option value="tinh_bot">Cơm / Bún / Bánh mì</option>
                    <option value="sua_phu">Sữa & Bánh</option>
                    <option value="trang_mieng">Trái cây tráng miệng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quy trình & Hướng dẫn nấu:</label>
                <textarea
                  rows={3}
                  value={newDishGuide}
                  onChange={(e) => setNewDishGuide(e.target.value)}
                  placeholder="Ghi chú kỹ thuật sơ chế, độ băm nhỏ cho nhà trẻ, nhiệt độ sôi an toàn..."
                  className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Lưu món ăn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
