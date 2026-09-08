'use client';

import React, { useState } from 'react';
import {
  InventoryItem,
  StockTransaction,
  InventoryBatch,
  TransactionType,
} from '../../types/inventory';
import { formatCurrency, formatNumber } from '../../lib/utils';
import {
  Package,
  Layers,
  AlertTriangle,
  Clock,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Warehouse,
  History,
  Info,
} from 'lucide-react';

interface Props {
  inventoryItems: InventoryItem[];
  transactions: StockTransaction[];
  onAddStockTransaction: (tx: Omit<StockTransaction, 'id' | 'transactionCode'>) => void;
  canManageWarehouse?: boolean;
}

export const WarehouseView: React.FC<Props> = ({
  inventoryItems,
  transactions,
  onAddStockTransaction,
  canManageWarehouse = true,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'transactions' | 'batches'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form state nhập kho
  const [selectedFoodId, setSelectedFoodId] = useState(inventoryItems[0]?.foodId || '');
  const [importQty, setImportQty] = useState<number>(10);
  const [importPrice, setImportPrice] = useState<number>(25000);
  const [importBatchCode, setImportBatchCode] = useState<string>(`LO-${Date.now().toString().slice(-6)}`);
  const [importExpiry, setImportExpiry] = useState<string>('2027-09-01');
  const [importSupplier, setImportSupplier] = useState<string>('Công ty TNHH Bách Hóa Xanh');
  const [importReason, setImportReason] = useState<string>('Nhập bổ sung kho dự trữ bán trú');

  // Thống kê KPI Kho
  const totalStockValue = inventoryItems.reduce(
    (sum, it) => sum + it.currentStock * it.averagePrice,
    0
  );
  const lowStockCount = inventoryItems.filter(
    (it) => it.currentStock <= it.minStockAlert
  ).length;

  // Lọc các lô cận date (< 60 ngày)
  const now = new Date();
  const nearExpiryBatches = inventoryItems.flatMap((it) =>
    it.batches.filter((b) => {
      const exp = new Date(b.expiryDate);
      const diffDays = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 60 && diffDays > 0;
    })
  );

  // Lọc danh sách hiển thị
  const filteredItems = inventoryItems.filter((it) => {
    const matchSearch =
      it.foodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.foodId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'all' || it.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleCreateImport = (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventoryItems.find((it) => it.foodId === selectedFoodId);
    if (!item) return;

    onAddStockTransaction({
      date: new Date().toISOString().split('T')[0],
      type: 'IMPORT',
      foodId: item.foodId,
      foodName: item.foodName,
      unit: item.unit,
      quantity: importQty,
      unitPrice: importPrice,
      totalAmount: importQty * importPrice,
      batchId: importBatchCode,
      reason: importReason,
      performer: 'Kế toán kho bán trú',
    });

    setIsImportModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* 1. THANH TIÊU ĐỀ & KPI TỔNG HỢP KHO BÁN TRÚ */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-emerald-600" />
            <h1 className="text-lg font-bold text-slate-900">
              Quản Lý Kho Bán Trú Mầm Non (Thực Phẩm Khô, Gạo, Dầu Ăn, Gia Vị)
            </h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-300">
              Nguyên tắc FIFO
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi Nhập - Xuất - Tồn, tự động trừ tồn kho theo Thực đơn ngày đã duyệt (QĐ 2195 & TT 107/2017)
          </p>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2">
          {canManageWarehouse && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Lập Phiếu Nhập Kho</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. DẢI KPI CHỈ SỐ NHANH */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 px-6 py-3 bg-slate-100/70 border-b border-slate-200">
        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Tổng giá trị tồn kho</div>
            <div className="text-base font-bold text-emerald-700">
              {formatCurrency(totalStockValue)}
            </div>
          </div>
          <Package className="w-7 h-7 text-emerald-500/30" />
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Mặt hàng trong kho</div>
            <div className="text-base font-bold text-slate-800">
              {inventoryItems.length} mặt hàng
            </div>
          </div>
          <Layers className="w-7 h-7 text-blue-500/30" />
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Cảnh báo tồn tối thiểu</div>
            <div className={`text-base font-bold ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {lowStockCount} mặt hàng thiếu
            </div>
          </div>
          <AlertTriangle className={`w-7 h-7 ${lowStockCount > 0 ? 'text-amber-500' : 'text-slate-300'}`} />
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Lô hàng cận hạn dùng (&lt;60 ngày)</div>
            <div className={`text-base font-bold ${nearExpiryBatches.length > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {nearExpiryBatches.length} lô cần xuất sớm
            </div>
          </div>
          <Clock className={`w-7 h-7 ${nearExpiryBatches.length > 0 ? 'text-rose-500' : 'text-slate-300'}`} />
        </div>
      </div>

      {/* 3. TABS CHUYỂN ĐỔI & BỘ LỌC TÌM KIẾM */}
      <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveSubTab('stock')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'stock'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Thẻ Kho Nhập - Xuất - Tồn</span>
          </button>

          <button
            onClick={() => setActiveSubTab('batches')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'batches'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Danh Sách Lô Hàng (FIFO & Date)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'transactions'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Sổ Nhật Ký Nhập - Xuất ({transactions.length})</span>
          </button>
        </div>

        {/* Ô tìm kiếm & Lọc nhóm */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên mặt hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Tất cả nhóm</option>
            <option value="gao">Gạo & Lương thực</option>
            <option value="dau_mo">Dầu mỡ tinh luyện</option>
            <option value="gia_vi">Gia vị & Hàng khô</option>
          </select>
        </div>
      </div>

      {/* 4. NỘI DUNG CHÍNH (BẢNG DỮ LIỆU) */}
      <div className="flex-1 overflow-auto p-6">
        {/* SUBTAB 1: THẺ KHO TỒN HIỆN TẠI */}
        {activeSubTab === 'stock' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 select-none">
                <tr>
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Tên mặt hàng kho</th>
                  <th className="p-3 w-28">Nhóm thực phẩm</th>
                  <th className="p-3 w-20 text-center">ĐVT</th>
                  <th className="p-3 w-28 text-right">Tồn kho hiện tại</th>
                  <th className="p-3 w-28 text-right">Ngưỡng tối thiểu</th>
                  <th className="p-3 w-32 text-right">Đơn giá BQ (đ)</th>
                  <th className="p-3 w-36 text-right">Tổng giá trị (đ)</th>
                  <th className="p-3 w-32 text-center">Tình trạng kho</th>
                  <th className="p-3 text-center w-24">Số lô FIFO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, idx) => {
                  const isLow = item.currentStock <= item.minStockAlert;
                  const itemValue = item.currentStock * item.averagePrice;
                  return (
                    <tr key={item.foodId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-800">
                        <div>{item.foodName}</div>
                        {item.notes && <div className="text-[10px] text-slate-400 font-normal">{item.notes}</div>}
                      </td>
                      <td className="p-3 text-slate-600 capitalize">
                        {item.category === 'gao'
                          ? 'Gạo lương thực'
                          : item.category === 'dau_mo'
                          ? 'Dầu mỡ'
                          : 'Gia vị đóng gói'}
                      </td>
                      <td className="p-3 text-center font-medium text-slate-700 bg-slate-50/50">
                        {item.unit}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        <span className={`px-2 py-0.5 rounded ${isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                          {formatNumber(item.currentStock, 1)}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-500 font-medium">
                        {formatNumber(item.minStockAlert, 1)}
                      </td>
                      <td className="p-3 text-right text-slate-700 font-mono">
                        {formatNumber(item.averagePrice, 0)} đ
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700 font-mono">
                        {formatCurrency(itemValue)}
                      </td>
                      <td className="p-3 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Cần nhập thêm
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> An toàn
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700">
                        <span className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                          {item.batches.length} lô
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB 2: CÁC LÔ HÀNG CHI TIẾT (FIFO) */}
        {activeSubTab === 'batches' && (
          <div className="space-y-4">
            {filteredItems.map((it) => (
              <div key={it.foodId} className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 text-sm">{it.foodName}</span>
                    <span className="text-xs text-slate-500 font-medium">({it.unit})</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700">
                    Tổng tồn:{' '}
                    <span className="text-emerald-700 font-bold">
                      {formatNumber(it.currentStock, 1)} {it.unit}
                    </span>
                  </div>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-36">Mã lô hàng</th>
                      <th className="p-2.5 w-28">Ngày nhập</th>
                      <th className="p-2.5 w-28 text-right">Số lượng nhập</th>
                      <th className="p-2.5 w-28 text-right">Còn lại trong lô</th>
                      <th className="p-2.5 w-28 text-right">Đơn giá nhập</th>
                      <th className="p-2.5 w-32 text-center">Hạn sử dụng</th>
                      <th className="p-2.5">Nhà cung cấp</th>
                      <th className="p-2.5 w-32 text-center">Thứ tự xuất (FIFO)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {it.batches.map((batch, bIdx) => {
                      const exp = new Date(batch.expiryDate);
                      const isNearExp = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24) <= 60;
                      return (
                        <tr key={batch.batchId} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold text-slate-800">{batch.batchCode}</td>
                          <td className="p-2.5 text-slate-600">{batch.importDate}</td>
                          <td className="p-2.5 text-right font-medium text-slate-600">
                            {formatNumber(batch.initialQuantity, 1)}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-700">
                            {formatNumber(batch.remainingQuantity, 1)}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-700">
                            {formatNumber(batch.unitPrice, 0)} đ
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                isNearExp
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {batch.expiryDate}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-700">{batch.supplierName}</td>
                          <td className="p-2.5 text-center">
                            {bIdx === 0 ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                                Ưu tiên xuất trước #1
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">
                                Lô chờ #{bIdx + 1}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* SUBTAB 3: NHẬT KÝ GIAO DỊCH NHẬP - XUẤT */}
        {activeSubTab === 'transactions' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-32">Mã phiếu</th>
                  <th className="p-3 w-28">Ngày</th>
                  <th className="p-3 w-28 text-center">Loại giao dịch</th>
                  <th className="p-3">Mặt hàng</th>
                  <th className="p-3 w-24 text-right">Số lượng</th>
                  <th className="p-3 w-28 text-right">Đơn giá</th>
                  <th className="p-3 w-32 text-right">Thành tiền</th>
                  <th className="p-3">Lý do & Diễn giải</th>
                  <th className="p-3 w-36">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-800">{tx.transactionCode}</td>
                    <td className="p-3 text-slate-600">{tx.date}</td>
                    <td className="p-3 text-center">
                      {tx.type === 'IMPORT' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                          <ArrowDownLeft className="w-3 h-3" /> Nhập kho
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
                          <ArrowUpRight className="w-3 h-3" /> Xuất thực đơn
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{tx.foodName}</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatNumber(tx.quantity, 1)} {tx.unit}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {formatNumber(tx.unitPrice, 0)} đ
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-800 font-mono">
                      {formatCurrency(tx.totalAmount)}
                    </td>
                    <td className="p-3 text-slate-600">{tx.reason}</td>
                    <td className="p-3 text-slate-500">{tx.performer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL LẬP PHIẾU NHẬP KHO */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-700 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Lập Phiếu Nhập Kho Dự Trữ Bán Trú</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateImport} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mặt hàng nhập kho:</label>
                <select
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {inventoryItems.map((it) => (
                    <option key={it.foodId} value={it.foodId}>
                      {it.foodName} ({it.unit}) - Tồn hiện tại: {it.currentStock} {it.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số lượng nhập:</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={importQty}
                    onChange={(e) => setImportQty(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-md p-2 font-bold focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn giá nhập (VNĐ):</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={importPrice}
                    onChange={(e) => setImportPrice(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-md p-2 font-bold focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã lô hàng (Batch Code):</label>
                  <input
                    type="text"
                    value={importBatchCode}
                    onChange={(e) => setImportBatchCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hạn sử dụng (Expiry Date):</label>
                  <input
                    type="date"
                    value={importExpiry}
                    onChange={(e) => setImportExpiry(e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhà cung cấp:</label>
                <input
                  type="text"
                  value={importSupplier}
                  onChange={(e) => setImportSupplier(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do nhập kho:</label>
                <input
                  type="text"
                  value={importReason}
                  onChange={(e) => setImportReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2"
                  required
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-semibold">Tổng giá trị lô nhập:</span>
                <span className="text-sm font-bold text-emerald-700">
                  {formatCurrency(importQty * importPrice)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold shadow-xs"
                >
                  Xác nhận Nhập kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
