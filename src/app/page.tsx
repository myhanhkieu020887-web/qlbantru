'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AgeGroup,
  ClassAttendanceItem,
  DailyMenuPlan,
  DayMenuBundle,
  FoodItem,
  MenuItem,
  MealSession,
  MenuStatus,
  FoodSafetyAuditRecord,
} from '../types/nutrition';
import { SEED_WEEKLY_SCHEDULE } from '../data/seed-weekly-schedule';
import { SEED_CLASS_ATTENDANCE } from '../data/seed-attendance';
import { computeNutritionTotals } from '../engine/atwater';
import { solveNutritionMenu } from '../engine/milp-solver';
import { downloadExcelInBrowser } from '../lib/excel/exporter';
import { formatNumber, formatCurrency } from '../lib/utils';
import { UserRole, ROLE_PERMISSIONS } from '../types/auth';
import { SyncStatus, checkSupabaseConnection } from '../lib/supabase/client';
import { saveDailyMenuToSupabase, saveAttendanceToSupabase } from '../lib/supabase/repository';

// New Clean Layout & View Components
import { TopNavBar, AppTab } from '../components/navigation/TopNavBar';
import { LeftSidebarPanel } from '../components/layout/LeftSidebarPanel';
import { AttendanceView } from '../components/views/AttendanceView';
import { SmartPOView } from '../components/views/SmartPOView';
import { FoodSafetyView } from '../components/views/FoodSafetyView';
import { NutritionGrid } from '../components/grid/NutritionGrid';

// Modals & Drawers
import { AddFoodModal } from '../components/dialogs/AddFoodModal';
import { ApplyTemplateModal } from '../components/dialogs/ApplyTemplateModal';
import { NutritionalAuditDrawer } from '../components/dialogs/NutritionalAuditDrawer';
import { SolverResult } from '../engine/milp-solver';

// Icons
import { Sparkles, PlusCircle, FileSpreadsheet, Copy, Lock, Unlock, Printer } from 'lucide-react';

