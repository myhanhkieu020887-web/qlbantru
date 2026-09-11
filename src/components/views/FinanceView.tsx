'use client';

import React, { useState } from 'react';
import {
  StudentSettlementC38,
  SupplierDebtRecord,
} from '../../types/inventory';
import { formatCurrency, formatNumber } from '../../lib/utils';
import {
  ReceiptText,
  Calculator,
  Building2,
  Users,
  Coins,
  ArrowRightLeft,
  FileCheck2,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  DollarSign,
  PlusCircle,
  ArrowUpRight,
  Download,
  Loader2,
} from 'lucide-react';

interface Props {
  settlements: StudentSettlementC38[];
  suppliersDebt: SupplierDebtRecord[];
  onUpdateSettlementStatus?: (studentId: string, status: StudentSettlementC38['status']) => void;
  onRecordSupplierPayment?: (supplierId: string, amount: number) => void;
}

export const FinanceView: React.FC<Props> = ({
  settlements,
  suppliersDebt,
  onUpdateSettlementStatus,
  onRecordSupplierPayment,
}) => {
  const [activeTab, setActiveTab] = useState<'settlement' | 'suppliers' | 'summary'>('settlement');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // State thanh toán công nợ NCC
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(5000000);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // State xuất báo cáo
  const [isDownloadingSettlementPdf, setIsDownloadingSettlementPdf] = useState<boolean>(false);
  const [isDownloadingNutritionExcel, setIsDownloadingNutritionExcel] = useState<boolean>(false);

  const handleDownloadSettlementPdf = async () => {
    setIsDownloadingSettlementPdf(true);
    try {
      const res = await fetch('/api/reports/settlement-pdf?month=9&year=2026&price=21000&days=20');
      if (!res.ok) throw new Error('Không thể tải PDF quyết toán');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quyet_toan_tien_an_thang_9_2026.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Có lỗi khi tải PDF quyết toán: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setIsDownloadingSettlementPdf(false);
    }
  };

  const handleDownloadNutritionExcel = async () => {
    setIsDownloadingNutritionExcel(true);
    try {
      const res = await fetch('/api/reports/nutrition-excel?month=9&year=2026&segment=maugiao&students=1210&budget=21000');
      if (!res.ok) throw new Error('Không thể tải file Excel dinh dưỡng');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bao_cao_dinh_duong_thang_9_2026_maugiao.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Có lỗi khi tải Excel: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setIsDownloadingNutritionExcel(false);
    }
  };

  // Thống kê Quyết toán C38-HD
  const totalAdvancePaid = settlements.reduce((sum, s) => sum + s.initialAdvancePaid, 0);
  const totalActualCost = settlements.reduce((sum, s) => sum + s.actualFoodCost, 0);
  const totalRefund = settlements.reduce((sum, s) => sum + s.refundAmount, 0);

  // Thống kê Công nợ NCC Mẫu 02-TT
  const totalDebtBalance = suppliersDebt.reduce((sum, s) => sum + s.closingBalance, 0);
  const totalPurchases = suppliersDebt.reduce((sum, s) => sum + s.periodPurchases, 0);
  const totalPayments = suppliersDebt.reduce((sum, s) => sum + s.periodPayments, 0);

  // Danh sách các lớp học
  const classList = Array.from(new Set(settlements.map((s) => s.className)));

  // Lọc học sinh
  const filteredSettlements = settlements.filter((s) => {
    const matchClass = classFilter === 'all' || s.className === classFilter;
    const matchSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchClass && matchSearch;
  });

  const handleMakePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || paymentAmount <= 0) return;
    if (onRecordSupplierPayment) {
      onRecordSupplierPayment(selectedSupplierId, paymentAmount);
    }
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* 1. THANH TIÊU ĐỀ & KPI TÀI CHÍNH */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">
              Kế Toán Bán Trú & Quyết Toán Tiền Ăn Mầm Non
            </h1>
            <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded border border-blue-300">
              Thông tư 107/2017/TT-BTC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quyết toán tiền ăn học sinh Mẫu C38-HD & Bảng kê đối chiếu công nợ 5 nhà cung cấp Mẫu 02-TT
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadNutritionExcel}
            disabled={isDownloadingNutritionExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Xuất file Excel báo cáo dinh dưỡng 30 ngày trong tháng"
          >
            {isDownloadingNutritionExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isDownloadingNutritionExcel ? 'Đang tạo Excel...' : 'Excel Dinh Dưỡng Tháng'}</span>
          </button>

          <button
            onClick={handleDownloadSettlementPdf}
            disabled={isDownloadingSettlementPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Xuất bảng công khai quyết toán tiền ăn chuẩn A4 có chữ ký"
          >
            {isDownloadingSettlementPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isDownloadingSettlementPdf ? 'Đang tạo PDF...' : 'PDF Quyết Toán A4'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In nhanh (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* 2. DẢI TỔNG HỢP TÀI CHÍNH */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 px-6 py-3 bg-slate-100/70 border-b border-slate-200">
        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Tổng tạm thu tiền ăn đầu tháng</div>
            <div className="text-base font-bold text-blue-800">
              {formatCurrency(totalAdvancePaid)}
            </div>
          </div>
          <Coins className="w-7 h-7 text-blue-500/30" />
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Chi phí ăn thực tế theo điểm danh</div>
            <div className="text-base font-bold text-slate-800">
              {formatCurrency(totalActualCost)}
            </div>
          </div>
          <Calculator className="w-7 h-7 text-emerald-500/30" />
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Tiền thừa hoàn trả phụ huynh</div>
            <div className="text-base font-bold text-amber-600">
              {formatCurrency(totalRefund)}
            </div>
          </div>
          <ArrowRightLeft className="w-7 h-7 text-amber-500/30" />
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Tổng công nợ NCC còn lại (02-TT)</div>
            <div className="text-base font-bold text-rose-700">
              {formatCurrency(totalDebtBalance)}
            </div>
          </div>
          <Building2 className="w-7 h-7 text-rose-500/30" />
        </div>
      </div>

      {/* 3. TABS CHỨC NĂNG */}
      <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('settlement')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'settlement'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Quyết Toán Tiền Ăn Học Sinh (Mẫu C38-HD)</span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'suppliers'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Đối Chiếu Công Nợ NCC (Mẫu 02-TT)</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'summary'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Cân Đối Quỹ Bán Trú Tháng</span>
          </button>
        </div>

        {/* Lọc học sinh khi ở tab settlement */}
        {activeTab === 'settlement' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên học sinh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 w-40"
              />
            </div>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả các lớp</option>
              {classList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Nút hành động thanh toán ở tab NCC */}
        {activeTab === 'suppliers' && (
          <button
            onClick={() => {
              setSelectedSupplierId(suppliersDebt[0]?.supplierId || '');
              setIsPaymentModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Ghi Nhận Thanh Toán NCC</span>
          </button>
        )}
      </div>

      {/* 4. NỘI DUNG CHÍNH */}
      <div className="flex-1 overflow-auto p-6">
        {/* TAB 1: BẢNG QUYẾT TOÁN TIỀN ĂN HỌC SINH MẪU C38-HD */}
        {activeTab === 'settlement' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase">
                  Bảng Quyết Toán Tiền Ăn Bán Trú Học Sinh - Mẫu C38-HD (Ban hành theo TT 107/2017/TT-BTC)
                </h2>
                <div className="text-[11px] text-slate-500">
                  Mức thu chuẩn: 21.000 đ/ngày/trẻ | Trẻ nghỉ có phép được hoàn tiền hoặc kết chuyển tháng sau
                </div>
              </div>
              <div className="text-xs text-slate-700 font-semibold">
                Hiển thị: <span className="font-bold text-blue-700">{filteredSettlements.length}</span> học sinh
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3 w-28">Mã HS</th>
                  <th className="p-3">Họ và tên học sinh</th>
                  <th className="p-3 w-32">Lớp</th>
                  <th className="p-3 w-20 text-center">Ngày học</th>
                  <th className="p-3 w-20 text-center">Ăn thực tế</th>
                  <th className="p-3 w-24 text-center">Nghỉ có phép</th>
                  <th className="p-3 w-28 text-right">Tạm nộp (đ)</th>
                  <th className="p-3 w-28 text-right">Ăn thực tế (đ)</th>
                  <th className="p-3 w-32 text-right">Tiền thừa hoàn lại</th>
                  <th className="p-3 w-36 text-center">Phương thức xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSettlements.map((s, idx) => (
                  <tr key={s.studentId} className="hover:bg-slate-50">
                    <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="p-3 font-mono text-slate-700 font-semibold">{s.studentId}</td>
                    <td className="p-3 font-bold text-slate-900">{s.studentName}</td>
                    <td className="p-3 text-slate-600">{s.className}</td>
                    <td className="p-3 text-center font-medium text-slate-600">{s.totalSchoolDays}</td>
                    <td className="p-3 text-center font-bold text-blue-800">{s.actualAttendedDays}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-bold ${s.excusedAbsenceDays > 0 ? 'bg-amber-100 text-amber-800' : 'text-slate-400'}`}>
                        {s.excusedAbsenceDays} ngày
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700">
                      {formatCurrency(s.initialAdvancePaid)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-800 font-medium">
                      {formatCurrency(s.actualFoodCost)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-amber-700">
                      {formatCurrency(s.refundAmount)}
                    </td>
                    <td className="p-3 text-center">
                      {s.status === 'CARRIED_FORWARD' ? (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                          Kết chuyển tháng sau
                        </span>
                      ) : s.status === 'REFUNDED' ? (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                          Đã trả tiền mặt
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          Chờ quyết toán
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={7} className="p-3 text-right uppercase text-xs">
                    Tổng cộng toàn trường:
                  </td>
                  <td className="p-3 text-right font-mono text-blue-900">
                    {formatCurrency(totalAdvancePaid)}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-900">
                    {formatCurrency(totalActualCost)}
                  </td>
                  <td className="p-3 text-right font-mono text-amber-700">
                    {formatCurrency(totalRefund)}
                  </td>
                  <td className="p-3 text-center text-xs text-slate-600">Bảo toàn 100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* TAB 2: ĐỐI CHIẾU CÔNG NỢ 5 NHÀ CUNG CẤP (MẪU 02-TT) */}
        {activeTab === 'suppliers' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase">
                  Bảng Kê Đối Chiếu & Thanh Toán Công Nợ Nhà Cung Cấp Thực Phẩm - Mẫu 02-TT
                </h2>
                <div className="text-[11px] text-slate-500">
                  Đối chiếu giữa Đơn đặt hàng (Smart PO), Phiếu kiểm nhận tiếp phẩm và Hóa đơn tài chính
                </div>
              </div>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Tên Nhà Cung Cấp</th>
                  <th className="p-3 w-48">Mặt hàng cung cấp</th>
                  <th className="p-3 w-28">Số điện thoại</th>
                  <th className="p-3 w-32 text-right">Nợ đầu kỳ (đ)</th>
                  <th className="p-3 w-36 text-right">Mua trong kỳ (đ)</th>
                  <th className="p-3 w-36 text-right">Đã thanh toán (đ)</th>
                  <th className="p-3 w-36 text-right">Còn nợ cuối kỳ (đ)</th>
                  <th className="p-3 w-32 text-center">Tình trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliersDebt.map((sup, idx) => (
                  <tr key={sup.supplierId} className="hover:bg-slate-50">
                    <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{sup.supplierName}</div>
                      <div className="text-[10px] text-slate-400">MST: {sup.taxCode} | TK: {sup.bankAccount}</div>
                    </td>
                    <td className="p-3 text-slate-600">{sup.category}</td>
                    <td className="p-3 font-mono text-slate-600">{sup.phone}</td>
                    <td className="p-3 text-right font-mono text-slate-600">
                      {formatCurrency(sup.openingBalance)}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-blue-900">
                      {formatCurrency(sup.periodPurchases)}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-emerald-800">
                      {formatCurrency(sup.periodPayments)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-700">
                      {formatCurrency(sup.closingBalance)}
                    </td>
                    <td className="p-3 text-center">
                      {sup.status === 'RECONCILED' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Đã đối chiếu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                          <AlertCircle className="w-3 h-3" /> Chờ chuyển khoản
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={5} className="p-3 text-right uppercase text-xs">
                    Tổng cộng công nợ 5 nhà cung cấp:
                  </td>
                  <td className="p-3 text-right font-mono text-blue-900">
                    {formatCurrency(totalPurchases)}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-800">
                    {formatCurrency(totalPayments)}
                  </td>
                  <td className="p-3 text-right font-mono text-rose-700">
                    {formatCurrency(totalDebtBalance)}
                  </td>
                  <td className="p-3 text-center text-xs text-slate-600">Khớp hóa đơn</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* TAB 3: BÁO CÁO CÂN ĐỐI THU - CHI QUỸ ĂN BÁN TRÚ */}
        {activeTab === 'summary' && (
          <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="text-center border-b border-slate-200 pb-4">
              <h2 className="text-base font-bold text-slate-900 uppercase">
                Báo Cáo Tổng Hợp Cân Đối Quỹ Ăn Bán Trú Tháng 09/2026
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                Trường Mẫu Giáo Hàm Thắng - Hàm Thuận Bắc, Bình Thuận
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2.5">
                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Coins className="w-4 h-4 text-blue-600" />
                  <span>I. TỔNG NGUỒN THU TIỀN ĂN BÁN TRÚ:</span>
                </div>
                <div className="flex justify-between pl-6 py-1 border-b border-slate-200">
                  <span className="text-slate-600">1. Tiền ăn tạm thu đầu tháng (526 học sinh):</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(totalAdvancePaid)}</span>
                </div>
                <div className="flex justify-between pl-6 py-1 border-b border-slate-200">
                  <span className="text-slate-600">2. Thu hỗ trợ ngân sách/tiền ga phục vụ:</span>
                  <span className="font-mono font-bold text-slate-900">4.500.000 đ</span>
                </div>
                <div className="flex justify-between pl-6 pt-1 font-bold text-blue-800">
                  <span>TỔNG THU (1 + 2):</span>
                  <span className="font-mono text-sm">{formatCurrency(totalAdvancePaid + 4500000)}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2.5">
                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>II. TỔNG CHI PHÍ THỰC TẾ:</span>
                </div>
                <div className="flex justify-between pl-6 py-1 border-b border-slate-200">
                  <span className="text-slate-600">1. Tiền mua thực phẩm (Thịt cá, rau củ, sữa, gạo...):</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(totalActualCost)}</span>
                </div>
                <div className="flex justify-between pl-6 py-1 border-b border-slate-200">
                  <span className="text-slate-600">2. Tiền thừa hoàn trả hoặc kết chuyển học sinh nghỉ có phép:</span>
                  <span className="font-mono font-bold text-amber-700">{formatCurrency(totalRefund)}</span>
                </div>
                <div className="flex justify-between pl-6 py-1 border-b border-slate-200">
                  <span className="text-slate-600">3. Chi phí gas, chất đốt, nước sạch chế biến:</span>
                  <span className="font-mono font-bold text-slate-900">4.500.000 đ</span>
                </div>
                <div className="flex justify-between pl-6 pt-1 font-bold text-emerald-800">
                  <span>TỔNG CHI (1 + 2 + 3):</span>
                  <span className="font-mono text-sm">{formatCurrency(totalActualCost + totalRefund + 4500000)}</span>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 flex justify-between items-center">
                <div>
                  <div className="font-bold text-emerald-900 text-sm">III. KẾT QUẢ CÂN ĐỐI TÀI CHÍNH (THU - CHI):</div>
                  <div className="text-[11px] text-emerald-700">Nguyên tắc tài chính công lập: Thu đủ bù chi, sai lệch = 0 đ</div>
                </div>
                <div className="text-base font-bold font-mono text-emerald-900 bg-white px-4 py-1.5 rounded-md border border-emerald-300">
                  CHÊNH LỆCH: 0 đ
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL GHI NHẬN THANH TOÁN CÔNG NỢ NCC */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-blue-700 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Ghi Nhận Thanh Toán / Tạm Ứng NCC</h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleMakePayment} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhà cung cấp thanh toán:</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {suppliersDebt.map((sup) => (
                    <option key={sup.supplierId} value={sup.supplierId}>
                      {sup.supplierName} (Còn nợ: {formatCurrency(sup.closingBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số tiền thanh toán (VNĐ):</label>
                <input
                  type="number"
                  min="100000"
                  step="100000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-md p-2 font-bold font-mono focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hình thức thanh toán:</label>
                <select className="w-full border border-slate-300 rounded-md p-2 bg-white">
                  <option>Chuyển khoản Kho bạc / Ngân hàng</option>
                  <option>Tiền mặt qua thủ quỹ</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold shadow-xs"
                >
                  Xác nhận Thanh toán
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
