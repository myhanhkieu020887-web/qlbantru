'use client';

import React, { useState, useMemo } from 'react';
import { MenuAdjustRecord } from '../../types/menu-adjust';
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
  RefreshCw,
  PhoneCall,
  Calendar,
  Filter,
  CheckSquare,
  Square,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface Props {
  records: MenuAdjustRecord[];
  onEditRecord: (record: MenuAdjustRecord) => void;
  onAddRecord?: (newRecord: Partial<MenuAdjustRecord>) => void;
  onDeleteRecords?: (ids: string[]) => void;
}

export const MenuAdjustListView: React.FC<Props> = ({
  records: initialRecords,
  onEditRecord,
  onAddRecord,
  onDeleteRecords,
}) => {
  const [records, setRecords] = useState<MenuAdjustRecord[]>(initialRecords);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('9/2026');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<number>(31);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Form state cho Modal tạo mới ngày CĐKP
  const [formDate, setFormDate] = useState<string>('2026-10-01');
  const [formStudentCount, setFormStudentCount] = useState<number>(1210);
  const [formMaugiao, setFormMaugiao] = useState<boolean>(true);
  const [formNhatre, setFormNhatre] = useState<boolean>(true);
  const [formAnsang, setFormAnsang] = useState<boolean>(true);
  const [formMealPrice, setFormMealPrice] = useState<string>('21000; 21000; 7000');

  // Lọc theo từ khóa tìm kiếm và tháng/năm
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        searchTerm.trim() === '' ||
        r.menuNamesDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.targetGroupsDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.date.includes(searchTerm);

      const [m, y] = selectedMonthYear.split('/');
      const formattedMonth = m.padStart(2, '0');
      const matchMonth = r.date.endsWith(`/${formattedMonth}/${y}`);

      return matchSearch && matchMonth;
    });
  }, [records, searchTerm, selectedMonthYear]);

  // Chọn/bỏ chọn tất cả checkbox
  const isAllSelected =
    filteredRecords.length > 0 && selectedIds.length === filteredRecords.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((r) => r.id));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Xóa các bản ghi đã chọn
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} ngày cân đối khẩu phần đã chọn?`)) {
      setRecords((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      if (onDeleteRecords) {
        onDeleteRecords(selectedIds);
      }
      setSelectedIds([]);
    }
  };

  // Xử lý nộp form tạo ngày CĐKP mới
  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = formDate.split('-');
    const displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;

    const groups: string[] = [];
    if (formNhatre) groups.push('Nhà trẻ');
    if (formMaugiao) groups.push('Mẫu giáo');
    if (formAnsang) groups.push('Ăn sáng');

    const menuTitles = groups.map((g) => (g === 'Ăn sáng' ? `SÁNG. ${displayDate}` : `TRƯA. ${displayDate}`)).join('; ');

    const newRec: MenuAdjustRecord = {
      id: `cdkp_${formDate.replace(/-/g, '_')}`,
      stt: records.length + 1,
      date: displayDate,
      rawDate: formDate,
      targetGroups: groups,
      targetGroupsDisplay: groups.join(' ; '),
      menuNamesDisplay: menuTitles,
      studentCount: formStudentCount,
      mealPricesDisplay: formMealPrice,
      createdAt: new Date().toLocaleString('vi-VN'),
      updatedAt: new Date().toLocaleString('vi-VN'),
      status: 'DRAFT',
    };

    setRecords([newRec, ...records]);
    if (onAddRecord) {
      onAddRecord(newRec);
    }
    setIsAddModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden text-slate-800">
      {/* 1. THANH CÔNG CỤ LỌC & THAO TÁC (Chuẩn giao diện qlmn.vn) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          {/* Ô tìm kiếm tên món ăn */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tên món ăn"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 sm:w-60 pl-8 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Bộ lọc Tháng/năm */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-600 font-medium">Tháng/năm</span>
            <select
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1.5 text-xs bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="9/2026">9/2026</option>
              <option value="8/2026">8/2026</option>
              <option value="10/2026">10/2026</option>
            </select>
          </div>
        </div>

        {/* Cụm nút thao tác */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cân đối thực đơn ngày</span>
          </button>

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

      {/* 2. BẢNG DỮ LIỆU CHÍNH (10 CỘT CHUẨN QLMN) */}
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
                <th className="py-2.5 px-3 w-28 border-r border-slate-200">Ngày</th>
                <th className="py-2.5 px-3 w-48 border-r border-slate-200">Nhóm trẻ</th>
                <th className="py-2.5 px-3 min-w-[220px] border-r border-slate-200">Tên thực đơn theo nhóm trẻ</th>
                <th className="py-2.5 px-3 text-right w-20 border-r border-slate-200">Số trẻ</th>
                <th className="py-2.5 px-3 w-36 border-r border-slate-200">Tiền ăn</th>
                <th className="py-2.5 px-3 text-center w-24 border-r border-slate-200">Sửa CĐKP</th>
                <th className="py-2.5 px-3 w-36 border-r border-slate-200">Tạo CĐKP lúc</th>
                <th className="py-2.5 px-3 w-36">Cập nhật lúc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                    Không tìm thấy bản ghi cân đối khẩu phần nào trong tháng {selectedMonthYear}.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const isChecked = selectedIds.includes(r.id);
                  return (
                    <tr
                      key={r.id}
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
                          onClick={() => handleToggleSelectItem(r.id)}
                          className="text-slate-500 hover:text-blue-600"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600 inline" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 inline" />
                          )}
                        </button>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-200">
                        {r.date}
                      </td>
                      <td className="py-2 px-3 text-slate-700 border-r border-slate-200">
                        {r.targetGroupsDisplay}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px] border-r border-slate-200">
                        {r.menuNamesDisplay}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-slate-900 border-r border-slate-200">
                        {r.studentCount.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2 px-3 text-slate-700 font-mono text-[11px] border-r border-slate-200">
                        {r.mealPricesDisplay}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200">
                        <button
                          type="button"
                          onClick={() => onEditRecord(r)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold shadow-2xs transition-colors"
                          title={`Mở Lưới 13 cột điều chỉnh ngày ${r.date}`}
                        >
                          <Pencil className="w-3 h-3 text-amber-700" />
                          <span>Sửa</span>
                        </button>
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] border-r border-slate-200">
                        {r.createdAt}
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {r.updatedAt}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. THANH PHÂN TRANG FOOTER CHUẨN QLMN */}
      <div className="bg-white border-t border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-600 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-slate-300 rounded px-1.5 py-0.5 text-xs bg-white font-medium"
            >
              <option value={31}>31</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Điều hướng trang */}
          <div className="flex items-center gap-1">
            <button className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-40" disabled>
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-40" disabled>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px]">Trang</span>
            <input
              type="text"
              readOnly
              value={currentPage}
              className="w-7 text-center border border-slate-300 rounded py-0.5 text-[11px] font-bold bg-white"
            />
            <span className="px-1 text-[11px]">/ 1</span>
            <button className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-40" disabled>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-40" disabled>
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setRecords(initialRecords);
              }}
              title="Làm mới"
              className="p-1 hover:bg-slate-100 rounded text-slate-500 ml-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-slate-500">
            Hiển thị từ 1 tới {filteredRecords.length} trong tổng số {filteredRecords.length} bản ghi
          </span>
          <div className="flex items-center gap-1 font-bold text-rose-600">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Hotline 1900 0101</span>
          </div>
        </div>
      </div>

      {/* 4. MODAL TẠO MỚI NGÀY CÂN ĐỐI THỰC ĐƠN */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                Tạo mới ngày Cân đối thực đơn
              </span>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNew} className="p-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chọn ngày ăn:</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhóm trẻ áp dụng:</label>
                <div className="flex items-center gap-4 py-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formNhatre}
                      onChange={(e) => setFormNhatre(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Nhà trẻ</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formMaugiao}
                      onChange={(e) => setFormMaugiao(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Mẫu giáo</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAnsang}
                      onChange={(e) => setFormAnsang(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Ăn sáng</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tổng số trẻ ăn:</label>
                  <input
                    type="number"
                    min={1}
                    value={formStudentCount}
                    onChange={(e) => setFormStudentCount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức tiền ăn (VNĐ):</label>
                  <input
                    type="text"
                    value={formMealPrice}
                    onChange={(e) => setFormMealPrice(e.target.value)}
                    placeholder="21000; 21000; 7000"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
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
                  Khởi tạo CĐKP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
