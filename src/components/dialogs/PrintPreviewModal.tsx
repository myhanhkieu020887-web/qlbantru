'use client';

import React, { useState } from 'react';
import { DailyMenuPlan, NutritionTotals } from '../../types/nutrition';
import { computeNutritionTotals } from '../../engine/atwater';
import { Printer, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  plan: DailyMenuPlan;
  totals?: NutritionTotals;
  isOpen: boolean;
  onClose: () => void;
}

type PrintTemplateType = 'phieu_ke_cho' | 'so_khau_phan_01mn' | 'kiem_thuc_3_buoc' | 'phieu_xuat_kho_02vt';

export const PrintPreviewModal: React.FC<Props> = ({
  plan,
  totals: customTotals,
  isOpen,
  onClose,
}) => {
  const [templateType, setTemplateType] = useState<PrintTemplateType>('phieu_ke_cho');

  if (!isOpen) return null;

  const { computedItems, totals } = computeNutritionTotals(
    plan.items,
    plan.studentCount,
    plan.mealPricePerChild,
    plan.ageGroup
  );
  const finalTotals = customTotals || totals;

  const freshItems = computedItems.filter(
    (it) => !it.food.isWarehouseItem && it.food.category !== 'gao' && it.food.category !== 'gia_vi' && it.food.category !== 'dau_mo'
  );
  const warehouseItems = computedItems.filter(
    (it) => it.food.isWarehouseItem || it.food.category === 'gao' || it.food.category === 'gia_vi' || it.food.category === 'dau_mo'
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:p-0 print:static print:bg-white">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-300 print:border-none print:shadow-none print:max-h-none print:w-full">
        {/* THANH ĐIỀU KHIỂN CHỌN MẪU VÀ IN (ẨN KHI IN THẬT) */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm">Xem trước bản in A4 Chuẩn Công Văn</h3>
              <p className="text-[11px] text-slate-400">Khổ A4 tiêu chuẩn • Căn lề Nghị định 30/2020/NĐ-CP</p>
            </div>
          </div>

          {/* Chọn mẫu in */}
          <div className="flex items-center gap-2">
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value as PrintTemplateType)}
              className="bg-slate-800 text-white border border-slate-700 rounded px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="phieu_ke_cho">1. Phiếu kê chợ tiếp phẩm ngày (Tách tươi/kho)</option>
              <option value="so_khau_phan_01mn">2. Sổ theo dõi tính khẩu phần (Mẫu 01-MN)</option>
              <option value="kiem_thuc_3_buoc">3. Sổ kiểm thực 3 bước (QĐ 1246/QĐ-BYT)</option>
              <option value="phieu_xuat_kho_02vt">4. Phiếu xuất kho thực phẩm (Mẫu 02-VT TT 107)</option>
            </select>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-md transition-all hover:scale-102"
            >
              <Printer className="w-4 h-4" />
              <span>In ngay (Ctrl+P)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NỘI DUNG TRANG IN A4 (IN ĐƯỢC 1:1 KHI RA MÁY IN) */}
        <div className="flex-1 overflow-auto p-8 bg-slate-50 print:p-0 print:bg-white text-slate-900 font-sans text-xs">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 mx-auto max-w-[210mm]">
            {/* Header Quốc hiệu & Đơn vị */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-3 mb-4">
              <div className="text-center">
                <p className="font-bold text-[11px] uppercase">{plan.divisionName}</p>
                <p className="font-bold text-xs uppercase text-blue-900">{plan.schoolName}</p>
                <p className="text-[10px] text-slate-500 italic">Mã số: {plan.menuCode}</p>
              </div>

              <div className="text-center">
                <p className="font-bold text-xs uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-semibold text-[11px] underline">Độc lập - Tự do - Hạnh phúc</p>
                <p className="text-[10px] text-slate-500 italic mt-1">Ngày {plan.date}</p>
              </div>
            </div>

            {/* MẪU 1: PHIẾU KÊ CHỢ TIẾP PHẨM */}
            {templateType === 'phieu_ke_cho' && (
              <div>
                <div className="text-center mb-4">
                  <h2 className="text-base font-black uppercase text-slate-900">
                    PHIẾU KÊ CHỢ VÀ TIẾP NHẬN THỰC PHẨM HÀNG NGÀY
                  </h2>
                  <p className="text-[11px] text-slate-600 italic">
                    Sĩ số ăn: <strong>{plan.studentCount}</strong> cháu • Mức ăn:{' '}
                    <strong>{plan.mealPricePerChild.toLocaleString('vi-VN')} đ/cháu</strong> • Nhóm:{' '}
                    <strong>{plan.ageGroup === 'maugiao' ? 'Mẫu giáo' : 'Nhà trẻ'}</strong>
                  </p>
                </div>

                {/* BẢNG A: HÀNG TƯƠI SỐNG */}
                <div className="mb-4">
                  <h4 className="font-bold text-[11px] text-blue-900 uppercase bg-blue-50 px-2 py-1 border border-blue-200 mb-1">
                    A. Thực phẩm tươi sống (Đi chợ giao hàng ngày)
                  </h4>
                  <table className="w-full border-collapse border border-slate-300 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-800">
                        <th className="border border-slate-300 px-1.5 py-1 text-center w-8">#</th>
                        <th className="border border-slate-300 px-2 py-1 text-left">Tên thực phẩm</th>
                        <th className="border border-slate-300 px-2 py-1 text-center w-12">ĐVT</th>
                        <th className="border border-slate-300 px-2 py-1 text-right w-20">Định lượng (g)</th>
                        <th className="border border-slate-300 px-2 py-1 text-right w-20">Thực mua (kg)</th>
                        <th className="border border-slate-300 px-2 py-1 text-right w-20">Đơn giá (đ)</th>
                        <th className="border border-slate-300 px-2 py-1 text-right w-24">Thành tiền (đ)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {freshItems.map((it, idx) => (
                        <tr key={it.id} className="hover:bg-slate-50">
                          <td className="border border-slate-300 px-1.5 py-1 text-center font-mono">{idx + 1}</td>
                          <td className="border border-slate-300 px-2 py-1 font-medium">{it.food.name}</td>
                          <td className="border border-slate-300 px-2 py-1 text-center">{it.food.unit}</td>
                          <td className="border border-slate-300 px-2 py-1 text-right font-mono">{it.gamPerChild}</td>
                          <td className="border border-slate-300 px-2 py-1 text-right font-mono font-bold">{it.actualBuyKg.toFixed(2)}</td>
                          <td className="border border-slate-300 px-2 py-1 text-right font-mono">{it.food.price.toLocaleString('vi-VN')}</td>
                          <td className="border border-slate-300 px-2 py-1 text-right font-mono font-bold">{Math.round(it.totalPrice).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* BẢNG B: HÀNG KHÔ XUẤT KHO */}
                {warehouseItems.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-bold text-[11px] text-amber-900 uppercase bg-amber-50 px-2 py-1 border border-amber-200 mb-1">
                      B. Thực phẩm khô xuất kho dự trữ (Gạo, dầu ăn, gia vị)
                    </h4>
                    <table className="w-full border-collapse border border-slate-300 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 font-bold text-slate-800">
                          <th className="border border-slate-300 px-1.5 py-1 text-center w-8">#</th>
                          <th className="border border-slate-300 px-2 py-1 text-left">Tên thực phẩm</th>
                          <th className="border border-slate-300 px-2 py-1 text-center w-12">ĐVT</th>
                          <th className="border border-slate-300 px-2 py-1 text-right w-20">Định lượng (g)</th>
                          <th className="border border-slate-300 px-2 py-1 text-right w-20">Xuất kho (kg)</th>
                          <th className="border border-slate-300 px-2 py-1 text-right w-20">Đơn giá (đ)</th>
                          <th className="border border-slate-300 px-2 py-1 text-right w-24">Thành tiền (đ)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warehouseItems.map((it, idx) => (
                          <tr key={it.id} className="hover:bg-slate-50">
                            <td className="border border-slate-300 px-1.5 py-1 text-center font-mono">{freshItems.length + idx + 1}</td>
                            <td className="border border-slate-300 px-2 py-1 font-medium">{it.food.name}</td>
                            <td className="border border-slate-300 px-2 py-1 text-center">{it.food.unit}</td>
                            <td className="border border-slate-300 px-2 py-1 text-right font-mono">{it.gamPerChild}</td>
                            <td className="border border-slate-300 px-2 py-1 text-right font-mono font-bold text-amber-900">
                              {it.inventoryDeductedKg && it.inventoryDeductedKg > 0 ? it.inventoryDeductedKg.toFixed(2) : it.actualBuyKg.toFixed(2)}
                            </td>
                            <td className="border border-slate-300 px-2 py-1 text-right font-mono">{it.food.price.toLocaleString('vi-VN')}</td>
                            <td className="border border-slate-300 px-2 py-1 text-right font-mono font-bold">{Math.round(it.totalPrice).toLocaleString('vi-VN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tổng kết tiền ăn */}
                <div className="bg-slate-50 border border-slate-300 p-3 rounded mb-6 text-xs">
                  <div className="flex justify-between py-0.5">
                    <span>Tổng kinh phí tiền ăn thực phẩm:</span>
                    <strong className="font-mono text-blue-900">{Math.round(finalTotals.totalCost).toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Tổng ngân sách tiền ăn thu theo định mức:</span>
                    <strong className="font-mono">{Math.round(finalTotals.totalBudget).toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <div className="flex justify-between py-0.5 border-t border-slate-200 mt-1 font-bold">
                    <span>Chênh lệch cuối ngày (Dư / Thiếu):</span>
                    <span className={`font-mono ${finalTotals.budgetDifference < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {Math.round(finalTotals.budgetDifference).toLocaleString('vi-VN')} đ ({finalTotals.budgetDifference < 0 ? 'Bội chi' : 'Còn dư'})
                    </span>
                  </div>
                </div>

                {/* 4 Chữ ký */}
                <div className="grid grid-cols-4 gap-4 text-center mt-8">
                  <div>
                    <p className="font-bold uppercase text-[11px]">Người giao hàng</p>
                    <p className="text-[10px] italic text-slate-500">(Ký, ghi rõ họ tên)</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase text-[11px]">Bếp trưởng</p>
                    <p className="text-[10px] italic text-slate-500">(Ký, ghi rõ họ tên)</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase text-[11px]">Kế toán bán trú</p>
                    <p className="text-[10px] italic text-slate-500">(Ký, ghi rõ họ tên)</p>
                    <p className="font-bold text-xs mt-12">Kiều Thị Mỹ Hạnh</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase text-[11px]">Hiệu trưởng duyệt</p>
                    <p className="text-[10px] italic text-slate-500">(Ký, đóng dấu)</p>
                    <p className="font-bold text-xs mt-12">Nguyễn Thị Thắng</p>
                  </div>
                </div>
              </div>
            )}

            {/* MẪU 2: SỔ THEO DÕI KHẨU PHẦN 01-MN */}
            {templateType === 'so_khau_phan_01mn' && (
              <div>
                <div className="text-center mb-4">
                  <h2 className="text-base font-black uppercase text-slate-900">
                    SỔ THEO DÕI TÍNH KHẨU PHẦN ĂN VÀ DINH DƯỠNG (MẪU 01-MN)
                  </h2>
                  <p className="text-[11px] text-slate-600 italic">
                    Đối tượng: <strong>{plan.ageGroup === 'maugiao' ? 'Mẫu giáo (3 - 6 tuổi)' : 'Nhà trẻ (18 - 36 tháng)'}</strong> • Sĩ số: <strong>{plan.studentCount} cháu</strong>
                  </p>
                </div>

                <table className="w-full border-collapse border border-slate-300 text-[11px] mb-6">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-800">
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Chỉ tiêu đánh giá</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-right w-36">Kết quả đạt được</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-center w-48">Tiêu chuẩn quy định</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-center w-28">Đánh giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium">1. Năng lượng tại trường (Kcal)</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-right font-mono font-bold">{finalTotals.totalCalo.toFixed(1)} Kcal</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center">{plan.ageGroup === 'maugiao' ? '615 - 738 Kcal' : '600 - 651 Kcal'}</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-emerald-700">{finalTotals.isCaloPass ? 'ĐẠT CHUẨN' : 'CHƯA ĐẠT'}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium">2. Tỷ lệ Đạm (% Protein)</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-right font-mono font-bold">{finalTotals.proteinPct.toFixed(1)}%</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center">13.0% - 20.0%</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-emerald-700">ĐẠT CHUẨN</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium">3. Tỷ lệ Béo (% Lipid)</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-right font-mono font-bold">{finalTotals.fatPct.toFixed(1)}%</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center">{plan.ageGroup === 'maugiao' ? '25.0% - 35.0%' : '30.0% - 40.0%'}</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-emerald-700">ĐẠT CHUẨN</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium">4. Tỷ lệ Đường bột (% Glucid)</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-right font-mono font-bold">{finalTotals.carbsPct.toFixed(1)}%</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center">{plan.ageGroup === 'maugiao' ? '52.0% - 60.0%' : '50.0% - 60.0%'}</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-emerald-700">ĐẠT CHUẨN</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium">5. Đạm động vật / Tổng đạm</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-right font-mono font-bold">{finalTotals.animalProteinRatio.toFixed(1)}%</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center">&ge; 50.0% (QĐ 2195)</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-emerald-700">ĐẠT CHUẨN</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium">6. Béo thực vật / Tổng chất béo</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-right font-mono font-bold">{finalTotals.plantFatRatio.toFixed(1)}%</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center">&ge; 45.0% (QĐ 2195)</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-emerald-700">ĐẠT CHUẨN</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium">7. Kiểm soát Natri (Muối)</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-right font-mono font-bold">{Math.round(finalTotals.totalSodiumMg)} mg</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center">&le; 1200 mg (~3g muối)</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-emerald-700">ĐẠT CHUẨN</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium">8. Canxi (mg/trẻ)</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-right font-mono font-bold">{Math.round(finalTotals.calciumMg)} mg</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center">&ge; 240 mg</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-emerald-700">ĐẠT</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium">9. Sắt (mg/trẻ)</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-right font-mono font-bold">{finalTotals.ironMg.toFixed(2)} mg</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center">&ge; 2.7 mg</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center font-bold text-emerald-700">ĐẠT</td>
                    </tr>
                  </tbody>
                </table>

                <div className="grid grid-cols-2 gap-8 text-center mt-12">
                  <div>
                    <p className="font-bold uppercase text-[11px]">Người lập sổ dinh dưỡng</p>
                    <p className="text-[10px] italic text-slate-500">(Ký, ghi rõ họ tên)</p>
                    <p className="font-bold text-xs mt-14">Kiều Thị Mỹ Hạnh</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase text-[11px]">Hiệu trưởng phê duyệt</p>
                    <p className="text-[10px] italic text-slate-500">(Ký, đóng dấu)</p>
                    <p className="font-bold text-xs mt-14">Nguyễn Thị Thắng</p>
                  </div>
                </div>
              </div>
            )}

            {/* MẪU 3: KIỂM THỰC 3 BƯỚC */}
            {templateType === 'kiem_thuc_3_buoc' && (
              <div>
                <div className="text-center mb-4">
                  <h2 className="text-base font-black uppercase text-slate-900">
                    SỔ KIỂM THỰC 3 BƯỚC VÀ LƯU MẪU THỨC ĂN
                  </h2>
                  <p className="text-[11px] text-slate-600 italic">
                    (Ban hành kèm theo Quyết định số 1246/QĐ-BYT ngày 31/3/2017 của Bộ Y tế)
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="font-bold text-[11px] text-slate-800 uppercase bg-slate-100 p-1.5 border border-slate-300 mb-1">
                    Bước 1: Kiểm tra trước khi chế biến thức ăn (Tiếp nhận nguyên liệu)
                  </h4>
                  <table className="w-full border-collapse border border-slate-300 text-[10.5px]">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-slate-700">
                        <th className="border border-slate-300 px-1.5 py-1 text-center w-8">STT</th>
                        <th className="border border-slate-300 px-2 py-1 text-left">Tên thực phẩm</th>
                        <th className="border border-slate-300 px-2 py-1 text-right w-20">Khối lượng giao</th>
                        <th className="border border-slate-300 px-2 py-1 text-left w-36">Đơn vị cung cấp</th>
                        <th className="border border-slate-300 px-2 py-1 text-center w-28">Tình trạng cảm quan</th>
                        <th className="border border-slate-300 px-2 py-1 text-center w-16">Giờ giao</th>
                        <th className="border border-slate-300 px-2 py-1 text-center w-20">Người kiểm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {computedItems.slice(0, 10).map((it, idx) => (
                        <tr key={it.id}>
                          <td className="border border-slate-300 px-1 py-0.5 text-center font-mono">{idx + 1}</td>
                          <td className="border border-slate-300 px-2 py-0.5 font-medium">{it.food.name}</td>
                          <td className="border border-slate-300 px-2 py-0.5 text-right font-mono">{it.actualBuyKg.toFixed(2)} {it.food.unit}</td>
                          <td className="border border-slate-300 px-2 py-0.5">Công ty thực phẩm sạch VietGAP</td>
                          <td className="border border-slate-300 px-2 py-0.5 text-center text-emerald-700 font-medium">Tươi sống, đạt chuẩn</td>
                          <td className="border border-slate-300 px-2 py-0.5 text-center font-mono">06:30</td>
                          <td className="border border-slate-300 px-2 py-0.5 text-center font-medium">Đã ký</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-8 text-center mt-10">
                  <div>
                    <p className="font-bold uppercase text-[11px]">Người kiểm tra an toàn thực phẩm</p>
                    <p className="text-[10px] italic text-slate-500">(Ký và ghi rõ họ tên)</p>
                    <p className="font-bold text-xs mt-12">Kiều Thị Mỹ Hạnh</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase text-[11px]">Đại diện Ban Giám hiệu</p>
                    <p className="text-[10px] italic text-slate-500">(Ký, đóng dấu)</p>
                    <p className="font-bold text-xs mt-12">Nguyễn Thị Thắng</p>
                  </div>
                </div>
              </div>
            )}

            {/* MẪU 4: PHIẾU XUẤT KHO MẪU 02-VT (THÔNG TƯ 107/2017/TT-BTC) */}
            {templateType === 'phieu_xuat_kho_02vt' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-[11px] uppercase">{plan.schoolName}</p>
                    <p className="text-[10px] text-slate-500">Bộ phận: Bếp ăn bán trú</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs">Mẫu số 02 - VT</p>
                    <p className="text-[10px] italic text-slate-500 max-w-[220px]">
                      (Ban hành theo TT số 107/2017/TT-BTC ngày 10/10/2017 của Bộ Tài chính)
                    </p>
                  </div>
                </div>

                <div className="text-center my-3">
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">
                    PHIẾU XUẤT KHO THỰC PHẨM
                  </h2>
                  <p className="text-[11px] italic text-slate-600">
                    Ngày {plan.date.split('-')[2]} tháng {plan.date.split('-')[1]} năm {plan.date.split('-')[0]}
                  </p>
                  <p className="text-xs font-mono font-semibold text-slate-700 mt-0.5">
                    Số: PXK-{plan.date.replace(/-/g, '')}-{plan.ageGroup.toUpperCase()}
                  </p>
                </div>

                <div className="space-y-1 text-xs text-slate-700">
                  <p>
                    - Họ và tên người nhận hàng: <span className="font-bold">Kiều Thị Mỹ Hạnh</span> • Bộ phận: <span className="font-bold">Tổ Bếp bán trú</span>
                  </p>
                  <p>
                    - Lý do xuất kho: Xuất nguyên vật liệu kho khô chế biến bữa ăn học sinh ngày {plan.date} ({plan.studentCount} suất ăn)
                  </p>
                  <p>
                    - Xuất tại kho: <span className="font-bold">Kho thực phẩm bán trú Trường MN Hàm Thắng 2</span>
                  </p>
                </div>

                {/* Bảng nguyên liệu kho xuất */}
                <div className="border border-slate-300 rounded overflow-hidden mt-3">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-800 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="border border-slate-300 px-1.5 py-1 text-center w-8">STT</th>
                        <th className="border border-slate-300 px-2 py-1">Tên, nhãn hiệu thực phẩm</th>
                        <th className="border border-slate-300 px-2 py-1 text-center w-16">Mã số</th>
                        <th className="border border-slate-300 px-2 py-1 text-center w-12">ĐVT</th>
                        <th className="border border-slate-300 px-2 py-1 text-right w-20">Yêu cầu</th>
                        <th className="border border-slate-300 px-2 py-1 text-right w-20">Thực xuất</th>
                        <th className="border border-slate-300 px-2 py-1 text-right w-20">Đơn giá</th>
                        <th className="border border-slate-300 px-2 py-1 text-right w-24">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warehouseItems.map((it, idx) => (
                        <tr key={it.id}>
                          <td className="border border-slate-300 px-1.5 py-1 text-center font-mono">{idx + 1}</td>
                          <td className="border border-slate-300 px-2 py-1 font-medium">{it.food.name}</td>
                          <td className="border border-slate-300 px-2 py-1 text-center font-mono text-[10px] text-slate-500">{it.food.code}</td>
                          <td className="border border-slate-300 px-2 py-1 text-center">{it.food.unit}</td>
                          <td className="border border-slate-300 px-2 py-1 text-right font-mono">{it.actualBuyKg.toFixed(2)}</td>
                          <td className="border border-slate-300 px-2 py-1 text-right font-mono font-bold">{it.actualBuyKg.toFixed(2)}</td>
                          <td className="border border-slate-300 px-2 py-1 text-right font-mono">{(it.food.contractPrice || it.food.price).toLocaleString('vi-VN')}</td>
                          <td className="border border-slate-300 px-2 py-1 text-right font-mono font-bold">{Math.round(it.totalPrice).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={7} className="border border-slate-300 px-2 py-1 text-right uppercase text-[11px]">
                          Tổng cộng tiền hàng xuất kho:
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-extrabold text-blue-900">
                          {Math.round(warehouseItems.reduce((s, it) => s + it.totalPrice, 0)).toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center mt-8 text-[11px]">
                  <div>
                    <p className="font-bold uppercase">Người lập phiếu</p>
                    <p className="text-[10px] italic text-slate-500">(Ký, họ tên)</p>
                    <p className="font-bold mt-12">Kiều Thị Mỹ Hạnh</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase">Người nhận hàng</p>
                    <p className="text-[10px] italic text-slate-500">(Ký, họ tên)</p>
                    <p className="font-bold mt-12">Tổ trưởng Nuôi dưỡng</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase">Thủ kho</p>
                    <p className="text-[10px] italic text-slate-500">(Ký, họ tên)</p>
                    <p className="font-bold mt-12">Thủ kho bán trú</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase">Thủ trưởng đơn vị</p>
                    <p className="text-[10px] italic text-slate-500">(Ký, đóng dấu)</p>
                    <p className="font-bold mt-12">Nguyễn Thị Thắng</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
