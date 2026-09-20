'use client';

import React from 'react';
import {
  BookOpen,
  X,
  FileSpreadsheet,
  Users,
  Sparkles,
  CheckCircle2,
  Download,
  ArrowRight,
  ShieldCheck,
  Building2,
  ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenExcelImport: () => void;
  onRunSolver: () => void;
  onExportBranchExcel: () => void;
}

export const WorkflowGuideModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenExcelImport,
  onRunSolver,
  onExportBranchExcel,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: 'Nạp Thực Đơn Chính Thức Từ File Excel Mẫu',
      tag: 'Đầu vào dữ liệu',
      desc: 'Sử dụng file Excel thực đơn của trường (hoặc tải file mẫu chuẩn của hệ thống). Nhập danh sách món và nguyên liệu. Hệ thống tự động đối chiếu với danh mục 120+ thực phẩm chuẩn Viện Dinh Dưỡng.',
      actionLabel: 'Mở cửa sổ Nạp Excel',
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />,
      badgeColor: 'bg-emerald-100 text-emerald-800',
      action: () => {
        onClose();
        onOpenExcelImport();
      },
    },
    {
      num: 2,
      title: 'Cập Nhật Sĩ Số & Điểm Danh 2 Điểm Trường',
      tag: 'Phân bổ sĩ số',
      desc: 'Kiểm tra sĩ số thực tế ăn bán trú trong ngày tại Cơ sở chính (Đ1: 850 trẻ) và Phân hiệu (Đ2: 360 trẻ). Hệ thống tự động tính tỷ lệ phân bổ khối lượng mua hàng cho từng bếp.',
      icon: <Building2 className="w-5 h-5 text-blue-600" />,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      num: 3,
      title: 'Cân Bằng "Lượng" & "Chất" (Phím F9 / Solver MILP)',
      tag: 'Tối ưu hóa QĐ 2195',
      desc: 'Bấm 1-Click (hoặc F9): Hệ thống tự động vi chỉnh gam thực phẩm để đưa Năng lượng vào dải vàng (615 - 727 Kcal), cân bằng P-L-C (13-20% : 25-35% : 52-60%), Đạm ĐV ≥ 50% và khóa cứng ngân sách đúng 21.000đ/trẻ.',
      actionLabel: 'Chạy Cân đối F9 ngay',
      icon: <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />,
      badgeColor: 'bg-amber-100 text-amber-800',
      action: () => {
        onClose();
        onRunSolver();
      },
    },
    {
      num: 4,
      title: 'Hiệu Trưởng / Kế Toán Thẩm Định & Phê Duyệt',
      tag: 'Phê duyệt & Khóa sổ',
      desc: 'Kiểm tra ma trận dinh dưỡng 7 dòng, các chỉ số vi chất (Canxi, Sắt, Vitamin). Ban Giám Hiệu bấm duyệt thực đơn và khóa sổ bán trú ngày để đảm bảo tính pháp lý trước giờ đi chợ.',
      icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      num: 5,
      title: 'Xuất File Excel Phiếu Đi Chợ Từng Điểm Trường',
      tag: 'Thực thi đi chợ',
      desc: 'Xuất file Excel chuyên nghiệp gồm 3 Sheet: Sheet 1 (Tổng hợp cả trường đặt nhà cung cấp), Sheet 2 (Phiếu giao nhận Đ1 - 850 trẻ), Sheet 3 (Phiếu giao nhận Đ2 - 360 trẻ). Có sẵn bảng chữ ký người nhận.',
      actionLabel: 'Tải Excel Đi Chợ Điểm Trường',
      icon: <Download className="w-5 h-5 text-teal-600" />,
      badgeColor: 'bg-teal-100 text-teal-800',
      action: () => {
        onClose();
        onExportBranchExcel();
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Quy Trình Chuẩn Bán Trú Mầm Non (SOP 5 Bước)</h3>
              <p className="text-xs text-slate-400">
                Chuẩn Quyết định 2195/QĐ-BGDĐT & Thông tư 51/2020/TT-BGDĐT • Áp dụng Mẫu Giáo Hàm Thắng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-blue-900 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold">Mục tiêu quy trình: </span>
              <span>Từ file thực đơn thô ban đầu → Cân bằng định lượng & chất → Xuất phiếu tiếp phẩm phân bổ chính xác từng điểm trường.</span>
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((s) => (
              <div
                key={s.num}
                className="border border-slate-200 hover:border-blue-400 rounded-xl p-4 bg-white shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0 mt-0.5 text-xs">
                    {s.num}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{s.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${s.badgeColor}`}>
                        {s.tag}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>

                {s.action && (
                  <button
                    onClick={s.action}
                    className="sm:self-center px-3.5 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-bold rounded-lg border border-slate-300 hover:border-blue-600 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer text-xs"
                  >
                    <span>{s.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 italic">
            Tài liệu hướng dẫn chi tiết lưu trữ tại thư mục dự án: HUONG_DAN_QUY_TRINH_BAN_TRU.md
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            Đã hiểu quy trình
          </button>
        </div>
      </div>
    </div>
  );
};