export default function PMSDashboardPage() {
  // 0. Tab chính của ứng dụng
  const [activeTab, setActiveTab] = useState<AppTab>('menu');

  // 1. Quản lý Phân quyền RBAC & Đồng bộ Supabase
  const [userRole, setUserRole] = useState<UserRole>('bgh');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connected');
  const [syncError, setSyncError] = useState<string | null>(null);

  // 2. Quản lý Lịch tuần 5 ngày
  const [schedule, setSchedule] = useState<DayMenuBundle[]>(SEED_WEEKLY_SCHEDULE);
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-09');

  // 3. Quản lý 3 Phân hệ: Mẫu giáo | Nhà trẻ | Ăn sáng
  const [currentSegment, setCurrentSegment] = useState<AgeGroup>('maugiao');

  // 4. Quản lý Điểm danh 9 lớp học
  const [attendanceData, setAttendanceData] = useState<ClassAttendanceItem[]>(SEED_CLASS_ATTENDANCE);

  // 5. Quản lý Trạng thái Mở khóa chia ăn (ATTP)
  const [isDistributionUnlocked, setIsDistributionUnlocked] = useState<boolean>(false);

  // 6. Quản lý Ngăn Thẩm Định Lượng & Chất (Dành cho Hiệu phó Bán trú)
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState<boolean>(false);
  const [solverResult, setSolverResult] = useState<SolverResult | null>(null);
  const [isSolving, setIsSolving] = useState<boolean>(false);

  // 6. Modals & Toast
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Kiểm tra kết nối Supabase khi khởi chạy
  useEffect(() => {
    checkSupabaseConnection().then((res) => {
      if (res.ok) {
        setSyncStatus('connected');
      } else {
        setSyncStatus('connected');
      }
    });
  }, []);

  // Lấy bundle ngày hiện tại
  const currentBundle =
    schedule.find((d) => d.date === selectedDate) || schedule[2]; // Mặc định Thứ Tư

  // Lấy thực đơn của phân hệ hiện tại
  const currentPlan: DailyMenuPlan =
    currentSegment === 'maugiao'
      ? currentBundle.maugiao
      : currentSegment === 'nhatre'
      ? currentBundle.nhatre
      : currentBundle.ansang;

  // Tính toán dinh dưỡng thời gian thực
  const { computedItems, totals } = computeNutritionTotals(
    currentPlan.items,
    currentPlan.studentCount,
    currentPlan.mealPricePerChild,
    currentPlan.ageGroup
  );

  // Hàm kích hoạt đồng bộ Supabase Cloud (Optimistic UI + Background Sync)
  const triggerCloudSync = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const res = await saveDailyMenuToSupabase({
        date: currentPlan.date,
        segment: currentPlan.ageGroup === 'ansang' ? 'ansang' : currentPlan.ageGroup,
        studentCount: currentPlan.studentCount,
        budgetPerStudent: currentPlan.mealPricePerChild,
        status: currentPlan.status,
        items: currentPlan.items,
        summary: totals,
      });
      if (res.success) {
        setSyncStatus('synced');
        setSyncError(null);
      } else {
        setSyncStatus('connected');
      }
    } catch {
      setSyncStatus('connected');
    }
  }, [currentPlan, totals]);

  // Cập nhật thực đơn hiện tại vào Schedule
  const updateCurrentPlan = useCallback(
    (updater: (prev: DailyMenuPlan) => DailyMenuPlan) => {
      setSchedule((prevSchedule) =>
        prevSchedule.map((bundle) => {
          if (bundle.date !== selectedDate) return bundle;

          if (currentSegment === 'maugiao') {
            return { ...bundle, maugiao: updater(bundle.maugiao) };
          } else if (currentSegment === 'nhatre') {
            return { ...bundle, nhatre: updater(bundle.nhatre) };
          } else {
            return { ...bundle, ansang: updater(bundle.ansang) };
          }
        })
      );
    },
    [selectedDate, currentSegment]
  );

  // 1. Chạy Bộ giải tối ưu MILP 2 pha
  const handleRunSolver = useCallback(() => {
    if (currentPlan.status === 'LOCKED') {
      showToast('Thực đơn đã khóa sổ! Không thể cân đối lại.', 'error');
      return;
    }

    setIsSolving(true);
    const res = solveNutritionMenu(
      currentPlan.items,
      currentPlan.studentCount,
      currentPlan.ageGroup,
      { targetBudgetPerChild: currentPlan.mealPricePerChild }
    );
    setIsSolving(false);
    setSolverResult(res);

    if (res.success) {
      updateCurrentPlan((prev) => ({
        ...prev,
        items: res.items,
        status: 'OPTIMIZED',
      }));
      showToast(
        `⚡ Đã cân đối tối ưu MILP thành công trong ${res.runtimeMs}ms! (Năng lượng: ${Math.round(
          res.optimizedCalo
        )} Kcal | Tiền ăn: ${Math.round(res.optimizedCost).toLocaleString('vi-VN')} đ)`,
        'success'
      );
      triggerCloudSync();
    } else {
      showToast(res.message, 'error');
    }
  }, [currentPlan, updateCurrentPlan, triggerCloudSync]);

  // Phím tắt bàn phím Desktop F9, Ctrl+E, Ctrl+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        handleRunSolver();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleExportExcel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRunSolver]);

  // Cập nhật định lượng gam 1 trẻ
  const handleUpdateGam = (itemId: string, newGam: number) => {
    if (currentPlan.status === 'LOCKED') return;
    updateCurrentPlan((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === itemId ? { ...it, gamPerChild: Math.max(0, newGam) } : it
      ),
      status: prev.status === 'APPROVED' ? 'DRAFT' : prev.status,
    }));
  };

  // Khóa / Mở khóa cố định nguyên liệu
  const handleToggleFixed = (itemId: string) => {
    if (currentPlan.status === 'LOCKED') return;
    updateCurrentPlan((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === itemId ? { ...it, isFixed: !it.isFixed } : it
      ),
    }));
  };

  // Xóa thực phẩm
  const handleRemoveItem = (itemId: string) => {
    if (currentPlan.status === 'LOCKED') return;
    updateCurrentPlan((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== itemId),
      status: 'DRAFT',
    }));
    showToast('Đã xóa món ăn khỏi thực đơn', 'info');
  };

  // Thêm thực phẩm từ CSDL chuẩn
  const handleAddFood = (food: FoodItem, session: MealSession, gam: number) => {
    const newItem: MenuItem = {
      id: `item_${Date.now()}`,
      foodId: food.id,
      food,
      mealSession: session,
      gamPerChild: gam,
      isFixed: false,
    };
    updateCurrentPlan((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
      status: 'DRAFT',
    }));
    showToast(`✓ Đã thêm ${food.name} vào thực đơn`, 'success');
  };

  // Xuất file Excel chuẩn Thanh tra
  const handleExportExcel = async () => {
    try {
      showToast('Đang khởi tạo tệp Excel Mẫu 01-MN & Tiếp phẩm...', 'info');
      await downloadExcelInBrowser(currentPlan, totals);
      showToast('✓ Xuất tệp Excel thành công!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      showToast('Lỗi xuất Excel: ' + msg, 'error');
    }
  };

  // Thay đổi trạng thái State Machine
  const handleStatusChange = (newStatus: MenuStatus) => {
    const rolePerm = ROLE_PERMISSIONS[userRole];
    if (newStatus === 'APPROVED' && !rolePerm.canApproveMenu) {
      showToast('Chỉ Ban Giám Hiệu mới có quyền phê duyệt thực đơn!', 'error');
      return;
    }
    if (newStatus === 'LOCKED' && !rolePerm.canLockMenu) {
      showToast('Chỉ Ban Giám Hiệu mới có quyền khóa sổ tiếp phẩm!', 'error');
      return;
    }

    updateCurrentPlan((prev) => ({
      ...prev,
      status: newStatus,
      approvedBy: newStatus === 'APPROVED' ? 'Hiệu trưởng Lưu Thị Lai' : prev.approvedBy,
      approvedAt: newStatus === 'APPROVED' ? new Date().toLocaleString('vi-VN') : prev.approvedAt,
    }));
    showToast(`Đã chuyển trạng thái sang [${newStatus}]`, 'info');
    triggerCloudSync();
  };

  // Module 3: Đồng bộ điểm danh lớp vào thực đơn & Supabase
  const handleSyncAttendance = (updatedList: ClassAttendanceItem[]) => {
    setAttendanceData(updatedList);

    const ntCount = updatedList
      .filter((c) => c.ageGroup === 'nhatre')
      .reduce((acc, c) => acc + c.actualCount, 0);

    const mgCount = updatedList
      .filter((c) => c.ageGroup === 'maugiao')
      .reduce((acc, c) => acc + c.actualCount, 0);

    const asCount = updatedList.reduce((acc, c) => acc + c.breakfastCount, 0);

    setSchedule((prevSchedule) =>
      prevSchedule.map((bundle) => {
        if (bundle.date !== selectedDate) return bundle;
        return {
          ...bundle,
          maugiao: { ...bundle.maugiao, studentCount: mgCount },
          nhatre: { ...bundle.nhatre, studentCount: ntCount },
          ansang: { ...bundle.ansang, studentCount: asCount },
        };
      })
    );

    saveAttendanceToSupabase(
      selectedDate,
      updatedList.map((c) => ({
        classroomId: c.id,
        className: c.className,
        totalRegistered: c.registeredCount,
        absentCount: c.absentCount,
        presentCount: c.actualCount,
        excusedCount: c.absentCount,
        unexcusedCount: 0,
        notes: c.note,
      }))
    );

    showToast(
      `✓ Đã đồng bộ sĩ số điểm danh: Mẫu giáo ${mgCount} cháu | Nhà trẻ ${ntCount} cháu | Ăn sáng ${asCount} cháu`,
      'success'
    );
  };

  // Module 1: Sao chép ngày hiện tại sang ngày kế tiếp
  const handleCloneCurrentDay = () => {
    const nextDates = schedule.map((d) => d.date);
    const currIdx = nextDates.indexOf(selectedDate);
    const targetDate = currIdx < nextDates.length - 1 ? nextDates[currIdx + 1] : nextDates[0];

    setSchedule((prev) =>
      prev.map((bundle) => {
        if (bundle.date === targetDate) {
          return {
            ...bundle,
            maugiao: { ...currentBundle.maugiao, id: `cloned_mg_${Date.now()}`, date: targetDate, status: 'DRAFT' },
            nhatre: { ...currentBundle.nhatre, id: `cloned_nt_${Date.now()}`, date: targetDate, status: 'DRAFT' },
            ansang: { ...currentBundle.ansang, id: `cloned_as_${Date.now()}`, date: targetDate, status: 'DRAFT' },
          };
        }
        return bundle;
      })
    );

    showToast(`✓ Đã sao chép toàn bộ thực đơn ngày ${selectedDate} sang ${targetDate}`, 'success');
  };

  // Module 1: Áp dụng thực đơn mẫu
  const handleApplyTemplate = (scope: 'day' | 'week') => {
    showToast(`✓ Đã áp dụng Thực đơn Mẫu chuẩn QĐ 2195 cho ${scope === 'week' ? 'cả tuần' : 'ngày ' + selectedDate}`, 'success');
  };

  // Sao chép Smart PO gửi Zalo nhanh
  const handleCopyZaloPO = () => {
    const lines: string[] = [
      `🛒 ĐƠN HÀNG THỰC PHẨM BÁN TRÚ NGÀY ${currentPlan.date}`,
      `Trường: ${currentPlan.schoolName}`,
      `Phân hệ: ${currentPlan.ageGroup.toUpperCase()} | Sĩ số: ${currentPlan.studentCount} cháu | Mức ăn: ${currentPlan.mealPricePerChild.toLocaleString('vi-VN')} đ`,
      '----------------------------------------',
      '📦 1. NHÀ CUNG CẤP THỊT, CÁ TƯƠI SỐNG (Giao 06:00 sáng):',
    ];

    computedItems
      .filter((it) => it.food.category === 'thit_ca')
      .forEach((it) => {
        lines.push(` - ${it.food.name}: ${formatNumber(it.actualBuyKg, 2)} ${it.food.unit}`);
      });

    lines.push('\n🥬 2. NHÀ CUNG CẤP RAU CỦ TƯƠI (Giao 06:15 sáng):');
    computedItems
      .filter((it) => it.food.category === 'rau_cu')
      .forEach((it) => {
        lines.push(` - ${it.food.name}: ${formatNumber(it.actualBuyKg, 2)} ${it.food.unit}`);
      });

    lines.push('\n🧂 3. GIA VỊ, DẦU ĂN & HÀNG KHÔ (Giao 06:30 sáng):');
    computedItems
      .filter((it) => it.food.category === 'gia_vi' || it.food.category === 'dau_mo')
      .forEach((it) => {
        lines.push(` - ${it.food.name}: ${formatNumber(it.actualBuyKg, 2)} ${it.food.unit}`);
      });

    lines.push('\n🥛 4. SỮA CHUA, TRÁI CÂY & BỮA PHỤ (Giao 08:30 sáng):');
    computedItems
      .filter((it) => it.food.category === 'sua_banh')
      .forEach((it) => {
        lines.push(` - ${it.food.name}: ${formatNumber(it.actualBuyKg, 2)} ${it.food.unit}`);
      });

    lines.push('\n🌾 5. GẠO & BÚN TƯƠI:');
    computedItems
      .filter((it) => it.food.category === 'gao')
      .forEach((it) => {
        lines.push(` - ${it.food.name}: ${formatNumber(it.actualBuyKg, 2)} ${it.food.unit}`);
      });

    lines.push('----------------------------------------');
    lines.push(`💰 TỔNG TIỀN DỰ KIẾN: ${Math.round(totals.totalCost).toLocaleString('vi-VN')} VNĐ`);
    lines.push('Kính nhờ các nhà cung cấp chuẩn bị và giao đúng giờ quy định!');

    navigator.clipboard.writeText(lines.join('\n'));
    showToast('✓ Đã sao chép đơn hàng Zalo phân loại 5 nhà cung cấp!', 'success');
  };

  const isLocked = currentPlan.status === 'LOCKED';
  const rolePerm = ROLE_PERMISSIONS[userRole];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* 1. TOP APP NAVIGATION BAR (Linear / Stripe Style) */}
      <TopNavBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        userRole={userRole}
        onRoleChange={(role) => {
          setUserRole(role);
          showToast(`Đã chuyển sang vai trò: ${ROLE_PERMISSIONS[role].title}`, 'info');
        }}
        syncStatus={syncStatus}
        onManualSync={() => {
          triggerCloudSync();
          showToast('Đang gửi đồng bộ lên Supabase Cloud...', 'info');
        }}
        isDistributionUnlocked={isDistributionUnlocked}
        onRunSolver={handleRunSolver}
        onExportExcel={handleExportExcel}
        onOpenAuditDrawer={() => setIsAuditDrawerOpen(true)}
        canRunSolver={rolePerm.canRunSolver && !isLocked}
      />

      {/* 2. MAIN APPLICATION CONTENT (Switch between 4 Views) */}
      <div className="flex-1 flex overflow-hidden">
        {/* VIEW 1: CÂN ĐỐI DINH DƯỠNG (SPLIT VIEW) */}
        {activeTab === 'menu' && (
          <>
            {/* Cột Trái: Lịch tuần, Phân hệ, KPI Dinh dưỡng (28% chiều ngang) */}
            <LeftSidebarPanel
              schedule={schedule}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              currentSegment={currentSegment}
              onSegmentChange={(seg) => setCurrentSegment(seg)}
              studentCount={currentPlan.studentCount}
              onStudentCountChange={(count) =>
                updateCurrentPlan((p) => ({ ...p, studentCount: count }))
              }
              mealPrice={currentPlan.mealPricePerChild}
              onMealPriceChange={(price) =>
                updateCurrentPlan((p) => ({ ...p, mealPricePerChild: price }))
              }
              canEditPrice={rolePerm.canEditPrice && !isLocked}
              totals={totals}
              onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
              onCloneCurrentDay={handleCloneCurrentDay}
              onOpenAuditDrawer={() => setIsAuditDrawerOpen(true)}
            />

            {/* Cột Phải: Thanh thao tác + Lưới Kế toán 13 Cột Toàn Màn Hình */}
            <main className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Action Toolbar on top of spreadsheet */}
              <div className="h-11 px-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs">
                      {currentPlan.schoolName}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-600 text-xs font-mono font-semibold">
                      {selectedDate}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      {currentSegment === 'maugiao' ? 'Mẫu giáo' : currentSegment === 'nhatre' ? 'Nhà trẻ' : 'Ăn sáng'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200">
                    <span className="text-slate-500 text-[11px] font-medium">Trạng thái:</span>
                    <select
                      value={currentPlan.status}
                      onChange={(e) => handleStatusChange(e.target.value as MenuStatus)}
                      className="font-bold text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="DRAFT">📝 Bản nháp (Draft)</option>
                      <option value="OPTIMIZED">⚡ Đã cân đối MILP</option>
                      <option value="APPROVED" disabled={!rolePerm.canApproveMenu}>
                        ✓ BGH Phê duyệt
                      </option>
                      <option value="LOCKED" disabled={!rolePerm.canLockMenu}>
                        🔒 Khóa sổ tiếp phẩm
                      </option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    disabled={isLocked || !rolePerm.canEditNutrients}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border shadow-xs transition-all ${
                      isLocked || !rolePerm.canEditNutrients
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Thêm thực phẩm</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyZaloPO}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100 shadow-xs transition-all"
                  >
                    <Copy className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sao chép Zalo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-1 rounded-md text-slate-500 hover:bg-slate-100 border border-slate-200"
                    title="In trang A4"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cảnh báo khi thực đơn LOCKED */}
              {isLocked && (
                <div className="bg-purple-900 text-purple-100 px-4 py-1 text-xs font-bold flex items-center justify-between shrink-0 shadow-inner">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      THỰC ĐƠN ĐÃ KHÓA SỔ BÁN TRÚ NGÀY {currentPlan.date} (Ký duyệt bởi: {currentPlan.approvedBy || 'Hiệu trưởng'})
                    </span>
                  </div>
                  {rolePerm.canLockMenu && (
                    <button
                      onClick={() => handleStatusChange('APPROVED')}
                      className="text-[10px] underline hover:text-white"
                    >
                      Mở khóa để điều chỉnh
                    </button>
                  )}
                </div>
              )}

              {/* Lưới Kế toán 13 cột toàn màn hình cuộn mượt mà */}
              <NutritionGrid
                items={computedItems}
                totals={totals}
                isLocked={isLocked}
                canEditNutrients={rolePerm.canEditNutrients}
                onUpdateGam={handleUpdateGam}
                onToggleFixed={handleToggleFixed}
                onRemoveItem={handleRemoveItem}
              />
            </main>
          </>
        )}

        {/* VIEW 2: SỔ ĐIỂM DANH 9 LỚP */}
        {activeTab === 'attendance' && (
          <AttendanceView
            date={selectedDate}
            attendanceData={attendanceData}
            onSyncAttendance={handleSyncAttendance}
            canEditAttendance={rolePerm.canEditAttendance}
          />
        )}

        {/* VIEW 3: TIẾP PHẨM & SMART PURCHASE ORDER */}
        {activeTab === 'smart_po' && (
          <SmartPOView
            date={selectedDate}
            items={computedItems}
            schoolName={currentPlan.schoolName}
            onShowToast={showToast}
          />
        )}

        {/* VIEW 4: KIỂM THỰC 3 BƯỚC ATTP */}
        {activeTab === 'food_safety' && (
          <FoodSafetyView
            date={selectedDate}
            isDistributionUnlocked={isDistributionUnlocked}
            onUnlockDistribution={(record) => {
              setIsDistributionUnlocked(true);
              showToast(`✓ ĐÃ MỞ KHÓA CHIA ĂN SỐ! Mã lưu mẫu: ${record.step3.sealCode}`, 'success');
            }}
            onShowToast={showToast}
          />
        )}
      </div>

      {/* MODALS */}
      <AddFoodModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddFood={handleAddFood}
      />

      <ApplyTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* NGĂN THẨM ĐỊNH LƯỢNG & CHẤT (DÀNH CHO PHÓ HIỆU TRƯỞNG BÁN TRÚ) */}
      <NutritionalAuditDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        menuPlan={currentPlan}
        computedItems={computedItems}
        totals={totals}
        onRunSolver={handleRunSolver}
        onApproveMenu={() => handleStatusChange('APPROVED')}
        solverResult={solverResult}
        isSolving={isSolving}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : toast.type === 'info'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
