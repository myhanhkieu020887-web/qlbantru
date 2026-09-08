'use client';

import React, { useState } from 'react';
import { ClassAttendanceItem } from '../../types/nutrition';
import { X, ClipboardCheck, Users, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  attendanceData: ClassAttendanceItem[];
  onSyncAttendance: (updatedList: ClassAttendanceItem[]) => void;
}

export const AttendanceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  attendanceData,
  onSyncAttendance,
}) => {
  const [list, setList] = useState<ClassAttendanceItem[]>(attendanceData);

  if (!isOpen) return null;

  const handleAbsentChange = (id: string, absent: number) => {
    setList((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const abs = Math.max(0, Math.min(c.registeredCount, absent));
          return {
            ...c,
            absentCount: abs,
            actualCount: c.registeredCount - abs,
          };
        }
        return c;
      })
    );
  };

  const totalNhaTre = list
    .filter((c) => c.ageGroup === 'nhatre')
    .reduce((acc, c) => acc + c.actualCount, 0);

  const totalMauGiao = list
    .filter((c) => c.ageGroup === 'maugiao')
    .reduce((acc, c) => acc + c.actualCount, 0);

  const totalBreakfast = list.reduce((acc, c) => acc + c.breakfastCount, 0);
  const totalAllStudents = totalNhaTre + totalMauGiao;

  const handleConfirm = () => {
    onSyncAttendance(list);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ClipboardCheck className="w-6 h-6 text-emerald-300" />
            <div>
              <h3 className="font-bold text-base">Bảng Báo ăn & Điểm danh Sĩ số Lớp học (07:30 Sáng)</h3>
              <p className="text-xs text-emerald-100">
                Tổng hợp báo ăn từ 9 lớp học gửi về bộ phận Kế toán bán trú và Bếp trưởng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-4 gap-3 p-3 bg-gray-50 border-b border-gray-200 text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-gray-500 font-semibold mb-0.5">TỔNG SĨ SỐ ĂN TRƯA</div>
            <div className="text-xl font-black font-mono text-gray-900">{totalAllStudents} cháu</div>
            <div className="text-[10px] text-emerald-600 font-semibold">Tự động truyền vào định lượng</div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-blue-200 shadow-sm">
            <div className="text-blue-700 font-semibold mb-0.5">KHỐI MẪU GIÁO</div>
            <div className="text-xl font-black font-mono text-blue-900">{totalMauGiao} cháu</div>
            <div className="text-[10px] text-gray-500">Mầm, Chồi, Lá, Lớp ghép</div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-purple-200 shadow-sm">
            <div className="text-purple-700 font-semibold mb-0.5">KHỐI NHÀ TRẺ</div>
            <div className="text-xl font-black font-mono text-purple-900">{totalNhaTre} cháu</div>
            <div className="text-[10px] text-gray-500">Cơm nát & Cháo dinh dưỡng</div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-sm">
            <div className="text-amber-700 font-semibold mb-0.5">PHÂN HỆ ĂN SÁNG</div>
            <div className="text-xl font-black font-mono text-amber-900">{totalBreakfast} cháu</div>
            <div className="text-[10px] text-gray-500">Trẻ ăn sáng tại trường</div>
          </div>
        </div>

        {/* Table ma trận 9 lớp */}
        <div className="flex-1 overflow-y-auto p-3">
          <table className="w-full border-collapse text-xs text-left">
            <thead className="sticky top-0 bg-[#eef2f7] text-gray-800 font-bold border-b border-gray-300">
              <tr>
                <th className="py-2 px-2 border-r border-gray-300 text-center w-10">STT</th>
                <th className="py-2 px-3 border-r border-gray-300">Tên lớp học</th>
                <th className="py-2 px-3 border-r border-gray-300">Giáo viên chủ nhiệm</th>
                <th className="py-2 px-2 border-r border-gray-300 text-center w-20">Khối</th>
                <th className="py-2 px-2 border-r border-gray-300 text-right w-24">Đăng ký</th>
                <th className="py-2 px-2 border-r border-gray-300 text-right w-24 bg-rose-50 text-rose-900">
                  Nghỉ hôm nay
                </th>
                <th className="py-2 px-2 border-r border-gray-300 text-right w-24 bg-emerald-50 text-emerald-950 font-black">
                  Ăn thực tế
                </th>
                <th className="py-2 px-2 border-r border-gray-300 text-right w-24">Ăn sáng</th>
                <th className="py-2 px-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {list.map((item, idx) => (
                <tr key={item.id} className="hover:bg-blue-50/40">
                  <td className="py-2 px-2 text-center border-r border-gray-200 font-mono text-gray-500">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3 border-r border-gray-200 font-bold text-gray-900">
                    {item.className}
                  </td>
                  <td className="py-2 px-3 border-r border-gray-200 text-gray-600">
                    {item.teacherName}
                  </td>
                  <td className="py-2 px-2 border-r border-gray-200 text-center">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.ageGroup === 'nhatre'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.ageGroup === 'nhatre' ? 'Nhà trẻ' : 'Mẫu giáo'}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right border-r border-gray-200 font-mono text-gray-700">
                    {item.registeredCount}
                  </td>
                  {/* Ô nhập số trẻ nghỉ */}
                  <td className="py-1 px-2 text-right border-r border-gray-200 bg-rose-50/40">
                    <input
                      type="number"
                      min="0"
                      max={item.registeredCount}
                      value={item.absentCount}
                      onChange={(e) =>
                        handleAbsentChange(item.id, parseInt(e.target.value) || 0)
                      }
                      className="w-16 text-right font-mono font-bold text-rose-700 bg-white border border-rose-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-2 text-right border-r border-gray-200 font-mono font-black text-emerald-800 bg-emerald-50/40">
                    {item.actualCount}
                  </td>
                  <td className="py-2 px-2 text-right border-r border-gray-200 font-mono text-amber-700 font-bold">
                    {item.breakfastCount}
                  </td>
                  <td className="py-2 px-3 text-gray-500 italic text-[11px]">
                    {item.note || '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span>
              Khi bấm đồng bộ, sĩ số sẽ tự động cập nhật vào các phân hệ và tính lại khối lượng thực phẩm.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đồng bộ Sĩ số vào Thực đơn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
