'use client';

import React, { useState } from 'react';
import { ClassAttendanceItem } from '@/types/nutrition';
import { Users, CheckCircle2, UserCheck, UserX, Coffee, ArrowRight, Save, Calendar } from 'lucide-react';

interface Props {
  date: string;
  attendanceData: ClassAttendanceItem[];
  onSyncAttendance: (data: ClassAttendanceItem[]) => void;
  canEditAttendance?: boolean;
}

export const AttendanceView: React.FC<Props> = ({
  date,
  attendanceData,
  onSyncAttendance,
  canEditAttendance = true,
}) => {
  const [list, setList] = useState<ClassAttendanceItem[]>(attendanceData);

  const handleAbsentChange = (id: string, count: number) => {
    setList((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const validAbsent = Math.max(0, Math.min(item.registeredCount, count));
        return {
          ...item,
          absentCount: validAbsent,
          actualCount: item.registeredCount - validAbsent,
        };
      })
    );
  };

  const handleBreakfastChange = (id: string, count: number) => {
    setList((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          breakfastCount: Math.max(0, Math.min(item.registeredCount, count)),
        };
      })
    );
  };

  const handleNoteChange = (id: string, note: string) => {
    setList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, note } : item))
    );
  };

  const totalRegistered = list.reduce((acc, c) => acc + c.registeredCount, 0);
  const totalAbsent = list.reduce((acc, c) => acc + c.absentCount, 0);
  const totalActual = list.reduce((acc, c) => acc + c.actualCount, 0);
  const totalBreakfast = list.reduce((acc, c) => acc + c.breakfastCount, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 p-4 md:p-6 text-xs text-slate-800">
      {/* Top Banner & KPI Cards */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            SỔ ĐIỂM DANH & BÁO ĂN BÁN TRÚ (9 LỚP HỌC)
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Ngày: <strong className="text-slate-800">{date}</strong> | Cập nhật số liệu trẻ ăn thực tế để tự động tính lại khối lượng thực phẩm.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSyncAttendance(list)}
          disabled={!canEditAttendance}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold shadow-xs transition-all ${
            canEditAttendance
              ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>ĐỒNG BỘ VÀO THỰC ĐƠN ({totalActual} CHÁU)</span>
        </button>
      </div>

      {/* 4 Quick Stat Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 select-none">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold block text-[11px]">TỔNG SĨ SỐ ĐĂNG KÝ</span>
            <span className="text-xl font-black font-mono text-slate-900">{totalRegistered}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold block text-[11px]">THỰC TẾ ĂN TRƯA</span>
            <span className="text-xl font-black font-mono text-blue-600">{totalActual}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold block text-[11px]">SỐ TRẺ NGHỈ HỌC</span>
            <span className="text-xl font-black font-mono text-rose-600">{totalAbsent}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 font-semibold block text-[11px]">ĐĂNG KÝ ĂN SÁNG</span>
            <span className="text-xl font-black font-mono text-amber-600">{totalBreakfast}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Coffee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200">STT</th>
                <th className="py-2.5 px-4 border-r border-slate-200">Tên Lớp Học</th>
                <th className="py-2.5 px-3 text-center w-28 border-r border-slate-200">Khối</th>
                <th className="py-2.5 px-4 border-r border-slate-200">Giáo Viên Chủ Nhiệm</th>
                <th className="py-2.5 px-3 text-center w-24 border-r border-slate-200">Sĩ Số ĐK</th>
                <th className="py-2.5 px-3 text-center w-28 border-r border-slate-200 bg-rose-50/70 text-rose-950 font-black">
                  Số Trẻ Nghỉ
                </th>
                <th className="py-2.5 px-3 text-center w-28 border-r border-slate-200 bg-blue-50/70 text-blue-950 font-black">
                  Ăn Thực Tế
                </th>
                <th className="py-2.5 px-3 text-center w-28 border-r border-slate-200 bg-amber-50/70 text-amber-950 font-black">
                  Ăn Sáng
                </th>
                <th className="py-2.5 px-4">Lý do nghỉ / Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((c, idx) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 text-center border-r border-slate-100 font-mono text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4 border-r border-slate-100 font-bold text-slate-900">
                    {c.className}
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-100">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        c.ageGroup === 'maugiao'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {c.ageGroup === 'maugiao' ? 'Mẫu giáo' : 'Nhà trẻ'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 border-r border-slate-100 text-slate-600">
                    {c.teacherName}
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-100 font-mono font-semibold text-slate-700">
                    {c.registeredCount}
                  </td>
                  <td className="py-1 px-3 text-center border-r border-slate-100 bg-rose-50/20">
                    <input
                      type="number"
                      min="0"
                      max={c.registeredCount}
                      disabled={!canEditAttendance}
                      value={c.absentCount}
                      onChange={(e) => handleAbsentChange(c.id, parseInt(e.target.value) || 0)}
                      className={`w-16 text-center font-mono font-bold px-2 py-1 rounded-md border ${
                        canEditAttendance
                          ? 'border-slate-200 bg-white text-rose-600 focus:ring-1 focus:ring-rose-500 focus:outline-none'
                          : 'border-transparent bg-transparent text-slate-500'
                      }`}
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-100 bg-blue-50/20 font-mono font-black text-blue-900 text-sm">
                    {c.actualCount}
                  </td>
                  <td className="py-1 px-3 text-center border-r border-slate-100 bg-amber-50/20">
                    <input
                      type="number"
                      min="0"
                      max={c.registeredCount}
                      disabled={!canEditAttendance}
                      value={c.breakfastCount}
                      onChange={(e) => handleBreakfastChange(c.id, parseInt(e.target.value) || 0)}
                      className={`w-16 text-center font-mono font-bold px-2 py-1 rounded-md border ${
                        canEditAttendance
                          ? 'border-slate-200 bg-white text-amber-700 focus:ring-1 focus:ring-amber-500 focus:outline-none'
                          : 'border-transparent bg-transparent text-slate-500'
                      }`}
                    />
                  </td>
                  <td className="py-1.5 px-4">
                    <input
                      type="text"
                      disabled={!canEditAttendance}
                      value={c.note || ''}
                      onChange={(e) => handleNoteChange(c.id, e.target.value)}
                      placeholder="Ghi chú học sinh ốm, có phép..."
                      className="w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white text-slate-700 placeholder:text-slate-300 focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td colSpan={4} className="py-3 px-4 text-right border-r border-slate-300 uppercase tracking-wider">
                  TỔNG CỘNG TOÀN TRƯỜNG (9 LỚP)
                </td>
                <td className="py-3 px-3 text-center border-r border-slate-300 font-mono font-black">
                  {totalRegistered}
                </td>
                <td className="py-3 px-3 text-center border-r border-slate-300 font-mono font-black text-rose-600 bg-rose-100/50">
                  {totalAbsent}
                </td>
                <td className="py-3 px-3 text-center border-r border-slate-300 font-mono font-black text-blue-700 bg-blue-100/50 text-sm">
                  {totalActual}
                </td>
                <td className="py-3 px-3 text-center border-r border-slate-300 font-mono font-black text-amber-700 bg-amber-100/50">
                  {totalBreakfast}
                </td>
                <td className="py-3 px-4 text-slate-500 font-normal">
                  * Số liệu sẵn sàng để đồng bộ trực tiếp vào khẩu phần thực phẩm
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
