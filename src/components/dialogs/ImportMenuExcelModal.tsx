'use client';

import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { MenuImportResult, ParsedDayMenu, ParsedMenuItem } from '../../lib/excel/menu-importer';
import { MenuItem, MealSession, FoodItem } from '../../types/nutrition';
import { STANDARD_FOOD_CATALOG } from '../../data/standard-foods';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedMenu: (
    dayMenu: ParsedDayMenu,
    options?: {
      targetBranch?: 'branch_1' | 'branch_2' | 'all';
      studentCount?: number;
      applyAllSheets?: boolean;
      allDays?: ParsedDayMenu[];
    }
  ) => void;
}

export const ImportMenuExcelModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onApplyParsedMenu,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<MenuImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSheetIdx, setSelectedSheetIdx] = useState<number>(0);
  const [targetBranch, setTargetBranch] = useState<'branch_1' | 'branch_2' | 'all'>('all');
  const [applyBothSheets, setApplyBothSheets] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      handleUploadAndParse(selected);
    }
  };

  const handleUploadAndParse = async (targetFile: File) => {
    setIsUploading(true);
    setError(null);
    setImportResult(null);
    setSelectedSheetIdx(0);

    try {
      const formData = new FormData();
      formData.append('file', targetFile);

      const res = await fetch('/api/menus/import-excel', {
        method: 'POST',
        body: formData,
      });

      const data: MenuImportResult = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Lỗi khi xử lý file Excel');
      }

      setImportResult(data);

      // Tự động gợi ý điểm trường theo kết quả nhận diện
      if (data.branchDetected === 'diemchinh') {
        setTargetBranch('branch_1');
      } else if (data.branchDetected === 'phanhieu') {
        setTargetBranch('branch_2');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi đọc file Excel');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApply = () => {
    if (importResult && importResult.days.length > 0) {
      const currentDay = importResult.days[selectedSheetIdx] || importResult.days[0];
      onApplyParsedMenu(currentDay, {
        targetBranch,
        studentCount: currentDay.studentCount,
        applyAllSheets: applyBothSheets && importResult.days.length > 1,
        allDays: importResult.days,
      });
      onClose();
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/api/templates/menu-excel', '_blank');
  };

  const activeDay = importResult?.days[selectedSheetIdx] || importResult?.days[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">Nhập Thực Đơn Chính Thức Từ File Excel (.xls / .xlsx)</h3>
              <p className="text-xs text-emerald-200">
                Tự động nhận diện cấu trúc trường mầm non: Sĩ số, Mẫu giáo & Ăn sáng, bảo toàn định lượng và đơn giá
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Khu vực tải file & Tải mẫu */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800 text-xs">Hỗ trợ đầy đủ file Excel thực tế từ trường mầm non</div>
              <p className="text-slate-500 text-[11px]">
                Nạp trực tiếp file <code className="font-mono bg-emerald-100 text-emerald-800 px-1 rounded">diemchinh.xls</code> hoặc <code className="font-mono bg-emerald-100 text-emerald-800 px-1 rounded">phanhieu.xls</code> (BIFF8/OpenXML) không cần đổi đuôi.
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-300 rounded-lg font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải file mẫu Excel chuẩn</span>
            </button>
          </div>

          {/* Hộp kéo thả file */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              file
                ? 'border-emerald-400 bg-emerald-50/20'
                : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>
            {isUploading ? (
              <div className="space-y-1">
                <p className="font-bold text-slate-800">Đang đọc dữ liệu bảng tính...</p>
                <p className="text-slate-400 text-[11px]">Hệ thống đang đối chiếu tên thực phẩm với Viện Dinh Dưỡng</p>
              </div>
            ) : file ? (
              <div className="space-y-1">
                <p className="font-bold text-emerald-800">Đã chọn: {file.name}</p>
                <p className="text-slate-400 text-[11px]">Bấm vào đây để chọn lại file khác</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-bold text-slate-800">Kéo & thả file Excel thực đơn vào đây hoặc bấm để chọn file</p>
                <p className="text-slate-400 text-[11px]">Hỗ trợ định dạng .xlsx và .xls (diemchinh.xls, phanhieu.xls)</p>
              </div>
            )}
          </div>

          {/* Lỗi nếu có */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold">Lỗi đọc file: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Kết quả sau khi phân tích */}
          {importResult && (
            <div className="space-y-3 pt-1">
              {/* Thẻ thống kê & Tùy chọn Điểm trường */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800">{importResult.message}</div>
                      <div className="text-slate-500 text-[11px]">
                        Nhận diện: {importResult.branchDetected === 'diemchinh' ? 'Cơ sở chính (Đ1)' : importResult.branchDetected === 'phanhieu' ? 'Phân hiệu (Đ2)' : 'Chuẩn chung'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <span className="font-bold text-emerald-700 text-sm">
                      {importResult.matchedItemsCount} / {importResult.totalItems}
                    </span>
                    <span className="text-slate-500 text-[10px] block">thực phẩm chuẩn</span>
                  </div>
                </div>

                {/* Tùy chọn điểm trường áp dụng */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col justify-between gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900">Điểm trường áp dụng:</span>
                    <span className="text-[11px] text-blue-600 font-medium">
                      Sĩ số: {activeDay?.studentCount || 0} trẻ
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTargetBranch('branch_1')}
                      className={`py-1 px-2 rounded-lg font-semibold text-center border transition cursor-pointer text-[11px] ${
                        targetBranch === 'branch_1'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Cơ sở chính (Đ1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetBranch('branch_2')}
                      className={`py-1 px-2 rounded-lg font-semibold text-center border transition cursor-pointer text-[11px] ${
                        targetBranch === 'branch_2'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Phân hiệu (Đ2)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetBranch('all')}
                      className={`py-1 px-2 rounded-lg font-semibold text-center border transition cursor-pointer text-[11px] ${
                        targetBranch === 'all'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Toàn trường
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs chọn Sheet xem trước (Mẫu giáo vs Ăn sáng) */}
              {importResult.days.length > 1 && (
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex gap-2">
                    {importResult.days.map((d, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSheetIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                          selectedSheetIdx === idx
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>{d.sheetName?.toUpperCase() || `Phân hệ ${idx + 1}`}</span>
                        <span className="text-[10px] opacity-80">({d.items.length} món - {d.studentCount} trẻ)</span>
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={applyBothSheets}
                      onChange={(e) => setApplyBothSheets(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Đồng thời nạp cả 2 phân hệ (Trưa/Xế + Ăn sáng)</span>
                  </label>
                </div>
              )}

              {/* Bảng xem trước nguyên liệu của Sheet đang chọn */}
              {activeDay && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50 px-3.5 py-2 font-bold text-slate-700 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-800">Sheet: {activeDay.sheetName}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-[11px] text-slate-600 font-normal">
                        Món trưa: <span className="font-semibold text-slate-800">{activeDay.menuTitle.trua || 'Bữa trưa'}</span>
                        {activeDay.menuTitle.xe && ` • Món xế: ${activeDay.menuTitle.xe}`}
                        {activeDay.menuTitle.sang && ` • Ăn sáng: ${activeDay.menuTitle.sang}`}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700 font-bold">
                      {activeDay.items.length} nguyên liệu
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 font-semibold text-[11px]">
                        <tr>
                          <th className="p-2 border-b">STT</th>
                          <th className="p-2 border-b">Tên thực phẩm</th>
                          <th className="p-2 border-b">Bữa ăn</th>
                          <th className="p-2 border-b text-right">g/trẻ</th>
                          <th className="p-2 border-b text-right">Thực mua</th>
                          <th className="p-2 border-b text-right">Đơn giá</th>
                          <th className="p-2 border-b">Khớp danh mục chuẩn</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {activeDay.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-medium text-slate-800">{it.foodName}</td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                                {it.mealSession === 'chinh_trua' ? 'Trưa' : it.mealSession === 'xe' ? 'Xế' : it.mealSession === 'phu_xe' ? 'Phụ xế' : it.mealSession === 'phu_trua' ? 'Tráng miệng' : 'Sáng'}
                              </span>
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-blue-700">
                              {it.gamPerChild}g
                            </td>
                            <td className="p-2 text-right font-mono text-slate-600">
                              {it.buyQuantity !== undefined ? `${it.buyQuantity} ${it.unit}` : '-'}
                            </td>
                            <td className="p-2 text-right font-mono text-slate-600">
                              {it.price ? `${it.price.toLocaleString('vi-VN')} đ` : '-'}
                            </td>
                            <td className="p-2">
                              {it.matchedFood ? (
                                <span className="text-emerald-700 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>{it.matchedFood.name}</span>
                                </span>
                              ) : (
                                <span className="text-amber-600 italic">Dùng thông số chuẩn mặc định</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
          >
            Hủy
          </button>
          <button
            disabled={!importResult || importResult.days.length === 0}
            onClick={handleApply}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <span>
              {applyBothSheets && (importResult?.days.length || 0) > 1
                ? `Nạp đồng bộ cả 2 phân hệ (${targetBranch === 'branch_1' ? 'Cơ sở chính' : targetBranch === 'branch_2' ? 'Phân hiệu' : 'Toàn trường'})`
                : `Nạp phân hệ ${activeDay?.sheetName || ''} vào ngày hiện tại`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
