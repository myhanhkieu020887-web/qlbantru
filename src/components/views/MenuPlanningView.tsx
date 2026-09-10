'use client';

import React, { useState, useMemo } from 'react';
import { MenuTemplateItem } from '../../types/menu-template';
import {
  Search,
  PlusCircle,
  Trash2,
  Settings,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  CheckSquare,
  Square,
  X,
  BookOpenCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface Props {
  templates: MenuTemplateItem[];
  onApplyTemplateToDate: (template: MenuTemplateItem, targetDate: string) => void;
  onDeleteTemplates?: (ids: string[]) => void;
  onAddTemplate?: (newTemplate: MenuTemplateItem) => void;
}

export const MenuPlanningView: React.FC<Props> = ({
  templates: initialTemplates,
  onApplyTemplateToDate,
  onDeleteTemplates,
  onAddTemplate,
}) => {
  const [templates, setTemplates] = useState<MenuTemplateItem[]>(initialTemplates);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTemplateForDetail, setSelectedTemplateForDetail] = useState<MenuTemplateItem | null>(null);
  const [selectedTemplateForApply, setSelectedTemplateForApply] = useState<MenuTemplateItem | null>(null);
  const [applyTargetDate, setApplyTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pageSize, setPageSize] = useState<number>(31);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Lọc danh sách thực đơn mẫu
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchSearch =
        searchTerm.trim() === '' ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.dishes.some((d) => d.dishName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchAge =
        filterAgeGroup === 'all' ||
        t.ageGroup === filterAgeGroup;

      return matchSearch && matchAge;
    });
  }, [templates, searchTerm, filterAgeGroup]);

  // Checkbox chọn nhiều
  const isAllSelected =
    filteredTemplates.length > 0 && selectedIds.length === filteredTemplates.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTemplates.map((t) => t.id));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} thực đơn mẫu đã chọn?`)) {
      setTemplates((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
      if (onDeleteTemplates) {
        onDeleteTemplates(selectedIds);
      }
      setSelectedIds([]);
    }
  };

  const handleConfirmApply = () => {
    if (!selectedTemplateForApply) return;
    onApplyTemplateToDate(selectedTemplateForApply, applyTargetDate);
    setSelectedTemplateForApply(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden text-slate-800">
      {/* 1. THANH CÔNG CỤ LỌC & THAO TÁC CHUẨN QLMN (menu_planning/list) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tên hoặc mã thực đơn mẫu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Lọc Nhóm tuổi */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-600 font-medium">Nhóm tuổi:</span>
            <select
              value={filterAgeGroup}
              onChange={(e) => setFilterAgeGroup(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1.5 text-xs bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả nhóm tuổi</option>
              <option value="maugiao">Mẫu giáo (3 - 6 tuổi)</option>
              <option value="nhatre">Nhà trẻ (18 - 36 tháng)</option>
              <option value="ansang">Bữa ăn sáng</option>
            </select>
          </div>
        </div>

        {/* Nút thao tác */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
              selectedIds.length > 0
                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
          </button>

          <button
            type="button"
            title="Cài đặt hiển thị cột"
            className="p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. BẢNG DANH MỤC THỰC ĐƠN MẪU CHUẨN QLMN */}
      <div className="flex-1 overflow-auto bg-white p-3">
        <div className="border border-slate-200 rounded shadow-xs overflow-hidden">
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
                <th className="py-2.5 px-3 w-28 border-r border-slate-200">Mã mẫu</th>
                <th className="py-2.5 px-3 min-w-[220px] border-r border-slate-200">Tên thực đơn mẫu</th>
                <th className="py-2.5 px-2.5 w-28 border-r border-slate-200">Nhóm tuổi</th>
                <th className="py-2.5 px-3 min-w-[240px] border-r border-slate-200">Món ăn cấu thành</th>
                <th className="py-2.5 px-2 text-right w-20 border-r border-slate-200">Năng lượng</th>
                <th className="py-2.5 px-2 text-center w-28 border-r border-slate-200">Cơ cấu P-L-G</th>
                <th className="py-2.5 px-2.5 text-right w-24 border-r border-slate-200">Tiền/suất</th>
                <th className="py-2.5 px-2 text-center w-16 border-r border-slate-200">Lượng</th>
                <th className="py-2.5 px-2 text-center w-16 border-r border-slate-200">Chất</th>
                <th className="py-2.5 px-3 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 italic">
                    Không tìm thấy thực đơn mẫu nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((t, idx) => {
                  const isChecked = selectedIds.includes(t.id);
                  const isMG = t.ageGroup === 'maugiao';
                  const isNT = t.ageGroup === 'nhatre';

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-blue-50/50 transition-colors ${
                        isChecked ? 'bg-blue-50/30' : idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectItem(t.id)}
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
                        {t.code}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-200">
                        {t.name}
                        {t.note && (
                          <p className="text-[10px] text-slate-400 font-normal italic line-clamp-1">{t.note}</p>
                        )}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            isMG
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : isNT
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {isMG ? 'Mẫu giáo' : isNT ? 'Nhà trẻ' : 'Ăn sáng'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-700 border-r border-slate-200 text-[11px]">
                        <div className="flex flex-wrap gap-1">
                          {t.dishes.map((d, dIdx) => (
                            <span
                              key={dIdx}
                              className="inline-block px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10.5px] border border-slate-200"
                            >
                              {d.dishName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                        {t.calo.toFixed(1)}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-700 border-r border-slate-200">
                        <span className="text-rose-700 font-bold">{t.proteinPct.toFixed(1)}</span> :{' '}
                        <span className="text-amber-700 font-bold">{t.fatPct.toFixed(1)}</span> :{' '}
                        <span className="text-emerald-700 font-bold">{t.carbsPct.toFixed(1)}</span>
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-800 border-r border-slate-200">
                        {t.mealPrice.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                            t.isQuantityPass
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-rose-50 text-rose-700 border-rose-300'
                          }`}
                        >
                          {t.isQuantityPass ? 'ĐẠT' : 'CHƯA'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                            t.isQualityPass
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-rose-50 text-rose-700 border-rose-300'
                          }`}
                        >
                          {t.isQualityPass ? 'ĐẠT' : 'CHƯA'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedTemplateForApply(t)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-2xs transition-colors"
                            title="Nạp thực đơn mẫu này vào ngày ăn thực tế"
                          >
                            <span>Áp dụng</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTemplateForDetail(t)}
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="Xem chi tiết phân tích dinh dưỡng"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

      {/* 3. MODAL XEM CHI TIẾT THỰC ĐƠN MẪU */}
      {selectedTemplateForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col">
            <div className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">Chi tiết Thực đơn mẫu: {selectedTemplateForDetail.code}</h3>
              </div>
              <button
                onClick={() => setSelectedTemplateForDetail(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-800 text-sm">{selectedTemplateForDetail.name}</span>
                <p className="text-slate-500 mt-0.5">{selectedTemplateForDetail.note}</p>
              </div>

              {/* Thẻ chỉ số dinh dưỡng */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center font-mono">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-sans">Năng lượng</span>
                  <strong className="text-blue-900 text-sm">{selectedTemplateForDetail.calo} Kcal</strong>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-rose-600 block font-sans">Đạm (%P)</span>
                  <strong className="text-rose-700 text-sm">{selectedTemplateForDetail.proteinPct}%</strong>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-amber-600 block font-sans">Béo (%L)</span>
                  <strong className="text-amber-700 text-sm">{selectedTemplateForDetail.fatPct}%</strong>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-emerald-600 block font-sans">Đường (%G)</span>
                  <strong className="text-emerald-700 text-sm">{selectedTemplateForDetail.carbsPct}%</strong>
                </div>
              </div>

              {/* Danh sách món ăn */}
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Món ăn trong thực đơn:</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded">
                  {selectedTemplateForDetail.dishes.map((d, i) => (
                    <div key={i} className="py-1.5 px-3 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-800">{d.dishName}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{d.mealSession}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTemplateForDetail(null)}
                className="px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL ÁP DỤNG THỰC ĐƠN MẪU VÀO NGÀY ĂN */}
      {selectedTemplateForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col">
            <div className="bg-blue-800 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-300" />
                <h3 className="font-bold text-sm">Áp dụng Thực đơn mẫu vào ngày ăn</h3>
              </div>
              <button
                onClick={() => setSelectedTemplateForApply(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="bg-blue-50 p-2.5 rounded border border-blue-200">
                <span className="font-bold text-blue-950 block">{selectedTemplateForApply.name}</span>
                <span className="text-[11px] text-blue-800 font-mono">
                  Mã: {selectedTemplateForApply.code} | Calo: {selectedTemplateForApply.calo} Kcal | Giá: {selectedTemplateForApply.mealPrice.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn ngày ăn cần áp dụng:</label>
                <input
                  type="date"
                  value={applyTargetDate}
                  onChange={(e) => setApplyTargetDate(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Toàn bộ danh sách món ăn và định lượng mẫu sẽ được nạp tự động vào Lưới Kế toán & Dinh dưỡng của ngày đã chọn.
              </p>
            </div>

            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedTemplateForApply(null)}
                className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmApply}
                className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
              >
                Xác nhận Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
