'use client';

import React, { useState } from 'react';
import {
  Users,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  ArrowDownToLine,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Building2,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';
import { ClassMealLedgerSummary, StudentMealSettlement } from '@/types/student-meal-ledger';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface Props {
  classSummaries: ClassMealLedgerSummary[];
  onOpenPrintModal?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const StudentMealLedgerView: React.FC<Props> = ({
  classSummaries,
  onOpenPrintModal,
  onShowToast,
}) => {
  const [selectedClassIndex, setSelectedClassIndex] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const currentClass = classSummaries[selectedClassIndex] || classSummaries[0];

  // Lọc học sinh theo từ khóa
  const filteredStudents = currentClass.students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tổng hợp toàn trường
  const totalStudentsSchool = classSummaries.reduce((sum, c) => sum + c.totalStudents, 0);
  const totalAdvanceSchool = classSummaries.reduce((sum, c) => sum + c.totalAdvanceCollected, 0);
  const totalActualCostSchool = classSummaries.reduce((sum, c) => sum + c.totalActualCost, 0);
  const totalRefundSchool = classSummaries.reduce((sum, c) => sum + c.totalRefundAmount, 0);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 font-sans">
      {/* 1. HEADER & KPI TỔNG HỢP TIỀN ĂN BÁN TRÚ HỌC SINH */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Sổ Tính Tiền Ăn Học Sinh & Quyết Toán Bán Trú (Mẫu 02-MN)
              </h1>
              <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full border border-purple-200">
                Tháng 09/2026
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Trường Mầm non Hàm Thắng 2 • Quy chế bán trú: Nghỉ có báo trước được hoàn trả tiền ăn cuối tháng
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onOpenPrintModal) onOpenPrintModal();
                else onShowToast('Đang mở xem trước bản in Mẫu 02-MN...', 'info');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>In Sổ 02-MN</span>
            </button>
            <button
              onClick={() => onShowToast('✓ Đã xuất bảng quyết toán tiền ăn ra file Excel', 'success')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Xuất Excel Mẫu 02-MN</span>
            </button>
          </div>
        </div>

        {/* 4 Thẻ thống kê toàn trường */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
              Tổng số trẻ ăn bán trú
            </span>
            <span className="text-lg font-extrabold text-slate-800 mt-0.5 block">
              {totalStudentsSchool} trẻ <span className="text-xs font-medium text-slate-500">/ 9 lớp</span>
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[10.5px] font-bold text-blue-600 uppercase tracking-wider block">
              Tiền thu tạm ứng đầu tháng
            </span>
            <span className="text-lg font-extrabold text-blue-700 mt-0.5 block">
              {formatCurrency(totalAdvanceSchool)}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[10.5px] font-bold text-emerald-600 uppercase tracking-wider block">
              Tiền ăn thực tế đã sử dụng
            </span>
            <span className="text-lg font-extrabold text-emerald-700 mt-0.5 block">
              {formatCurrency(totalActualCostSchool)}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[10.5px] font-bold text-amber-600 uppercase tracking-wider block">
              Tiền thừa hoàn trả / chuyển tháng
            </span>
            <span className="text-lg font-extrabold text-amber-700 mt-0.5 block">
              {formatCurrency(totalRefundSchool)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. THANH CHỌN LỚP & TÌM KIẾM */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 shrink-0 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Dropdown danh sách 9 lớp */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 shrink-0">Chọn lớp:</span>
          {classSummaries.map((cls, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedClassIndex(idx)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                selectedClassIndex === idx
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cls.className.replace('Lớp ', '')} ({cls.totalStudents})
            </button>
          ))}
        </div>

        {/* Ô tìm kiếm học sinh */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc mã số..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50"
          />
        </div>
      </div>

      {/* 3. BẢNG CHI TIẾT TỪNG HỌC SINH TRONG LỚP (MẪU 02-MN) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Banner thông tin lớp */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-purple-900 text-sm">{currentClass.className}</span>
            <span className="text-purple-700">GVCN: {currentClass.teacherName}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-600">Định mức: {formatCurrency(currentClass.dailyMealRate)}/ngày</span>
          </div>
          <div className="font-mono text-purple-900 font-bold">
            Tiền thừa hoàn trả lớp: {formatCurrency(currentClass.totalRefundAmount)}
          </div>
        </div>

        {/* Table Mẫu 02-MN */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 text-center">STT</th>
                  <th className="py-2.5 px-3">Mã số</th>
                  <th className="py-2.5 px-3">Họ và tên trẻ</th>
                  <th className="py-2.5 px-3 text-center">Ngày sinh</th>
                  <th className="py-2.5 px-3 text-center">Giới tính</th>
                  <th className="py-2.5 px-3 text-right">Tạm ứng thu (22 ngày)</th>
                  <th className="py-2.5 px-3 text-center">Ăn thực</th>
                  <th className="py-2.5 px-3 text-center">Nghỉ phép</th>
                  <th className="py-2.5 px-3 text-right">Tiền ăn thực</th>
                  <th className="py-2.5 px-3 text-right font-extrabold text-amber-700">Thừa (Hoàn trả)</th>
                  <th className="py-2.5 px-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((stud, idx) => (
                  <tr key={stud.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-700 text-[11px]">
                      {stud.studentCode}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">{stud.fullName}</td>
                    <td className="py-2 px-3 text-center text-slate-600">{stud.dob}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          stud.gender === 'Nữ'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {stud.gender}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-700">
                      {formatCurrency(stud.initialAdvanceAmount)}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-700">
                      {stud.actualAttendedDays}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-amber-600">
                      {stud.excusedAbsenceDays > 0 ? `${stud.excusedAbsenceDays} ngày` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">
                      {formatCurrency(stud.actualMealCost)}
                    </td>
                    <td className="py-2 px-3 text-right font-extrabold text-amber-700 font-mono">
                      {stud.refundAmount > 0 ? formatCurrency(stud.refundAmount) : '0 đ'}
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px] italic">{stud.note}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800 text-xs">
                <tr>
                  <td colSpan={5} className="py-2.5 px-3 text-right uppercase">
                    Tổng cộng lớp {currentClass.className}:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {formatCurrency(currentClass.totalAdvanceCollected)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {currentClass.students.reduce((s, it) => s + it.actualAttendedDays, 0)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-amber-700">
                    {currentClass.students.reduce((s, it) => s + it.excusedAbsenceDays, 0)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                    {formatCurrency(currentClass.totalActualCost)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-700 font-extrabold">
                    {formatCurrency(currentClass.totalRefundAmount)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
