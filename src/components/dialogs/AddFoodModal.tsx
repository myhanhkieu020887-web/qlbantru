'use client';

import React, { useState } from 'react';
import { FoodCategory, FoodItem, MealSession } from '../../types/nutrition';
import { STANDARD_FOOD_CATALOG } from '../../data/standard-foods';
import { Search, X, Plus, Check } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (food: FoodItem, session: MealSession, gam: number) => void;
}

const CATEGORY_TABS: { key: FoodCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'thit_ca', label: 'Thịt, Cá, Trứng' },
  { key: 'rau_cu', label: 'Rau, Củ, Quả' },
  { key: 'gao', label: 'Gạo, Bún, Ngũ cốc' },
  { key: 'dau_mo', label: 'Dầu ăn, Mỡ' },
  { key: 'gia_vi', label: 'Gia vị, Nước mắm' },
  { key: 'sua_banh', label: 'Sữa, Trái cây' },
];

export const AddFoodModal: React.FC<Props> = ({ isOpen, onClose, onAddFood }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [selectedSession, setSelectedSession] = useState<MealSession>('chinh_trua');
  const [portionGam, setPortionGam] = useState<number>(20);

  if (!isOpen) return null;

  const filteredFoods = STANDARD_FOOD_CATALOG.filter((f) => {
    const matchCat = selectedCategory === 'all' || f.category === selectedCategory;
    const matchSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAdd = (food: FoodItem) => {
    onAddFood(food, selectedSession, portionGam);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Thêm Thực phẩm vào Thực đơn</h3>
            <p className="text-xs text-blue-100">
              Tra cứu CSDL Viện Dinh Dưỡng Quốc Gia (500+ loại thực phẩm đã chuẩn hóa)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options: Bữa ăn & Định lượng */}
        <div className="p-3 bg-gray-50 border-b border-gray-200 grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Thêm vào Bữa ăn:</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value as MealSession)}
              className="w-full border border-gray-300 rounded-lg p-2 bg-white font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="chinh_trua">Bữa trưa chính</option>
              <option value="xe">Bữa xế chiều</option>
              <option value="phu_xe">Bữa phụ xế</option>
              <option value="sang">Bữa sáng</option>
              <option value="phu_trua">Bữa phụ trưa</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Định lượng khởi tạo (g/trẻ):</label>
            <input
              type="number"
              min="0.1"
              step="1"
              value={portionGam}
              onChange={(e) => setPortionGam(Math.max(0.1, parseFloat(e.target.value) || 1))}
              className="w-full border border-gray-300 rounded-lg p-2 font-mono font-bold text-right bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Search & Category Tabs */}
        <div className="p-3 border-b border-gray-200 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên thực phẩm (vd: cá, thịt heo, rau cải, gạo...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedCategory(tab.key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách thực phẩm */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-gray-100">
          {filteredFoods.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              Không tìm thấy thực phẩm phù hợp với từ khóa &quot;{searchTerm}&quot;
            </div>
          ) : (
            filteredFoods.map((food) => {
              const calo100g =
                Math.round((food.protein100g * 4 + food.fat100g * 9 + food.carbs100g * 4) * 10) / 10;

              return (
                <div
                  key={food.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50/50 transition-colors pt-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-xs">{food.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                        {food.unit}
                      </span>
                      {food.allergens && food.allergens.length > 0 && (
                        <span className="text-[9px] px-1 bg-red-100 text-red-700 rounded font-semibold">
                          Codex
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 space-x-2 font-mono">
                      <span>Đơn giá: <b className="text-gray-700">{formatCurrency(food.price)}</b></span>
                      <span>•</span>
                      <span>Calo/100g: <b className="text-orange-700">{calo100g} Kcal</b></span>
                      <span>•</span>
                      <span>P: {food.protein100g}g | L: {food.fat100g}g | G: {food.carbs100g}g</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdd(food)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
