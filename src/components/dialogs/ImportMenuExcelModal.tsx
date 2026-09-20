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
  onApplyParsedMenu: (dayMenu: ParsedDayMenu) => void;
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi đọc file Excel');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApply = () => {
    if (importResult && importResult.days.length > 0) {
      onApplyParsedMenu(importResult.days[0]);
      onClose();
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/api/templates/menu-excel', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">Nhập Thực Đơn Chính Thức Từ File Excel</h3>
              <p className="text-xs text-emerald-200">
                Tự động nhận diện nguyên liệu, định lượng g/trẻ và khớp với Danh mục Viện Dinh Dưỡng
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
              <div className="font-bold text-slate-800 text-xs">Chưa có file mẫu chuẩn của phần mềm?</div>
              <p className="text-slate-500 text-[11px]">
                Tải file Excel mẫu chuẩn hóa kèm danh mục 120+ thực phẩm để tham khảo hoặc chỉnh sửa.
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
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
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
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Upload className="w-6 h-6" />
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
                <p className="text-slate-400 text-[11px]">Hỗ trợ định dạng .xlsx, .xls (Theo ngày hoặc theo tuần)</p>
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
            <div className="space-y-3 pt-2">
              {/* Thẻ thống kê */}
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="font-bold text-slate-800">{importResult.message}</div>
                    <div className="text-slate-500 text-[11px]">
                      Kiểu nhận diện: {importResult.mode === 'ingredients' ? 'Định lượng nguyên liệu chi tiết' : 'Danh mục món ăn'}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-emerald-700 text-sm">
                    {importResult.matchedItemsCount} / {importResult.totalItems}
                  </span>
                  <span className="text-slate-500 text-[11px] block">thực phẩm khớp chuẩn</span>
                </div>
              </div>

              {/* Bảng xem trước nguyên liệu */}
              {importResult.days[0] && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50 px-3 py-2 font-bold text-slate-700 border-b border-slate-200 flex justify-between items-center">
                    <span>Xem trước dữ liệu nguyên liệu sẽ nạp</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Tiêu đề: {importResult.days[0].menuTitle.trua || 'Bữa trưa'}
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 font-semibold text-[11px]">
                        <tr>
                          <th className="p-2 border-b">STT</th>
                          <th className="p-2 border-b">Tên thực phẩm đọc từ Excel</th>
                          <th className="p-2 border-b">Bữa ăn</th>
                          <th className="p-2 border-b text-right">g/trẻ</th>
                          <th className="p-2 border-b">Khớp với Viện Dinh Dưỡng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {importResult.days[0].items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-medium text-slate-800">{it.foodName}</td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                                {it.mealSession}
                              </span>
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-blue-700">
                              {it.gamPerChild}g
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
            <span>Nạp vào thực đơn ngày hiện tại</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
