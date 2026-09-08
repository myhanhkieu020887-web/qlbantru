'use client';

import React, { useState } from 'react';
import { Sparkles, X, Check, BookOpen } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (scope: 'day' | 'week') => void;
}

const TEMPLATES = [
  {
    id: 'tpl_beyeu',
    title: 'Thực đơn Bé Yêu (Chuẩn QĐ 2195 & Codex)',
    desc: 'Thực đơn tuần cân đối sẵn theo tài liệu Thuc_don_Be_yeu.md (Thịt kho tàu, cá kho nấm bào ngư, canh cua đồng, súp gà...)',
    badge: 'Khuyến nghị',
  },
  {
    id: 'tpl_hamthang',
    title: 'Thực đơn Bán trú Trường MN Hàm Thắng',
    desc: 'Thực đơn thực tế ngày 09/09/2026 khớp 100% hồ sơ thanh tra (Cá nạc, tôm đồng, bún tươi, bánh canh chả cá trứng cút)',
    badge: 'Thực tế',
  },
  {
    id: 'tpl_highprotein',
    title: 'Thực đơn Tăng cường Vi chất & Đạm động vật',
    desc: 'Thiết kế cho các trường bán trú đẩy mạnh phát triển chiều cao (Canxi >= 300mg, Đạm ĐV >= 65%)',
    badge: 'Chuyên sâu',
  },
];

export const ApplyTemplateModal: React.FC<Props> = ({ isOpen, onClose, onApplyTemplate }) => {
  const [selectedTpl, setSelectedTpl] = useState('tpl_beyeu');
  const [scope, setScope] = useState<'day' | 'week'>('week');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-bold text-base">Áp dụng Thực đơn Mẫu (Chu kỳ 4 Tuần)</h3>
              <p className="text-xs text-blue-100">Chọn mẫu thực đơn dinh dưỡng chuẩn hóa Bộ GD&ĐT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <label className="block text-xs font-bold text-gray-700">Chọn Thư viện Thực đơn Mẫu:</label>
          <div className="space-y-2">
            {TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => setSelectedTpl(tpl.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedTpl === tpl.id
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-300/30'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-gray-900">{tpl.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                    {tpl.badge}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">{tpl.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-200">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Phạm vi áp dụng:</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'week'}
                  onChange={() => setScope('week')}
                  className="text-blue-600"
                />
                <span className="font-semibold text-gray-800">Cả tuần (Thứ 2 → Thứ 6)</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'day'}
                  onChange={() => setScope('day')}
                  className="text-blue-600"
                />
                <span className="font-semibold text-gray-800">Chỉ ngày đang chọn</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onApplyTemplate(scope);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Xác nhận Áp dụng</span>
          </button>
        </div>
      </div>
    </div>
  );
};
