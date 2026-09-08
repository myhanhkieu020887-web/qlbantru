'use client';

import React, { useState } from 'react';
import { ComputedMenuItem, SupplierType } from '@/types/nutrition';
import { generateSmartPurchaseOrders, formatZaloOrderMessage, REGISTERED_SUPPLIERS } from '@/engine/smart-po';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  X,
  Copy,
  Printer,
  Truck,
  CheckCircle2,
  Clock,
  Phone,
  User,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  items: ComputedMenuItem[];
  schoolName?: string;
  onShowToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const SmartPOModal: React.FC<Props> = ({
  isOpen,
  onClose,
  date,
  items,
  schoolName = 'Trường Mầm Non Hàm Thắng',
  onShowToast,
}) => {
  const [activeSupplier, setActiveSupplier] = useState<SupplierType>('thit_ca');
  const purchaseOrders = generateSmartPurchaseOrders(date, items);
  const currentPO = purchaseOrders[activeSupplier];

  const totalAllSuppliers = Object.values(purchaseOrders).reduce((acc, po) => acc + po.totalCost, 0);

  if (!isOpen) return null;

  const handleCopyZalo = () => {
    const text = formatZaloOrderMessage(currentPO, schoolName);
    navigator.clipboard.writeText(text);
    onShowToast(`✓ Đã sao chép đơn đặt hàng gửi nhà xe: ${currentPO.supplier.contactName}`, 'success');
  };

  const handlePrintPO = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-[#004b87] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                SMART PURCHASE ORDER (PO) — 5 NHÀ CUNG CẤP TIẾP PHẨM
              </h3>
              <p className="text-xs text-blue-100">
                Ngày: <span className="font-semibold">{date}</span> | {schoolName} | Tổng ngân sách 5 nhà xe: <span className="font-bold text-amber-300">{formatCurrency(totalAllSuppliers)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Supplier Tabs */}
        <div className="bg-gray-100 border-b border-gray-300 px-3 pt-2 flex gap-1 overflow-x-auto text-xs font-semibold">
          {(Object.keys(REGISTERED_SUPPLIERS) as SupplierType[]).map((key) => {
            const sup = REGISTERED_SUPPLIERS[key];
            const po = purchaseOrders[key];
            const isActive = activeSupplier === key;

            return (
              <button
                key={key}
                onClick={() => setActiveSupplier(key)}
                className={`px-3 py-2 rounded-t-md transition-all flex items-center gap-1.5 whitespace-nowrap border-t border-x ${
                  isActive
                    ? 'bg-white text-blue-900 border-gray-300 font-bold shadow-xs'
                    : 'bg-gray-200/80 text-gray-600 border-transparent hover:bg-gray-200'
                }`}
              >
                <span>{sup.name.split(' ')[0]} {sup.name.split(' ')[1]}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-300 text-gray-700'}`}>
                  {po.items.length} món
                </span>
              </button>
            );
          })}
        </div>

        {/* Supplier Details Card */}
        <div className="px-5 py-3 bg-blue-50/50 border-b border-gray-200 flex flex-wrap items-center justify-between text-xs gap-3">
          <div>
            <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <span>{currentPO.supplier.name}</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Đã chứng nhận VietGAP / ATTP
              </span>
            </div>
            <div className="flex items-center gap-4 text-gray-600 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Giờ giao hàng: <strong className="text-gray-900">{currentPO.supplier.deliveryTime}</strong>
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Người phụ trách: <strong className="text-gray-900">{currentPO.supplier.contactName}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Số điện thoại: <strong className="text-gray-900">{currentPO.supplier.phone}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyZalo}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold shadow-xs transition-all text-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép Zalo Nhà xe</span>
            </button>
            <button
              onClick={handlePrintPO}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded font-semibold shadow-xs transition-all text-xs"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              <span>In Phiếu Tiếp Phẩm (A4)</span>
            </button>
          </div>
        </div>

        {/* Table of Items */}
        <div className="flex-1 overflow-auto p-4">
          {currentPO.items.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              Không có mặt hàng nào thuộc nhà cung cấp này trong ngày {date}.
            </div>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead className="bg-[#f0f4f8] text-gray-700 font-bold border-y border-gray-300">
                <tr>
                  <th className="py-2 px-2 text-center w-10 border-r border-gray-300">STT</th>
                  <th className="py-2 px-3 text-left border-r border-gray-300">Tên thực phẩm / Nguyên liệu</th>
                  <th className="py-2 px-2 text-center w-16 border-r border-gray-300">Bữa ăn</th>
                  <th className="py-2 px-2 text-center w-16 border-r border-gray-300">ĐVT</th>
                  <th className="py-2 px-3 text-right w-28 border-r border-gray-300 bg-blue-50/70 text-blue-950 font-black">
                    Số lượng thực mua
                  </th>
                  <th className="py-2 px-3 text-right w-28 border-r border-gray-300">Đơn giá (đ)</th>
                  <th className="py-2 px-3 text-right w-32 bg-amber-50 text-amber-950 font-black">
                    Thành tiền (đ)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-mono">
                {currentPO.items.map((item, idx) => (
                  <tr key={item.foodCode} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-2 px-2 text-center border-r border-gray-200 text-gray-500 font-sans">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-gray-200 font-medium font-sans text-gray-900">
                      {item.foodName}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-gray-200 font-sans text-[11px] text-gray-600">
                      {item.mealSession === 'chinh_trua' ? 'Trưa' : item.mealSession === 'xe' ? 'Xế' : 'Phụ'}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-gray-200 text-gray-600 font-sans">
                      {item.unit}
                    </td>
                    <td className="py-2 px-3 text-right border-r border-gray-200 bg-blue-50/30 text-blue-900 font-bold">
                      {formatNumber(item.buyQuantity, 2)}
                    </td>
                    <td className="py-2 px-3 text-right border-r border-gray-200 text-gray-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2 px-3 text-right bg-amber-50/50 text-amber-950 font-bold">
                      {formatCurrency(item.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold text-gray-900 border-t-2 border-gray-400">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 text-right border-r border-gray-300 uppercase">
                    TỔNG TIỀN ĐƠN HÀNG ({currentPO.items.length} mặt hàng)
                  </td>
                  <td className="py-2.5 px-3 text-right border-r border-gray-300 font-mono">
                    {/* Sum of buy qty if meaningful */}
                  </td>
                  <td className="py-2.5 px-3 border-r border-gray-300"></td>
                  <td className="py-2.5 px-3 text-right bg-amber-100 text-amber-950 text-sm font-black font-mono">
                    {formatCurrency(currentPO.totalCost)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-300 px-5 py-3 flex items-center justify-between text-xs">
          <div className="text-gray-500">
            * Phiếu tiếp phẩm được lập tự động dựa trên kết quả cân đối khẩu phần dinh dưỡng.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
