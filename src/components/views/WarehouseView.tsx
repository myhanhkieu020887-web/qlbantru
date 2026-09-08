'use client';

import React, { useState } from 'react';
import {
  InventoryItem,
  StockTransaction,
  InventoryBatch,
  TransactionType,
  InventoryAuditReport,
  InventoryAuditItem,
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
  FileText,
  ClipboardCheck,
  Printer,
  Scale,
  Check,
} from 'lucide-react';

interface Props {
  inventoryItems: InventoryItem[];
  transactions: StockTransaction[];
  auditReports?: InventoryAuditReport[];
  onAddStockTransaction: (tx: Omit<StockTransaction, 'id' | 'transactionCode'>) => void;
  onApplyAuditAdjustment?: (report: InventoryAuditReport) => void;
  canManageWarehouse?: boolean;
}

export const WarehouseView: React.FC<Props> = ({
  inventoryItems,
  transactions,
  auditReports = [],
  onAddStockTransaction,
  onApplyAuditAdjustment,
  canManageWarehouse = true,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'transactions' | 'batches' | 'card' | 'audit'>('stock');
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

  // State Thẻ kho S12-H
  const [selectedCardFoodId, setSelectedCardFoodId] = useState<string>(inventoryItems[0]?.foodId || '');

  // State Kiểm kê C30-HD
  const [isNewAuditModalOpen, setIsNewAuditModalOpen] = useState<boolean>(false);
  const [auditLeader, setAuditLeader] = useState<string>('Phó Hiệu trưởng Nguyễn Thị Lan');
  const [auditAccountant, setAuditAccountant] = useState<string>('Kế toán viên Nguyễn Thị Mai');
  const [auditKeeper, setAuditKeeper] = useState<string>('Thủ kho Lê Văn Hưng');
  const [auditInspector, setAuditInspector] = useState<string>('Trưởng ban TTND Trần Văn Nam');
  const [auditNotes, setAuditNotes] = useState<string>('Kiểm kê định kỳ tháng 9/2026 kho thực phẩm khô bán trú.');
  const [auditItemValues, setAuditItemValues] = useState<Record<string, { actualQty: number; reason: string }>>(() => {
    const initial: Record<string, { actualQty: number; reason: string }> = {};
    inventoryItems.forEach((it) => {
      initial[it.foodId] = { actualQty: it.currentStock, reason: 'Khớp số lượng sổ sách' };
    });
    return initial;
  });

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

  // Tạo đợt kiểm kê mới
  const handleCreateAuditReport = (e: React.FormEvent) => {
    e.preventDefault();
    const auditItems: InventoryAuditItem[] = inventoryItems.map((it) => {
      const val = auditItemValues[it.foodId] || { actualQty: it.currentStock, reason: '' };
      const diff = val.actualQty - it.currentStock;
      return {
        foodId: it.foodId,
        foodName: it.foodName,
        unit: it.unit,
        bookQuantity: it.currentStock,
        actualQuantity: val.actualQty,
        difference: diff,
        unitPrice: it.averagePrice,
        diffAmount: diff * it.averagePrice,
        reason: val.reason,
        actionProposal:
          diff < 0
            ? 'Ghi giảm hao hụt định mức tự nhiên'
            : diff > 0
            ? 'Nhập tăng kiểm kê thừa'
            : 'Khớp số liệu kế toán',
      };
    });

    const newReport: InventoryAuditReport = {
      id: `audit_${Date.now()}`,
      auditCode: `KK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`,
      auditDate: new Date().toISOString().slice(0, 10),
      committeeLeader: auditLeader,
      accountant: auditAccountant,
      warehouseKeeper: auditKeeper,
      inspector: auditInspector,
      items: auditItems,
      notes: auditNotes,
      isApplied: false,
    };

    if (onApplyAuditAdjustment) {
      onApplyAuditAdjustment(newReport);
    }

    setIsNewAuditModalOpen(false);
  };

  // Dữ liệu cho Thẻ kho S12-H của mặt hàng được chọn
  const selectedCardItem = inventoryItems.find((it) => it.foodId === selectedCardFoodId) || inventoryItems[0];
  const cardTransactions = transactions
    .filter((tx) => tx.foodId === selectedCardItem?.foodId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Tính lũy kế tồn sau mỗi giao dịch
  let runningStock = 0;
  const cardRows = cardTransactions.map((tx) => {
    if (tx.type === 'IMPORT' || (tx.type === 'ADJUSTMENT' && tx.quantity > 0)) {
      runningStock += tx.quantity;
    } else {
      runningStock -= tx.quantity;
    }
    return {
      ...tx,
      stockAfter: runningStock,
    };
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* 1. THANH TIÊU ĐỀ & KPI TỔNG HỢP KHO BÁN TRÚ */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-emerald-600" />
            <h1 className="text-lg font-bold text-slate-900">
              Quản Lý Kho Bán Trú Mầm Non (FIFO & Kiểm Kê C30-HD)
            </h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-300">
              Thông tư 107/2017/TT-BTC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Nhập - Xuất - Tồn FIFO, Thẻ kho S12-H và Biên bản Kiểm kê Kho C30-HD chuẩn chế độ kế toán hành chính sự nghiệp
          </p>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2">
          {canManageWarehouse && (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Lập Phiếu Nhập Kho</span>
              </button>

              <button
                onClick={() => setIsNewAuditModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
              >
                <Scale className="w-4 h-4" />
                <span>Kiểm Kê Kho Định Kỳ</span>
              </button>
            </>
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
            <div className="text-[11px] font-medium text-slate-500">Lô hàng cận date (&lt;60 ngày)</div>
            <div className={`text-base font-bold ${nearExpiryBatches.length > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {nearExpiryBatches.length} lô cần xuất sớm
            </div>
          </div>
          <Clock className={`w-7 h-7 ${nearExpiryBatches.length > 0 ? 'text-rose-500' : 'text-slate-300'}`} />
        </div>
      </div>

      {/* 3. TABS CHUYỂN ĐỔI (5 SUBTABS CHUYÊN NGHIỆP) */}
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
            <span>Tồn Kho Tổng Hợp</span>
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
            <span>Lô Hàng FIFO</span>
          </button>

          <button
            onClick={() => setActiveSubTab('card')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'card'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Thẻ Kho (Mẫu S12-H)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'audit'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Kiểm Kê Kho (Mẫu C30-HD)</span>
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
            <span>Sổ Nhật Ký Nhập - Xuất</span>
          </button>
        </div>

        {/* Ô tìm kiếm khi ở tab tồn kho */}
        {activeSubTab === 'stock' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên mặt hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 w-48"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white"
            >
              <option value="all">Tất cả nhóm</option>
              <option value="gao">Gạo lương thực</option>
              <option value="dau_mo">Dầu mỡ tinh luyện</option>
              <option value="gia_vi">Gia vị & Hàng khô</option>
            </select>
          </div>
        )}
      </div>

      {/* 4. NỘI DUNG CHÍNH (5 SUBTABS) */}
      <div className="flex-1 overflow-auto p-6">
        {/* SUBTAB 1: THẺ KHO TỒN HIỆN TẠI */}
        {activeSubTab === 'stock' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
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
                  <th className="p-3 text-center w-28">Thao tác</th>
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
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedCardFoodId(item.foodId);
                            setActiveSubTab('card');
                          }}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline"
                        >
                          Xem Thẻ kho
                        </button>
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

        {/* SUBTAB 3: THẺ KHO CHI TIẾT (MẪU S12-H) */}
        {activeSubTab === 'card' && selectedCardItem && (
          <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-300 shadow-sm p-8 space-y-6">
            {/* Header Thẻ kho chuẩn TT 107/2017 */}
            <div className="flex justify-between items-start text-xs border-b border-slate-200 pb-4">
              <div>
                <div className="font-bold uppercase text-slate-800">Đơn vị: Trường Mầm Non Hàm Thắng</div>
                <div className="text-slate-500">Mã đơn vị có quan hệ với ngân sách: 1048291</div>
                <div className="text-slate-500">Địa chỉ: Hàm Thuận Bắc, Bình Thuận</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">Mẫu số: S12-H</div>
                <div className="text-[11px] text-slate-500 italic">
                  (Ban hành theo Thông tư số 107/2017/TT-BTC
                  <br />
                  ngày 10/10/2017 của Bộ Tài chính)
                </div>
              </div>
            </div>

            {/* Tiêu đề Thẻ kho */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight">THẺ KHO (SỔ KHO)</h2>
              <div className="text-xs text-slate-600 italic">Tháng 09/2026</div>
              <div className="flex justify-center items-center gap-6 text-xs pt-2 font-medium text-slate-700">
                <div>
                  Tên mặt hàng:{' '}
                  <select
                    value={selectedCardFoodId}
                    onChange={(e) => setSelectedCardFoodId(e.target.value)}
                    className="font-bold text-emerald-800 border-b border-emerald-500 bg-transparent px-1 focus:outline-none"
                  >
                    {inventoryItems.map((it) => (
                      <option key={it.foodId} value={it.foodId}>
                        {it.foodName} ({it.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div>Đơn vị tính: <span className="font-bold text-slate-900">{selectedCardItem.unit}</span></div>
                <div>Mã số: <span className="font-mono font-bold text-slate-900">{selectedCardItem.foodId}</span></div>
              </div>
            </div>

            {/* Nút in nhanh */}
            <div className="flex justify-end gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Thẻ Kho Mẫu S12-H (A4)</span>
              </button>
            </div>

            {/* Bảng chứng từ Thẻ kho S12-H */}
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                <tr>
                  <th rowSpan={2} className="p-2 border border-slate-300 w-12">STT</th>
                  <th colSpan={2} className="p-1 border border-slate-300">Chứng từ</th>
                  <th rowSpan={2} className="p-2 border border-slate-300">Diễn giải</th>
                  <th rowSpan={2} className="p-2 border border-slate-300 w-24">Ngày nhập xuất</th>
                  <th colSpan={3} className="p-1 border border-slate-300">Số lượng ({selectedCardItem.unit})</th>
                  <th rowSpan={2} className="p-2 border border-slate-300 w-20">Ký xác nhận</th>
                </tr>
                <tr>
                  <th className="p-1.5 border border-slate-300 w-24">Số hiệu</th>
                  <th className="p-1.5 border border-slate-300 w-24">Ngày tháng</th>
                  <th className="p-1.5 border border-slate-300 w-20 text-right">Nhập</th>
                  <th className="p-1.5 border border-slate-300 w-20 text-right">Xuất</th>
                  <th className="p-1.5 border border-slate-300 w-20 text-right">Tồn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-slate-50/60 font-semibold">
                  <td className="p-2 text-center border border-slate-300">-</td>
                  <td className="p-2 text-center border border-slate-300 font-mono">-</td>
                  <td className="p-2 text-center border border-slate-300">01/09/2026</td>
                  <td className="p-2 border border-slate-300 italic text-slate-700">Số dư đầu kỳ mang sang</td>
                  <td className="p-2 text-center border border-slate-300">01/09/2026</td>
                  <td className="p-2 text-right border border-slate-300">-</td>
                  <td className="p-2 text-right border border-slate-300">-</td>
                  <td className="p-2 text-right border border-slate-300 font-bold text-slate-900">
                    {formatNumber(selectedCardItem.currentStock, 1)}
                  </td>
                  <td className="p-2 text-center border border-slate-300"></td>
                </tr>
                {cardRows.map((row, rIdx) => {
                  const isImport = row.type === 'IMPORT' || (row.type === 'ADJUSTMENT' && row.quantity > 0);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="p-2 text-center border border-slate-300">{rIdx + 1}</td>
                      <td className="p-2 font-mono font-bold text-slate-800 border border-slate-300 text-center">
                        {row.transactionCode}
                      </td>
                      <td className="p-2 text-center border border-slate-300 text-slate-600">{row.date}</td>
                      <td className="p-2 border border-slate-300 text-slate-800">{row.reason}</td>
                      <td className="p-2 text-center border border-slate-300 text-slate-600">{row.date}</td>
                      <td className="p-2 text-right border border-slate-300 font-medium text-emerald-800">
                        {isImport ? formatNumber(row.quantity, 1) : '-'}
                      </td>
                      <td className="p-2 text-right border border-slate-300 font-medium text-blue-800">
                        {!isImport ? formatNumber(row.quantity, 1) : '-'}
                      </td>
                      <td className="p-2 text-right border border-slate-300 font-bold text-slate-900">
                        {formatNumber(row.stockAfter, 1)}
                      </td>
                      <td className="p-2 text-center border border-slate-300 text-[10px] text-slate-400">
                        Đã ký
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Chữ ký 2 bên */}
            <div className="grid grid-cols-2 text-center pt-8 text-xs font-semibold text-slate-800">
              <div>
                <div>Người ghi sổ</div>
                <div className="text-[10px] text-slate-400 italic font-normal">(Ký, họ tên)</div>
                <div className="h-16"></div>
                <div className="font-bold">Nguyễn Thị Mai</div>
              </div>
              <div>
                <div>Thủ kho</div>
                <div className="text-[10px] text-slate-400 italic font-normal">(Ký, họ tên)</div>
                <div className="h-16"></div>
                <div className="font-bold">Lê Văn Hưng</div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: BÁO CÁO KIỂM KÊ KHO & BIÊN BẢN C30-HD */}
        {activeSubTab === 'audit' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {auditReports.map((report) => (
              <div key={report.id} className="bg-white rounded-xl border border-slate-300 shadow-sm p-8 space-y-6">
                {/* Tiêu ngữ biên bản kiểm kê */}
                <div className="flex justify-between items-start text-xs border-b border-slate-200 pb-4">
                  <div>
                    <div className="font-bold uppercase text-slate-800">Đơn vị: Trường Mầm Non Hàm Thắng</div>
                    <div className="text-slate-500">Ban Kiểm Kê Tài Sản & Kho Bán Trú</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">Mẫu số: C30-HD</div>
                    <div className="text-[11px] text-slate-500 italic">
                      (Ban hành theo Thông tư số 107/2017/TT-BTC
                      <br />
                      ngày 10/10/2017 của Bộ Tài chính)
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight">
                    BIÊN BẢN KIỂM KÊ VẬT TƯ, CÔNG CỤ, HÀNG HÓA
                  </h2>
                  <div className="text-xs text-slate-600 italic">
                    Thời điểm kiểm kê: 08 giờ 00 ngày {report.auditDate} | Mã số: {report.auditCode}
                  </div>
                </div>

                {/* Hội đồng kiểm kê 4 thành viên */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold text-slate-800">I. THÀNH PHẦN HỘI ĐỒNG KIỂM KÊ:</div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 pl-3">
                    <div>1. Ông/Bà: <span className="font-bold">{report.committeeLeader}</span> - Trưởng ban</div>
                    <div>2. Ông/Bà: <span className="font-bold">{report.accountant}</span> - Kế toán viên</div>
                    <div>3. Ông/Bà: <span className="font-bold">{report.warehouseKeeper}</span> - Thủ kho</div>
                    <div>4. Ông/Bà: <span className="font-bold">{report.inspector}</span> - Thanh tra nhân dân</div>
                  </div>
                </div>

                {/* Bảng đối chiếu C30-HD */}
                <div>
                  <div className="font-bold text-slate-800 text-xs mb-2">II. KẾT QUẢ KIỂM KÊ ĐỐI CHIẾU SỔ SÁCH VỚI THỰC TẾ:</div>
                  <table className="w-full text-left text-xs border-collapse border border-slate-300">
                    <thead className="bg-slate-100 text-slate-800 font-bold text-center border-b border-slate-300">
                      <tr>
                        <th rowSpan={2} className="p-2 border border-slate-300 w-10">STT</th>
                        <th rowSpan={2} className="p-2 border border-slate-300">Tên vật tư, hàng hóa</th>
                        <th rowSpan={2} className="p-2 border border-slate-300 w-16">ĐVT</th>
                        <th colSpan={2} className="p-1 border border-slate-300">Số lượng</th>
                        <th colSpan={2} className="p-1 border border-slate-300">Chênh lệch</th>
                        <th rowSpan={2} className="p-2 border border-slate-300">Nguyên nhân & Đề xuất xử lý</th>
                      </tr>
                      <tr>
                        <th className="p-1.5 border border-slate-300 w-20 text-right">Theo sổ kế toán</th>
                        <th className="p-1.5 border border-slate-300 w-20 text-right">Thực tế kiểm đếm</th>
                        <th className="p-1.5 border border-slate-300 w-16 text-right">Thừa</th>
                        <th className="p-1.5 border border-slate-300 w-16 text-right">Thiếu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {report.items.map((it, idx) => (
                        <tr key={it.foodId} className="hover:bg-slate-50">
                          <td className="p-2 text-center border border-slate-300">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900 border border-slate-300">{it.foodName}</td>
                          <td className="p-2 text-center border border-slate-300 text-slate-600">{it.unit}</td>
                          <td className="p-2 text-right border border-slate-300 font-medium text-slate-800">
                            {formatNumber(it.bookQuantity, 1)}
                          </td>
                          <td className="p-2 text-right border border-slate-300 font-bold text-emerald-800">
                            {formatNumber(it.actualQuantity, 1)}
                          </td>
                          <td className="p-2 text-right border border-slate-300 text-blue-700 font-bold">
                            {it.difference > 0 ? formatNumber(it.difference, 1) : '-'}
                          </td>
                          <td className="p-2 text-right border border-slate-300 text-amber-700 font-bold">
                            {it.difference < 0 ? formatNumber(Math.abs(it.difference), 1) : '-'}
                          </td>
                          <td className="p-2 border border-slate-300 text-slate-600 text-[11px]">
                            <div>{it.reason}</div>
                            <div className="font-semibold text-indigo-700">{it.actionProposal}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Kết luận & Chữ ký */}
                <div className="text-xs text-slate-700 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold">III. KẾT LUẬN & KIẾN NGHỊ: </span>
                  <span>{report.notes} Toàn bộ chênh lệch hao hụt tự nhiên đã được lập phiếu điều chỉnh ghi giảm theo đúng định mức quy định tại Thông tư 107/2017/TT-BTC.</span>
                </div>

                <div className="grid grid-cols-4 text-center pt-8 text-xs font-semibold text-slate-800">
                  <div>
                    <div>Thủ kho</div>
                    <div className="text-[10px] text-slate-400 italic font-normal">(Ký, họ tên)</div>
                    <div className="h-16"></div>
                    <div className="font-bold">{report.warehouseKeeper}</div>
                  </div>
                  <div>
                    <div>Kế toán viên</div>
                    <div className="text-[10px] text-slate-400 italic font-normal">(Ký, họ tên)</div>
                    <div className="h-16"></div>
                    <div className="font-bold">{report.accountant}</div>
                  </div>
                  <div>
                    <div>Thanh tra nhân dân</div>
                    <div className="text-[10px] text-slate-400 italic font-normal">(Ký, họ tên)</div>
                    <div className="h-16"></div>
                    <div className="font-bold">{report.inspector}</div>
                  </div>
                  <div>
                    <div>Trưởng ban kiểm kê</div>
                    <div className="text-[10px] text-slate-400 italic font-normal">(Ký, đóng dấu)</div>
                    <div className="h-16"></div>
                    <div className="font-bold">{report.committeeLeader}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SUBTAB 5: NHẬT KÝ GIAO DỊCH NHẬP - XUẤT */}
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
                      ) : tx.type === 'ADJUSTMENT' ? (
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-200">
                          <Scale className="w-3 h-3" /> Điều chỉnh
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

      {/* MODAL 1: LẬP PHIẾU NHẬP KHO */}
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

      {/* MODAL 2: TẠO ĐỢT KIỂM KÊ KHO ĐỊNH KỲ (C30-HD) */}
      {isNewAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-indigo-700 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5" />
                <h3 className="font-bold text-sm">Lập Biên Bản Kiểm Kê Kho Thực Tế (Mẫu C30-HD)</h3>
              </div>
              <button
                onClick={() => setIsNewAuditModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateAuditReport} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trưởng ban kiểm kê:</label>
                  <input
                    type="text"
                    value={auditLeader}
                    onChange={(e) => setAuditLeader(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kế toán viên:</label>
                  <input
                    type="text"
                    value={auditAccountant}
                    onChange={(e) => setAuditAccountant(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thủ kho:</label>
                  <input
                    type="text"
                    value={auditKeeper}
                    onChange={(e) => setAuditKeeper(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thanh tra nhân dân:</label>
                  <input
                    type="text"
                    value={auditInspector}
                    onChange={(e) => setAuditInspector(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Bảng kiểm đếm số lượng thực tế từng mặt hàng:
                </label>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-10 text-center">STT</th>
                        <th className="p-2">Mặt hàng</th>
                        <th className="p-2 w-16 text-center">ĐVT</th>
                        <th className="p-2 w-24 text-right">Sổ sách</th>
                        <th className="p-2 w-28 text-right">Thực tế kiểm</th>
                        <th className="p-2 w-20 text-right">Lệch</th>
                        <th className="p-2">Lý do chênh lệch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventoryItems.map((it, idx) => {
                        const val = auditItemValues[it.foodId] || { actualQty: it.currentStock, reason: '' };
                        const diff = val.actualQty - it.currentStock;
                        return (
                          <tr key={it.foodId} className="hover:bg-slate-50">
                            <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-800">{it.foodName}</td>
                            <td className="p-2 text-center text-slate-600">{it.unit}</td>
                            <td className="p-2 text-right font-mono text-slate-700">{it.currentStock}</td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                step="0.1"
                                value={val.actualQty}
                                onChange={(e) => {
                                  const newQty = parseFloat(e.target.value) || 0;
                                  setAuditItemValues((prev) => ({
                                    ...prev,
                                    [it.foodId]: { ...prev[it.foodId], actualQty: newQty },
                                  }));
                                }}
                                className="w-20 border border-slate-300 rounded p-1 text-right font-bold focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2 text-right font-bold">
                              <span className={diff < 0 ? 'text-amber-600' : diff > 0 ? 'text-blue-600' : 'text-slate-400'}>
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Ghi chú nguyên nhân..."
                                value={val.reason}
                                onChange={(e) => {
                                  const r = e.target.value;
                                  setAuditItemValues((prev) => ({
                                    ...prev,
                                    [it.foodId]: { ...prev[it.foodId], reason: r },
                                  }));
                                }}
                                className="w-full border border-slate-300 rounded p-1 text-xs"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú & Kết luận của Hội đồng:</label>
                <textarea
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 rounded-md p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewAuditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác nhận & Tự Động Cân Bằng Kho</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
