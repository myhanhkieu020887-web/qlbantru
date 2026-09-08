'use client';

import React, { useState } from 'react';
import {
  Users,
  Apple,
  CookingPot,
  BookOpenCheck,
  ArrowDownToLine,
  Package,
  History,
  FileText,
  Scale,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

export type PmsSubModule =
  | 'suppliers'          // 1. Nhà cung cấp
  | 'school_food'        // 2. Thực phẩm trường
  | 'recipes'            // 3. Món ăn
  | 'menu_templates'     // 4. Thực đơn mẫu
  | 'storage_import'     // 5. Nhập kho (Gom nhóm ngày)
  | 'inventory_stock'    // 6. Tồn kho
  | 'inventory_history'  // 7. Lịch sử kho
  | 'warehouse_card'     // 8. Theo dõi sổ kho (S12-H)
  | 'nutrition_grid'     // 9. Cân đối khẩu phần
  | 'reports_forms';     // 10. Biểu mẫu - Thống kê

interface Props {
  activeModule: PmsSubModule;
  onSelectModule: (mod: PmsSubModule) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const PmsAccordionSidebar: React.FC<Props> = ({
  activeModule,
  onSelectModule,
  isCollapsed,
  onToggleCollapse,
}) => {
  // Trạng thái mở/đóng 3 nhóm Accordion
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
    base: true,        // Nhóm 1: Danh mục cơ sở
    storage: true,     // Nhóm 2: Kho bán trú
    nutrition: true,   // Nhóm 3: Khẩu phần & Báo cáo
  });

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navItems = [
    {
      groupKey: 'base',
      groupTitle: '1. DANH MỤC CƠ SỞ',
      items: [
        { id: 'suppliers', label: 'Nhà cung cấp', icon: Building2, badge: '5 NCC' },
        { id: 'school_food', label: 'Thực phẩm trường', icon: Apple, badge: 'CSDL' },
        { id: 'recipes', label: 'Món ăn dinh dưỡng', icon: CookingPot, badge: 'Công thức' },
        { id: 'menu_templates', label: 'Thực đơn mẫu (QĐ 2195)', icon: BookOpenCheck, badge: 'Mùa' },
      ],
    },
    {
      groupKey: 'storage',
      groupTitle: '2. KHO BÁN TRÚ',
      items: [
        { id: 'storage_import', label: 'Nhập kho (Theo ngày)', icon: ArrowDownToLine, badge: 'Mới' },
        { id: 'inventory_stock', label: 'Tồn kho hiện tại', icon: Package, badge: 'FIFO' },
        { id: 'inventory_history', label: 'Lịch sử kho', icon: History },
        { id: 'warehouse_card', label: 'Theo dõi sổ kho (S12-H)', icon: FileText, badge: 'TT 107' },
      ],
    },
    {
      groupKey: 'nutrition',
      groupTitle: '3. KHẨU PHẦN & BÁO CÁO',
      items: [
        { id: 'nutrition_grid', label: 'Cân đối khẩu phần', icon: Scale, badge: '13 cột' },
        { id: 'reports_forms', label: 'Biểu mẫu - Thống kê', icon: FileSpreadsheet, badge: 'Thanh tra' },
      ],
    },
  ];

  if (isCollapsed) {
    return (
      <aside className="w-14 bg-slate-900 text-slate-300 flex flex-col items-center py-3 border-r border-slate-800 shrink-0 select-none z-20">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white mb-4 transition-colors"
          title="Mở rộng menu PMS 10 phân hệ"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>

        <div className="space-y-3 flex flex-col items-center w-full">
          {navItems.flatMap((g) => g.items).map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id as PmsSubModule)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 shrink-0 select-none z-20 font-sans shadow-lg">
      {/* Header Sidebar */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-xs text-white tracking-tight block">
              PMS DINH DƯỠNG
            </span>
            <span className="text-[10px] text-emerald-400 font-bold block">
              10 Phân Hệ Chuẩn qlmn.vn
            </span>
          </div>
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          title="Thu gọn sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Danh sách 10 phân hệ dạng Accordion */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3 text-xs">
        {navItems.map((group) => {
          const isOpen = openGroups[group.groupKey];
          return (
            <div key={group.groupKey} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.groupKey)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider rounded transition-colors"
              >
                <span>{group.groupTitle}</span>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {isOpen && (
                <div className="space-y-0.5 pl-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectModule(item.id as PmsSubModule)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white font-bold shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              isActive
                                ? 'bg-emerald-700 text-emerald-100'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Sidebar */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="truncate">Hàm Thắng • 2026-2027</span>
        <span className="font-bold text-emerald-400">v2.5 Pro</span>
      </div>
    </aside>
  );
};
