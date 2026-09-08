'use client';

import React, { useState } from 'react';
import { ComputedMenuItem, SupplierType } from '@/types/nutrition';
import { generateSmartPurchaseOrders, formatZaloOrderMessage, REGISTERED_SUPPLIERS } from '@/engine/smart-po';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  Truck,
  Copy,
  Printer,
  Clock,
  User,
  Phone,
  CheckCircle2,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface Props {
  date: string;
  items: ComputedMenuItem[];
  schoolName?: string;
  onShowToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const SmartPOView: React.FC<Props> = ({
  date,
  items,
  schoolName = 'Trường Mầm Non Hàm Thắng',
  onShowToast,
}) => {
  const [activeSupplier, setActiveSupplier] = useState<SupplierType>('thit_ca');
  const purchaseOrders = generateSmartPurchaseOrders(date, items);
  const currentPO = purchaseOrders[activeSupplier];

  const totalAllSuppliers = Object.values(purchaseOrders).reduce((acc, po) => acc + po.totalCost, 0);

  const handleCopyZalo = (po = currentPO) => {
    const text = formatZaloOrderMessage(po, schoolName);
    navigator.clipboard.writeText(text);
    onShowToast(`✓ Đã sao chép đơn đặt hàng gửi Zalo: ${po.supplier.name}`, 'success');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 p-4 md:p-6 text-xs text-slate-800">
      {/* Top Banner */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            QUẢN LÝ TIẾP PHẨM & SMART PURCHASE ORDER (5 NHÀ CUNG CẤP)
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Ngày: <strong className="text-slate-800">{date}</strong> | Tự động bóc tách thực đơn ngày thành 5 đơn hàng nhà xe độc lập.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopyZalo()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-all active:scale-95"
          >
            <Copy className="w-4 h-4" />
            <span>Sao chép Zalo ({currentPO.supplier.contactName.split(' ')[0]})</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold shadow-xs transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>In Phiếu Tiếp Phẩm (A4)</span>
          </button>
        </div>
      </div>

      {/* 5 Supplier Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4 select-none">
        {(Object.keys(REGISTERED_SUPPLIERS) as SupplierType[]).map((key) => {
          const sup = REGISTERED_SUPPLIERS[key];
          const po = purchaseOrders[key];
          const isActive = activeSupplier === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSupplier(key)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white/80 border-slate-200/80 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-600' : 'bg-slate-300'}`} />
                  <span className="text-[10px] font-bold text-slate-500 font-mono">
                    {sup.deliveryTime}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 line-clamp-1 text-xs">
                  {sup.name}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                  {sup.categoryName}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-[10px] text-slate-400 font-semibold">{po.items.length} món</span>
                <span className="text-xs font-black font-mono text-slate-900">
                  {formatCurrency(po.totalCost)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Supplier Header Info Card */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">{currentPO.supplier.name}</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px] border border-emerald-300">
              VietGAP / ATTP Chứng nhận
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-600 mt-1 text-[11px]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Giờ giao: <strong>{currentPO.supplier.deliveryTime}</strong>
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Phụ trách: <strong>{currentPO.supplier.contactName}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              SĐT: <strong>{currentPO.supplier.phone}</strong>
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-500 block">TỔNG TIỀN ĐƠN HÀNG:</span>
          <span className="text-base font-black font-mono text-blue-700">
            {formatCurrency(currentPO.totalCost)}
          </span>
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200">STT</th>
                <th className="py-2.5 px-4 border-r border-slate-200">Tên Nguyên Liệu / Thực Phẩm</th>
                <th className="py-2.5 px-3 text-center w-24 border-r border-slate-200">Bữa Ăn</th>
                <th className="py-2.5 px-3 text-center w-20 border-r border-slate-200">ĐVT</th>
                <th className="py-2.5 px-4 text-right w-36 border-r border-slate-200 bg-blue-50/70 text-blue-950 font-black">
                  Số Lượng Mua
                </th>
                <th className="py-2.5 px-4 text-right w-32 border-r border-slate-200">Đơn Giá</th>
                <th className="py-2.5 px-4 text-right w-36 bg-amber-50 text-amber-950 font-black">
                  Thành Tiền
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {currentPO.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                    Không có mặt hàng nào thuộc nhà cung ứng này trong ngày {date}.
                  </td>
                </tr>
              ) : (
                currentPO.items.map((it, idx) => (
                  <tr key={it.foodCode} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center border-r border-slate-100 font-sans text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100 font-bold font-sans text-slate-900">
                      {it.foodName}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-100 font-sans text-[11px] text-slate-600">
                      {it.mealSession === 'chinh_trua' ? 'Bữa trưa' : it.mealSession === 'xe' ? 'Bữa xế' : 'Phụ trưa'}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-100 font-sans text-slate-600">
                      {it.unit}
                    </td>
                    <td className="py-2.5 px-4 text-right border-r border-slate-100 bg-blue-50/20 font-black text-blue-900">
                      {formatNumber(it.buyQuantity, 2)}
                    </td>
                    <td className="py-2.5 px-4 text-right border-r border-slate-100 text-slate-700">
                      {formatCurrency(it.unitPrice)}
                    </td>
                    <td className="py-2.5 px-4 text-right bg-amber-50/30 text-amber-950 font-bold">
                      {formatCurrency(it.totalCost)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td colSpan={4} className="py-3 px-4 text-right border-r border-slate-300 uppercase">
                  TỔNG TIỀN ĐƠN HÀNG ({currentPO.items.length} MÓN)
                </td>
                <td className="py-3 px-4 border-r border-slate-300"></td>
                <td className="py-3 px-4 border-r border-slate-300"></td>
                <td className="py-3 px-4 text-right bg-amber-100/70 text-amber-950 text-sm font-black font-mono">
                  {formatCurrency(currentPO.totalCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
