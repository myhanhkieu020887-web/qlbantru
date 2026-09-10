'use client';

import React, { useState } from 'react';
import {
  Building2,
  FileCheck2,
  Receipt,
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import {
  SupplierContract,
  SupplierDeliveryNote,
  SupplierMonthlyReconciliation,
  SupplierPaymentVoucher,
} from '@/types/supplier-invoice';
import { formatCurrency } from '@/lib/utils';

interface SupplierListViewProps {
  contracts: SupplierContract[];
  deliveryNotes: SupplierDeliveryNote[];
  reconciliations: SupplierMonthlyReconciliation[];
  paymentVouchers: SupplierPaymentVoucher[];
  onAddContract?: () => void;
  onAddDeliveryNote?: () => void;
  onCreateReconciliation?: (supplierId: string) => void;
  onCreatePaymentVoucher?: (recId: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const SupplierListView: React.FC<SupplierListViewProps> = ({
  contracts,
  deliveryNotes,
  reconciliations,
  paymentVouchers,
  onAddContract,
  onAddDeliveryNote,
  onCreateReconciliation,
  onCreatePaymentVoucher,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'contracts' | 'delivery' | 'reconciliation' | 'payments'>('contracts');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<SupplierContract | null>(null);

  // Thống kê nhanh
  const totalContractValue = contracts.reduce((sum, c) => sum + c.totalContractValue, 0);
  const totalDelivered = deliveryNotes.reduce((sum, d) => sum + d.totalAmount, 0);
  const totalPaid = paymentVouchers.reduce((sum, p) => sum + p.paymentAmount, 0);

  // Lọc danh sách hợp đồng
  const filteredContracts = contracts.filter((c) => {
    const matchSearch =
      c.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.taxCode.includes(searchTerm);
    const matchSupplier = selectedSupplierId === 'all' || c.supplierId === selectedSupplierId;
    return matchSearch && matchSupplier;
  });

  // Lọc phiếu giao hàng
  const filteredDeliveries = deliveryNotes.filter((d) => {
    const matchSearch =
      d.deliveryCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.delivererName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSupplier = selectedSupplierId === 'all' || d.supplierId === selectedSupplierId;
    return matchSearch && matchSupplier;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 font-sans">
      {/* 1. HEADER & KPI TỔNG HỢP QUẢN LÝ NHÀ CUNG CẤP */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Building2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Quản lý Nhà cung cấp & Quy trình Công nợ 3 bước
              </h1>
              <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                5 NCC Thực phẩm
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Trường Mầm non Hàm Thắng 2 • Kế toán bán trú: Kiều Thị Mỹ Hạnh • Hiệu trưởng: Nguyễn Thị Thắng
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onShowToast('Chức năng xuất báo cáo công nợ tổng hợp đang tải...', 'info')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>In báo cáo</span>
            </button>
            <button
              onClick={() => {
                if (activeTab === 'contracts' && onAddContract) onAddContract();
                else if (activeTab === 'delivery' && onAddDeliveryNote) onAddDeliveryNote();
                else onShowToast('Mở form tạo mới chứng từ...', 'info');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>
                {activeTab === 'contracts'
                  ? 'Thêm Hợp đồng'
                  : activeTab === 'delivery'
                  ? 'Tạo Phiếu giao hàng'
                  : activeTab === 'reconciliation'
                  ? 'Lập Bảng kê đối chiếu'
                  : 'Lập Ủy nhiệm chi'}
              </span>
            </button>
          </div>
        </div>

        {/* 3 Thẻ thống kê KPI quy trình 3 bước chuẩn trường công */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Tổng giá trị Hợp đồng (2026)
              </span>
              <span className="text-lg font-extrabold text-slate-800 mt-0.5 block">
                {formatCurrency(totalContractValue)}
              </span>
              <span className="text-[10px] text-slate-500">5 hợp đồng nhà cung cấp chính thức</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                Đã tiếp nhận giao hàng (Tháng 9)
              </span>
              <span className="text-lg font-extrabold text-amber-700 mt-0.5 block">
                {formatCurrency(totalDelivered)}
              </span>
              <span className="text-[10px] text-slate-500">{deliveryNotes.length} phiếu giao hàng kiểm thực</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                Đã thanh toán (Kho bạc/NH)
              </span>
              <span className="text-lg font-extrabold text-emerald-700 mt-0.5 block">
                {formatCurrency(totalPaid)}
              </span>
              <span className="text-[10px] text-slate-500">Tiểu mục 7049 • Quản lý gối đầu</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 4 Tabs Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 mt-4 -mb-4 pt-1">
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'contracts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. Danh bạ NCC & Hợp đồng ({contracts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('delivery')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'delivery'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Phiếu giao nhận hàng ngày ({deliveryNotes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'reconciliation'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>3. Bảng kê đối chiếu hóa đơn ({reconciliations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'payments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>4. Ủy nhiệm chi & Thanh toán ({paymentVouchers.length})</span>
          </button>
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo mã số, tên nhà cung cấp, người giao, mã số thuế..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả ngành hàng</option>
              <option value="thit_ca">Thịt, Cá, Thủy hải sản</option>
              <option value="rau_cu">Rau củ quả VietGAP</option>
              <option value="sua_banh">Sữa & Bánh dinh dưỡng</option>
              <option value="gao_bun">Gạo, Bún, Gia vị bách hóa</option>
            </select>
          </div>
        </div>

        {/* TAB 1: DANH BẠ NCC & HỢP ĐỒNG */}
        {activeTab === 'contracts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {contract.contractNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Hiệu lực
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">
                    {contract.supplierName}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{contract.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{contract.phone} • ĐD: {contract.representative}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">STK: {contract.bankAccount} ({contract.bankName})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Thời hạn: {contract.startDate} đến {contract.endDate}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Hạn mức hợp đồng</span>
                    <span className="text-xs font-extrabold text-blue-700">
                      {formatCurrency(contract.totalContractValue)}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedContract(contract)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <span>Bảng giá ({contract.items.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: PHIẾU GIAO NHẬN HÀNG NGÀY (BƯỚC 1) */}
        {activeTab === 'delivery' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Mã phiếu</th>
                    <th className="py-2.5 px-3">Ngày & Giờ</th>
                    <th className="py-2.5 px-3">Nhà cung cấp</th>
                    <th className="py-2.5 px-3">Điểm nhận</th>
                    <th className="py-2.5 px-3">Người giao / nhận</th>
                    <th className="py-2.5 px-3 text-right">Số mặt hàng</th>
                    <th className="py-2.5 px-3 text-right">Tổng thành tiền</th>
                    <th className="py-2.5 px-3 text-center">Kiểm thực ATTP</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeliveries.map((del) => (
                    <tr key={del.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-blue-600 font-mono">
                        {del.deliveryCode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {del.date} <span className="text-slate-400">({del.deliveryTime})</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {del.supplierName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold border border-slate-200">
                          {del.branchName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div className="font-medium text-slate-800">{del.delivererName}</div>
                        <div className="text-[10px] text-slate-400">Nhận: {del.receiverName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                        {del.items.length} món
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(del.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10.5px] font-bold border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Đạt chuẩn
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            del.status === 'RECONCILED'
                              ? 'bg-purple-100 text-purple-800'
                              : del.status === 'CHECKED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {del.status === 'RECONCILED'
                            ? 'Đã đối chiếu HĐ'
                            : del.status === 'CHECKED'
                            ? 'Đã kiểm tra'
                            : 'Mới nhận hàng'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BẢNG KÊ ĐỐI CHIẾU HÓA ĐƠN CUỐI THÁNG (BƯỚC 2) */}
        {activeTab === 'reconciliation' && (
          <div className="space-y-3">
            {reconciliations.map((rec) => (
              <div
                key={rec.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-blue-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 font-mono text-sm">
                        {rec.code}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                        Kỳ: Tháng {rec.monthYear}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rec.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'CONFIRMED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.status === 'APPROVED'
                          ? 'BGH Đã phê duyệt'
                          : rec.status === 'CONFIRMED'
                          ? 'Kế toán đã xác nhận'
                          : 'Bản nháp đối chiếu'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-blue-700 mt-1">
                      {rec.supplierName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onShowToast(`In bảng kê đối chiếu ${rec.code}...`, 'info')}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      In bảng kê
                    </button>
                    {rec.status !== 'APPROVED' && (
                      <button
                        onClick={() => onShowToast(`Phê duyệt bảng kê đối chiếu ${rec.code}`, 'success')}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        Phê duyệt thanh toán
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 py-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tổng tiền theo Phiếu giao:</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {formatCurrency(rec.totalDeliveredAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tổng tiền theo Hóa đơn VAT:</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {formatCurrency(rec.reconciledAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Chênh lệch:</span>
                    <span className="font-bold text-slate-700 text-sm">
                      {formatCurrency(rec.difference)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Người đối chiếu:</span>
                    <span className="font-medium text-slate-700">
                      {rec.confirmedBy || 'Chưa xác nhận'}
                    </span>
                  </div>
                </div>

                {/* Danh sách hóa đơn đính kèm */}
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/60 mt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Hóa đơn tài chính VAT đính kèm ({rec.invoices.length} HĐ)
                  </span>
                  <div className="space-y-1">
                    {rec.invoices.map((inv, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded border border-slate-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-slate-400 text-[11px]">({inv.invoiceDate})</span>
                          <span className="text-slate-500 text-[10px]">
                            Gộp {inv.deliveryNoteCodes.length} phiếu giao
                          </span>
                        </div>
                        <span className="font-bold text-slate-800">
                          {formatCurrency(inv.totalAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: ỦY NHIỆM CHI & THANH TOÁN GỐI ĐẦU (BƯỚC 3) */}
        {activeTab === 'payments' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Số chứng từ (UNC)</th>
                    <th className="py-2.5 px-3">Ngày chi</th>
                    <th className="py-2.5 px-3">Đơn vị thụ hưởng (NCC)</th>
                    <th className="py-2.5 px-3">Bảng kê đối chiếu</th>
                    <th className="py-2.5 px-3">Hình thức chi</th>
                    <th className="py-2.5 px-3">Tiểu mục kho bạc</th>
                    <th className="py-2.5 px-3 text-right">Số tiền chi</th>
                    <th className="py-2.5 px-3">Người ký duyệt</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentVouchers.map((voc) => (
                    <tr key={voc.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold font-mono text-purple-700">
                        {voc.voucherNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{voc.paymentDate}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {voc.supplierName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                        {voc.reconciliationCode}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-200">
                          {voc.paymentMethod === 'KHO_BAC'
                            ? 'Kho bạc NN'
                            : voc.paymentMethod === 'NGAN_HANG'
                            ? 'Chuyển khoản NH'
                            : 'Tiền mặt'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                        {voc.treasurySubItem || '7049'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                        {formatCurrency(voc.paymentAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div>{voc.approvedBy} (HT)</div>
                        <div className="text-[10px] text-slate-400">Lập: {voc.paidBy}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            voc.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {voc.status === 'COMPLETED' ? 'Đã thanh toán' : 'Chờ duyệt chi'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL XEM BẢNG GIÁ HỢP ĐỒNG CHI TIẾT */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Bảng giá Hợp đồng: {selectedContract.contractNumber}
                </h3>
                <p className="text-xs text-slate-500">{selectedContract.supplierName}</p>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5">Mã thực phẩm</th>
                    <th className="py-2 px-2.5">Tên thực phẩm</th>
                    <th className="py-2 px-2.5">ĐVT</th>
                    <th className="py-2 px-2.5 text-right">Giá hợp đồng</th>
                    <th className="py-2 px-2.5 text-right">Giá thị trường</th>
                    <th className="py-2 px-2.5 text-center">Hiệu lực</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedContract.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 font-mono font-bold text-blue-600">
                        {item.foodCode}
                      </td>
                      <td className="py-2 px-2.5 font-medium text-slate-800">{item.foodName}</td>
                      <td className="py-2 px-2.5 text-slate-600">{item.unit}</td>
                      <td className="py-2 px-2.5 text-right font-bold text-emerald-700">
                        {formatCurrency(item.contractPrice)}
                      </td>
                      <td className="py-2 px-2.5 text-right text-slate-400">
                        {item.marketPrice ? formatCurrency(item.marketPrice) : '-'}
                      </td>
                      <td className="py-2 px-2.5 text-center text-slate-500 text-[10px]">
                        Từ {item.effectiveDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-end">
              <button
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
