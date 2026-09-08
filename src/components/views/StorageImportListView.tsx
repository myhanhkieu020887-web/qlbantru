'use client';

import React, { useState } from 'react';
import { StorageDateGroup, StorageImportItem } from '../../types/storage';
import { formatCurrency, formatNumber } from '../../lib/utils';
import {
  Plus,
  Trash2,
  Search,
  Calendar,
  Eye,
  Edit2,
  ChevronDown,
  ChevronRight,
  MinusSquare,
  PlusSquare,
  Filter,
  Warehouse,
  Printer,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Building,
} from 'lucide-react';

interface Props {
  groups: StorageDateGroup[];
  onAddImport?: () => void;
  onDeleteItem?: (id: string) => void;
}

export const StorageImportListView: React.FC<Props> = ({
  groups: initialGroups,
  onAddImport,
  onDeleteItem,
}) => {
  const [dateGroups, setDateGroups] = useState<StorageDateGroup[]>(initialGroups);
  const [storageFilter, setStorageFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectedDetailItem, setSelectedDetailItem] = useState<StorageImportItem | null>(null);

  // Toggle Accordion mở/đóng từng ngày
  const toggleGroup = (date: string) => {
    setDateGroups((prev) =>
      prev.map((g) => (g.date === date ? { ...g, isExpanded: !g.isExpanded } : g))
    );
  };

  // Toggle chọn tất cả trong nhóm
  const toggleSelectAllInGroup = (items: StorageImportItem[]) => {
    const allSelected = items.every((it) => selectedItemIds.includes(it.id));
    if (allSelected) {
      setSelectedItemIds((prev) => prev.filter((id) => !items.some((it) => it.id === id)));
    } else {
      const idsToAdd = items.map((it) => it.id).filter((id) => !selectedItemIds.includes(id));
      setSelectedItemIds((prev) => [...prev, ...idsToAdd]);
    }
  };

  // Toggle chọn 1 món
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Tính tổng số mặt hàng và tổng tiền toàn bộ
  const totalAllItems = dateGroups.reduce((sum, g) => sum + g.items.length, 0);
  const totalAllAmount = dateGroups.reduce((sum, g) => sum + g.totalGroupAmount, 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden font-sans">
      {/* 1. THANH TIÊU ĐỀ & BỘ LỌC CHUẨN QLMN */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Phân Hệ Dinh Dưỡng - Quản Lý Nhập Kho Lưu Trữ
            </h1>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
              Gom nhóm theo ngày nhập
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Tổng cộng: <span className="font-bold text-slate-800">{totalAllItems} bản ghi</span> | Tổng giá trị lưu kho:{' '}
            <span className="font-bold text-emerald-700 font-mono">{formatCurrency(totalAllAmount)}</span>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAddImport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm</span>
          </button>
          <button
            disabled={selectedItemIds.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold shadow-xs transition-colors ${
              selectedItemIds.length > 0
                ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa ({selectedItemIds.length})</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-semibold"
          >
            <Printer className="w-4 h-4" />
            <span>In Phiếu</span>
          </button>
        </div>
      </div>

      {/* 2. DẢI BỘ LỌC ĐA TIÊU CHÍ (KHO LƯU, ĐIỂM TRƯỜNG, THỜI GIAN, TÌM KIẾM) */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Chọn Kho lưu */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-600">Kho lưu:</span>
            <select
              value={storageFilter}
              onChange={(e) => setStorageFilter(e.target.value)}
              className="border border-slate-300 rounded bg-white px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Tất cả kho</option>
              <option value="Kho trưa">Kho trưa</option>
              <option value="Kho sáng">Kho sáng</option>
              <option value="Kho phụ">Kho phụ</option>
            </select>
          </div>

          {/* Chọn Điểm trường */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-600">Điểm trường:</span>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="border border-slate-300 rounded bg-white px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Tất cả điểm</option>
              <option value="1">Điểm trường 1</option>
              <option value="2">Điểm trường 2</option>
            </select>
          </div>

          {/* Khoảng thời gian */}
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-slate-300 text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Thời gian:</span>
            <input
              type="date"
              defaultValue="2026-08-01"
              className="border-none p-0 text-xs focus:ring-0 text-slate-800"
            />
            <span className="text-slate-400">—</span>
            <input
              type="date"
              defaultValue="2026-09-30"
              className="border-none p-0 text-xs focus:ring-0 text-slate-800"
            />
          </div>
        </div>

        {/* Tìm kiếm */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tên thực phẩm hoặc mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 border border-slate-300 rounded bg-white text-xs focus:ring-1 focus:ring-emerald-500 w-56"
            />
          </div>
          <button className="px-3 py-1 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-900">
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* 3. BẢNG DỮ LIỆU GOM NHÓM THEO NGÀY (ACCORDION GROUP BY DATE) */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 select-none">
              <tr>
                <th className="p-2.5 w-10 text-center">
                  <span className="sr-only">Chọn</span>
                </th>
                <th className="p-2.5 w-12 text-center">STT</th>
                <th className="p-2.5">Tên thực phẩm</th>
                <th className="p-2.5 w-20 text-center">Mã</th>
                <th className="p-2.5 w-24">Kho lưu</th>
                <th className="p-2.5 w-20 text-right">Số lượng</th>
                <th className="p-2.5 w-24 text-right">Đơn giá</th>
                <th className="p-2.5 w-28 text-right">Thành tiền</th>
                <th className="p-2.5 w-24 text-center">Ngày nhập</th>
                <th className="p-2.5 w-52">Nhà cung cấp</th>
                <th className="p-2.5 w-16 text-center">ĐVT</th>
                <th className="p-2.5 w-24 text-center">Điểm trường</th>
                <th className="p-2.5 w-24 text-center">Chức năng</th>
                <th className="p-2.5 w-36">Cập nhật lúc</th>
              </tr>
            </thead>

            <tbody>
              {dateGroups.map((group) => {
                const groupSelected = group.items.every((it) => selectedItemIds.includes(it.id));
                return (
                  <React.Fragment key={group.date}>
                    {/* DÒNG HEADER GOM NHÓM NGÀY (ACCORDION) */}
                    <tr className="bg-slate-100/90 hover:bg-slate-200/80 border-y border-slate-300 font-bold text-slate-900 cursor-pointer transition-colors">
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectAllInGroup(group.items)}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          {groupSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td
                        colSpan={6}
                        onClick={() => toggleGroup(group.date)}
                        className="p-2 flex items-center gap-2 select-none"
                      >
                        {group.isExpanded ? (
                          <MinusSquare className="w-4 h-4 text-slate-600" />
                        ) : (
                          <PlusSquare className="w-4 h-4 text-emerald-600" />
                        )}
                        <span className="text-xs font-black tracking-tight text-slate-800">
                          {group.date}: {group.itemCount} (mặt hàng)
                        </span>
                      </td>
                      <td
                        onClick={() => toggleGroup(group.date)}
                        className="p-2 text-right font-mono font-black text-emerald-800 text-xs"
                      >
                        {formatNumber(group.totalGroupAmount, 0)} đ
                      </td>
                      <td colSpan={6} onClick={() => toggleGroup(group.date)} className="p-2 text-slate-400 font-normal italic">
                        {group.isExpanded ? 'Bấm để thu gọn' : 'Bấm để mở rộng chi tiết'}
                      </td>
                    </tr>

                    {/* CÁC DÒNG MẶT HÀNG CON TRONG NGÀY */}
                    {group.isExpanded &&
                      group.items.map((it, idx) => {
                        const isSelected = selectedItemIds.includes(it.id);
                        return (
                          <tr
                            key={it.id}
                            className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                              isSelected ? 'bg-emerald-50/40' : ''
                            }`}
                          >
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => toggleSelectItem(it.id)}
                                className="text-slate-600"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-slate-300" />
                                )}
                              </button>
                            </td>
                            <td className="p-2.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-800">{it.foodName}</td>
                            <td className="p-2.5 text-center font-mono text-slate-500 font-medium">
                              {it.foodCode || '-'}
                            </td>
                            <td className="p-2.5 text-slate-600">{it.storageLocation}</td>
                            <td className="p-2.5 text-right font-bold text-slate-900 font-mono">
                              {formatNumber(it.quantity, 1)}
                            </td>
                            <td className="p-2.5 text-right text-slate-600 font-mono">
                              {formatNumber(it.unitPrice, 0)}
                            </td>
                            <td className="p-2.5 text-right font-bold text-emerald-700 font-mono">
                              {formatNumber(it.totalPrice, 0)}
                            </td>
                            <td className="p-2.5 text-center text-slate-600">{it.importDate}</td>
                            <td className="p-2.5 text-slate-700 truncate max-w-xs" title={it.supplierName}>
                              {it.supplierName}
                            </td>
                            <td className="p-2.5 text-center font-semibold text-slate-700 bg-slate-50/60">
                              {it.unit}
                            </td>
                            <td className="p-2.5 text-center font-medium text-slate-600">
                              Điểm {it.branchId}
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDetailItem(it)}
                                  className="text-slate-500 hover:text-blue-600 transition-colors"
                                  title="Xem chi tiết"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  className="text-slate-500 hover:text-emerald-600 transition-colors"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {onDeleteItem && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteItem(it.id)}
                                    className="text-slate-500 hover:text-rose-600 transition-colors"
                                    title="Xóa"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-2.5 text-slate-400 font-mono text-[11px]">{it.updatedAt}</td>
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* FOOTER PHÂN TRANG CHUẨN QLMN */}
          <div className="bg-slate-50 px-6 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <select className="border border-slate-300 rounded px-2 py-0.5 bg-white text-xs">
                <option>Hiển thị 30 dòng</option>
                <option>Hiển thị 50 dòng</option>
                <option>Hiển thị 100 dòng</option>
              </select>
              <span>|</span>
              <div className="flex items-center gap-1">
                <button className="px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40">
                  |&lt;
                </button>
                <button className="px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40">
                  &lt;
                </button>
                <span className="px-2 font-medium">Trang 1 / 2</span>
                <button className="px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-100">
                  &gt;
                </button>
                <button className="px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-100">
                  &gt;|
                </button>
              </div>
            </div>
            <div>
              Hiển thị từ <span className="font-bold text-slate-800">1</span> tới{' '}
              <span className="font-bold text-slate-800">11</span> trong tổng số{' '}
              <span className="font-bold text-slate-800">46</span> bản ghi
            </div>
          </div>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT MẶT HÀNG LƯU KHO */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-emerald-400" />
                <span>Chi Tiết Mặt Hàng Lưu Kho</span>
              </h3>
              <button
                onClick={() => setSelectedDetailItem(null)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-2.5">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tên thực phẩm:</span>
                <span className="font-bold text-slate-900">{selectedDetailItem.foodName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Mã thực phẩm:</span>
                <span className="font-mono font-bold text-slate-800">{selectedDetailItem.foodCode || 'Chưa gán mã'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Kho lưu trữ:</span>
                <span className="font-semibold text-slate-800">{selectedDetailItem.storageLocation}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Số lượng nhập:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatNumber(selectedDetailItem.quantity, 1)} {selectedDetailItem.unit}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Đơn giá nhập:</span>
                <span className="font-mono text-slate-800">{formatNumber(selectedDetailItem.unitPrice, 0)} đ</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 font-bold">
                <span className="text-slate-700">Tổng thành tiền:</span>
                <span className="text-emerald-700 font-mono text-sm">{formatCurrency(selectedDetailItem.totalPrice)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Nhà cung cấp:</span>
                <span className="font-medium text-slate-800">{selectedDetailItem.supplierName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Điểm trường áp dụng:</span>
                <span className="font-medium text-slate-800">Điểm trường {selectedDetailItem.branchId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Thời gian ghi nhận:</span>
                <span className="font-mono text-slate-500">{selectedDetailItem.updatedAt}</span>
              </div>
              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className="px-4 py-1.5 bg-slate-800 text-white rounded font-bold hover:bg-slate-900"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
