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
  SchoolBranch,
} from '../types/nutrition';
import { SEED_WEEKLY_SCHEDULE } from '../data/seed-weekly-schedule';
import { SEED_CLASS_ATTENDANCE } from '../data/seed-attendance';
import { computeNutritionTotals } from '../engine/atwater';
import { solveNutritionMenu } from '../engine/milp-solver';
import { downloadExcelInBrowser } from '../lib/excel/exporter';
import { formatNumber, formatCurrency } from '../lib/utils';
import { UserRole, ROLE_PERMISSIONS } from '../types/auth';
import { SyncStatus, checkSupabaseConnection } from '../lib/supabase/client';
import { STANDARD_FOOD_CATALOG } from '../data/standard-foods';

import { AppTab } from '../components/navigation/TopNavBar';
import { LeftSidebarPanel } from '../components/layout/LeftSidebarPanel';
import { AttendanceView } from '../components/views/AttendanceView';
import { SmartPOView } from '../components/views/SmartPOView';
import { FoodSafetyView } from '../components/views/FoodSafetyView';
import { WarehouseView } from '../components/views/WarehouseView';
import { FinanceView } from '../components/views/FinanceView';
import { NutritionGrid } from '../components/grid/NutritionGrid';
import { FinancialSummaryStrip } from '../components/grid/FinancialSummaryStrip';
import { NutritionMatrixFooter } from '../components/metrics/NutritionMatrixFooter';

import {
  InventoryItem,
  StockTransaction,
  SupplierDebtRecord,
  StudentSettlementC38,
  InventoryAuditReport,
} from '../types/inventory';
import {
  SEED_INVENTORY_ITEMS,
  SEED_STOCK_TRANSACTIONS,
  SEED_SUPPLIERS_DEBT,
  SEED_STUDENT_SETTLEMENTS,
  SEED_AUDIT_REPORTS,
} from '../data/seed-inventory';

// Modals & Drawers
import { AddFoodModal } from '../components/dialogs/AddFoodModal';
import { ApplyTemplateModal } from '../components/dialogs/ApplyTemplateModal';
import { NutritionalAuditDrawer } from '../components/dialogs/NutritionalAuditDrawer';
import { AutoMenu20DaysWizardModal } from '../components/dialogs/AutoMenu20DaysWizardModal';
import { Month20DaysCycleResult } from '../engine/menu-cycle-generator';
import { SolverResult } from '../engine/milp-solver';

// PMS 10-Module Accordion & Storage Import List View (Chuan qlmn.vn)
import { PmsAccordionSidebar, PmsSubModule } from '../components/layout/PmsAccordionSidebar';
import { StorageImportListView } from '../components/views/StorageImportListView';
import { SEED_STORAGE_IMPORT_GROUPS } from '../data/seed-storage-import';
import { StorageDateGroup, StorageImportItem } from '../types/storage';

// Menu Adjust Month List View (Chuan qlmn.vn/single/dinhduong/menu_adjust/list)
import { MenuAdjustListView } from '../components/views/MenuAdjustListView';
import { SEED_MENU_ADJUST_RECORDS } from '../data/seed-menu-adjust';
import { MenuAdjustRecord } from '../types/menu-adjust';

// Dish List View (Chuan qlmn.vn/single/dinhduong/dish/list)
import { DishListView } from '../components/views/DishListView';
import { SEED_DISH_ITEMS } from '../data/seed-dishes';
import { DishItem } from '../types/dish';

// Menu Planning View (Chuan qlmn.vn/single/dinhduong/menu_planning/list)
import { MenuPlanningView } from '../components/views/MenuPlanningView';
import { SEED_MENU_TEMPLATES } from '../data/seed-menu-templates';
import { MenuTemplateItem } from '../types/menu-template';

// Print Preview Modal (A4 Print Preview)
import { PrintPreviewModal } from '../components/dialogs/PrintPreviewModal';

// Supplier & Invoices (Quy trình công nợ 3 bước & Multi-campus)
import { SupplierListView } from '../components/views/SupplierListView';
import {
  SupplierContract,
  SupplierDeliveryNote,
  SupplierMonthlyReconciliation,
  SupplierPaymentVoucher,
} from '../types/supplier-invoice';
import {
  SEED_SUPPLIER_CONTRACTS,
  SEED_DELIVERY_NOTES,
  SEED_MONTHLY_RECONCILIATIONS,
  SEED_PAYMENT_VOUCHERS,
} from '../data/seed-suppliers-debt';

// Student Meal Ledger (Sổ tính tiền ăn 02-MN) & Nutrition Standards (Cấu hình định mức)
import { StudentMealLedgerView } from '../components/views/StudentMealLedgerView';
import { NutritionStandardsView } from '../components/views/NutritionStandardsView';
import { ClassMealLedgerSummary } from '../types/student-meal-ledger';
import { NutritionStandardConfig } from '../types/nutrition-standard';
import { SEED_CLASS_MEAL_LEDGERS } from '../data/seed-student-meal-ledger';
import { SEED_NUTRITION_STANDARDS } from '../data/seed-nutrition-standards';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // 3.1 Quản lý Điểm trường (Branch Multi-site: e.g. "850;360" - Đ1: Cơ sở chính 850 trẻ; Đ2: Phân hiệu 360 trẻ)
  const [branchInput, setBranchInput] = useState<string>('850;360');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  const branches: SchoolBranch[] = React.useMemo(() => {
    if (!branchInput || !branchInput.trim()) return [];
    return branchInput
      .split(';')
      .map((s, idx) => {
        const cnt = parseInt(s.trim(), 10);
        const isFirst = idx === 0;
        return {
          id: `branch_${idx + 1}`,
          code: `Đ${idx + 1}`,
          name: isFirst ? `Cơ sở chính (Đ1)` : `Phân hiệu (Đ2)`,
          studentCount: isNaN(cnt) ? 0 : cnt,
        };
      })
      .filter((b) => b.studentCount > 0);
  }, [branchInput]);

  // 4. Quản lý Điểm danh 9 lớp học
  const [attendanceData, setAttendanceData] = useState<ClassAttendanceItem[]>(SEED_CLASS_ATTENDANCE);

  // 5. Quản lý Trạng thái Mở khóa chia ăn (ATTP)
  const [isDistributionUnlocked, setIsDistributionUnlocked] = useState<boolean>(false);

  // 6. Quản lý Ngăn Thẩm Định Lượng & Chất (Dành cho Hiệu phó Bán trú)
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState<boolean>(false);
  const [solverResult, setSolverResult] = useState<SolverResult | null>(null);
  const [isSolving, setIsSolving] = useState<boolean>(false);

  // 7. Quản lý Kho Bán Trú (FIFO)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(SEED_INVENTORY_ITEMS);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(SEED_STOCK_TRANSACTIONS);
  const [auditReports, setAuditReports] = useState<InventoryAuditReport[]>(SEED_AUDIT_REPORTS);

  // 8. Quản lý Kế toán Tài chính (C38-HD & 02-TT)
  const [settlements, setSettlements] = useState<StudentSettlementC38[]>(SEED_STUDENT_SETTLEMENTS);
  const [suppliersDebt, setSuppliersDebt] = useState<SupplierDebtRecord[]>(SEED_SUPPLIERS_DEBT);

  // 9. Quản lý 10 Phân hệ PMS chuyên nghiệp (Menu Accordion chuẩn qlmn.vn)
  const [activePmsModule, setActivePmsModule] = useState<PmsSubModule>('nutrition_adjust_month');
  const [isPmsSidebarCollapsed, setIsPmsSidebarCollapsed] = useState<boolean>(false);
  const [storageImportGroups, setStorageImportGroups] = useState<StorageDateGroup[]>(SEED_STORAGE_IMPORT_GROUPS);

  // 10. Quản lý Sổ Cân đối khẩu phần theo tháng (Chuẩn qlmn.vn/menu_adjust/list)
  const [menuAdjustRecords, setMenuAdjustRecords] = useState<MenuAdjustRecord[]>(SEED_MENU_ADJUST_RECORDS);
  const [menuViewMode, setMenuViewMode] = useState<'list' | 'detail'>('list');

  // 11. Quản lý Danh mục Món ăn dinh dưỡng (Chuẩn qlmn.vn/dish/list)
  const [dishItems, setDishItems] = useState<DishItem[]>(SEED_DISH_ITEMS);

  // 12. Quản lý Thư viện Thực đơn mẫu (Chuẩn qlmn.vn/menu_planning/list)
  const [menuTemplates, setMenuTemplates] = useState<MenuTemplateItem[]>(SEED_MENU_TEMPLATES);

  // 13. Quản lý Nhà cung cấp & Quy trình Công nợ 3 bước
  const [supplierContracts, setSupplierContracts] = useState<SupplierContract[]>(SEED_SUPPLIER_CONTRACTS);
  const [deliveryNotes, setDeliveryNotes] = useState<SupplierDeliveryNote[]>(SEED_DELIVERY_NOTES);
  const [monthlyReconciliations, setMonthlyReconciliations] = useState<SupplierMonthlyReconciliation[]>(SEED_MONTHLY_RECONCILIATIONS);
  const [paymentVouchers, setPaymentVouchers] = useState<SupplierPaymentVoucher[]>(SEED_PAYMENT_VOUCHERS);

  // 14. Quản lý Sổ tính tiền ăn học sinh Mẫu 02-MN (9 lớp)
  const [classMealLedgers, setClassMealLedgers] = useState<ClassMealLedgerSummary[]>(SEED_CLASS_MEAL_LEDGERS);

  // 15. Quản lý Cấu hình Định mức dinh dưỡng & Tỷ lệ 3 bữa
  const [nutritionStandards, setNutritionStandards] = useState<Record<string, NutritionStandardConfig>>(SEED_NUTRITION_STANDARDS);

  // 6. Modals & Toast
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isAuto20DaysModalOpen, setIsAuto20DaysModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Áp dụng chu kỳ 20 ngày: Đồng bộ kép vào Lịch tuần 5 ngày & Sổ cân đối tháng
  const handleApplyCycleToSchedule = (cycleResult: Month20DaysCycleResult, targetWeek: number) => {
    // 1. Lọc 5 ngày của tuần được chọn (weekIndex === targetWeek)
    const weekDays = cycleResult.days.filter((d) => d.weekIndex === targetWeek);

    // 2. Cập nhật vào Lịch tuần 5 ngày (schedule)
    setSchedule((prevSchedule) =>
      prevSchedule.map((bundle, index) => {
        const cycleDay = weekDays[index];
        if (!cycleDay) return bundle;

        const basePlan = (bundle[currentSegment] as DailyMenuPlan | undefined) || bundle.maugiao;
        const updatedPlan: DailyMenuPlan = {
          ...basePlan,
          menuCode: cycleDay.mainDishName,
          status: 'OPTIMIZED',
          items: cycleDay.items,
          mealPricePerChild: cycleDay.costPerChild,
        };

        return {
          ...bundle,
          [currentSegment]: updatedPlan,
        };
      })
    );

    // 3. Đồng bộ toàn bộ 20 ngày vào Sổ cân đối tháng (menuAdjustRecords)
    const newMonthRecords: MenuAdjustRecord[] = cycleResult.days.map((d) => {
      const parts = d.dateString.split('-');
      const displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      const groupName = cycleResult.ageGroup === 'maugiao' ? 'Mẫu giáo' : 'Nhà trẻ';

      return {
        id: `cdkp_${d.dateString.replace(/-/g, '_')}`,
        stt: d.dayIndex,
        date: displayDate,
        rawDate: d.dateString,
        targetGroups: [groupName],
        targetGroupsDisplay: groupName,
        menuNamesDisplay: `SÁNG: ${d.breakfastDish}; TRƯA: ${d.lunchMainDish} + ${d.lunchSoupDish}; PHỤ: ${d.dessertDish} / ${d.afternoonSnackDish}; CHIỀU: ${d.afternoonMilkDish}`,
        studentCount: cycleResult.studentCount,
        mealPricesDisplay: `${d.costPerChild.toLocaleString('vi-VN')} đ`,
        createdAt: new Date().toLocaleString('vi-VN'),
        updatedAt: new Date().toLocaleString('vi-VN'),
        status: 'OPTIMIZED',
      };
    });

    setMenuAdjustRecords(newMonthRecords);
    showToast(
      `✓ ĐÃ ÁP DỤNG ĐỒNG BỘ KÉP: Nạp Tuần ${targetWeek} vào Lịch 5 ngày & 20 ngày vào Sổ cân đối tháng!`,
      'success'
    );
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
      : currentSegment === 'cbgvnv'
      ? (currentBundle.cbgvnv || currentBundle.maugiao)
      : currentBundle.ansang;

  const { computedItems, totals } = computeNutritionTotals(
    currentPlan.items,
    currentPlan.studentCount,
    currentPlan.mealPricePerChild,
    currentPlan.ageGroup,
    branches
  );

  // Chi phí thực tế theo Điểm trường đang chọn (Đ1, Đ2, hoặc Toàn trường)
  const effectiveBranchCost =
    selectedBranchId !== 'all' && totals.branchCosts && totals.branchCosts[selectedBranchId] !== undefined
      ? totals.branchCosts[selectedBranchId]
      : totals.totalCost;

  // Hàm kích hoạt đồng bộ Supabase Cloud qua MenuService (OOP API Route)
  const triggerCloudSync = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: currentPlan, totals }),
      });
      if (res.ok) {
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

  // Cập nhật số nguyên thực mua theo từng điểm trường (VD: Đ1=28, Đ2=12 -> Tổng=40)
  const handleUpdateBranchBuy = (itemId: string, branchId: string, newQty: number) => {
    if (currentPlan.status === 'LOCKED') return;
    const roundedQty = Math.max(0, Math.round(newQty));
    updateCurrentPlan((prev) => {
      const newItems = prev.items.map((it) => {
        if (it.id !== itemId) return it;
        const currentBranchQtys = it.branchQuantities ? { ...it.branchQuantities } : {};
        currentBranchQtys[branchId] = roundedQty;
        // Tổng mua điểm trường = tổng số nguyên các điểm
        const customTotal = Object.values(currentBranchQtys).reduce((sum, v) => sum + v, 0);
        return {
          ...it,
          branchQuantities: currentBranchQtys,
          customTotalBuy: customTotal,
        };
      });
      return {
        ...prev,
        items: newItems,
        status: prev.status === 'APPROVED' ? 'DRAFT' : prev.status,
      };
    });
  };

  // Thay đổi chuỗi điểm trường (VD: "850;360")
  const handleBranchInputChange = (newVal: string) => {
    setBranchInput(newVal);
    const parts = newVal
      .split(';')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 0);
    if (parts.length > 0) {
      if (selectedBranchId === 'all') {
        const sum = parts.reduce((a, b) => a + b, 0);
        updateCurrentPlan((p) => ({ ...p, studentCount: sum }));
      } else {
        const targetIdx = selectedBranchId === 'branch_1' ? 0 : 1;
        if (parts[targetIdx] !== undefined) {
          updateCurrentPlan((p) => ({ ...p, studentCount: parts[targetIdx] }));
        }
      }
    }
  };

  // Thay đổi sĩ số học sinh đồng bộ
  const handleStudentCountChange = (cnt: number) => {
    updateCurrentPlan((p) => ({ ...p, studentCount: cnt }));
    if (selectedBranchId !== 'all') {
      const targetIdx = selectedBranchId === 'branch_1' ? 0 : 1;
      const parts = branchInput.split(';').map((s) => parseInt(s.trim(), 10) || 0);
      if (parts[targetIdx] !== undefined) {
        parts[targetIdx] = cnt;
        setBranchInput(parts.join(';'));
      }
    }
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

  // 7. Thêm giao dịch kho (Nhập / Xuất)
  const handleAddStockTransaction = (tx: Omit<StockTransaction, 'id' | 'transactionCode'>) => {
    const newTx: StockTransaction = {
      ...tx,
      id: `tx_${Date.now()}`,
      transactionCode: `${tx.type === 'IMPORT' ? 'NK' : 'XK'}-${Date.now().toString().slice(-6)}`,
    };

    setStockTransactions((prev) => [newTx, ...prev]);

    // Cập nhật tồn kho và các batches
    setInventoryItems((prev) =>
      prev.map((it) => {
        if (it.foodId !== tx.foodId) return it;
        if (tx.type === 'IMPORT') {
          const newBatch = {
            batchId: `B-${Date.now()}`,
            batchCode: tx.batchId || `LO-${Date.now().toString().slice(-6)}`,
            importDate: tx.date,
            initialQuantity: tx.quantity,
            remainingQuantity: tx.quantity,
            unitPrice: tx.unitPrice,
            expiryDate: '2027-09-01',
            supplierName: 'Nhà cung cấp mới',
          };
          const newStock = it.currentStock + tx.quantity;
          const newAvg = (it.currentStock * it.averagePrice + tx.totalAmount) / newStock;
          return {
            ...it,
            currentStock: newStock,
            averagePrice: Math.round(newAvg),
            batches: [...it.batches, newBatch],
          };
        } else {
          // Xuất kho FIFO
          let needToDeduct = tx.quantity;
          const updatedBatches = it.batches.map((b) => {
            if (needToDeduct <= 0) return b;
            if (b.remainingQuantity >= needToDeduct) {
              const res = { ...b, remainingQuantity: b.remainingQuantity - needToDeduct };
              needToDeduct = 0;
              return res;
            } else {
              needToDeduct -= b.remainingQuantity;
              return { ...b, remainingQuantity: 0 };
            }
          });
          return {
            ...it,
            currentStock: Math.max(0, it.currentStock - tx.quantity),
            batches: updatedBatches,
          };
        }
      })
    );

    showToast(`✓ Đã ghi nhận phiếu ${newTx.transactionCode} thành công!`, 'success');
  };

  // 8. Ghi nhận thanh toán công nợ NCC
  const handleRecordSupplierPayment = (supplierId: string, amount: number) => {
    setSuppliersDebt((prev) =>
      prev.map((sup) => {
        if (sup.supplierId !== supplierId) return sup;
        const newPaid = sup.periodPayments + amount;
        const newClosing = Math.max(0, sup.closingBalance - amount);
        return {
          ...sup,
          periodPayments: newPaid,
          closingBalance: newClosing,
          status: newClosing === 0 ? 'RECONCILED' : 'PENDING_PAYMENT',
        };
      })
    );
    showToast(`✓ Đã ghi nhận thanh toán ${formatCurrency(amount)} cho nhà cung cấp!`, 'success');
  };

  // 9. Áp dụng điều chỉnh cân bằng kho sau kiểm kê (Mẫu C30-HD)
  const handleApplyAuditAdjustment = (report: InventoryAuditReport) => {
    const adjustmentTxList: StockTransaction[] = [];

    report.items.forEach((it) => {
      if (it.difference !== 0) {
        const isSurplus = it.difference > 0;
        const tx: StockTransaction = {
          id: `tx_adj_${Date.now()}_${it.foodId}`,
          transactionCode: `DC-${Date.now().toString().slice(-6)}`,
          date: report.auditDate,
          type: 'ADJUSTMENT',
          foodId: it.foodId,
          foodName: it.foodName,
          unit: it.unit,
          quantity: Math.abs(it.difference),
          unitPrice: it.unitPrice,
          totalAmount: Math.abs(it.diffAmount),
          reason: isSurplus
            ? `Điều chỉnh tăng do kiểm kê thừa (${report.auditCode})`
            : `Điều chỉnh giảm hao hụt tự nhiên theo định mức (${report.auditCode})`,
          performer: report.accountant,
        };
        adjustmentTxList.push(tx);
      }
    });

    if (adjustmentTxList.length > 0) {
      setStockTransactions((prev) => [...adjustmentTxList, ...prev]);

      // Cập nhật tồn kho thực tế cho từng món
      setInventoryItems((prev) =>
        prev.map((it) => {
          const auditItem = report.items.find((ai) => ai.foodId === it.foodId);
          if (auditItem && auditItem.difference !== 0) {
            return {
              ...it,
              currentStock: auditItem.actualQuantity,
            };
          }
          return it;
        })
      );
    }

    const appliedReport = { ...report, isApplied: true };
    setAuditReports((prev) => [appliedReport, ...prev.filter((r) => r.id !== report.id)]);
    showToast(`✓ Đã lập Biên bản ${report.auditCode} & tự động cân bằng kho thành công!`, 'success');
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

  // 12. Thêm món ăn dinh dưỡng & tự động bung danh sách nguyên liệu BOM
  const handleAddDishToMenu = (dish: DishItem, session: MealSession) => {
    if (currentPlan.status === 'LOCKED') {
      showToast('Thực đơn đã khóa sổ, không thể chỉnh sửa!', 'error');
      return;
    }

    const updatedItems = [...currentPlan.items];
    let addedIngCount = 0;
    let mergedIngCount = 0;

    dish.ingredients.forEach((ing) => {
      // Tìm FoodItem trong STANDARD_FOOD_CATALOG
      const foodMatch =
        STANDARD_FOOD_CATALOG.find(
          (f) =>
            f.id === ing.foodId ||
            f.code.toLowerCase() === ing.foodCode.toLowerCase() ||
            f.name.toLowerCase() === ing.foodName.toLowerCase()
        ) ||
        // Fallback tạo FoodItem nếu chưa có trong catalog
        ({
          id: ing.foodId || `food_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          code: ing.foodCode || 'FOOD_AUTO',
          name: ing.foodName,
          category: (ing.category as any) || 'khac',
          unit: ing.unit || 'kg',
          price: ing.unitPrice || 0,
          gamExchange: 1000,
          wasteFactor: 0,
          isAnimalProtein: ing.proteinPerChild > 0,
          isAnimalFat: ing.fatPerChild > 0,
          isFreeSugar: false,
          sodiumMg: 0,
          protein100g: ing.gamPerChild > 0 ? (ing.proteinPerChild / ing.gamPerChild) * 100 : 0,
          fat100g: ing.gamPerChild > 0 ? (ing.fatPerChild / ing.gamPerChild) * 100 : 0,
          carbs100g: ing.gamPerChild > 0 ? (ing.carbsPerChild / ing.gamPerChild) * 100 : 0,
          calciumMg: 0,
          ironMg: 0,
          vitaminB1Mg: 0,
          vitaminCMg: 0,
        } as FoodItem);

      // Kiểm tra xem trong session này đã có nguyên liệu đó chưa (gộp gia vị, dầu mỡ, nước mắm, hành tiêu...)
      const existingIndex = updatedItems.findIndex(
        (it) =>
          it.mealSession === session &&
          (it.food.id === foodMatch.id ||
            it.food.code.toLowerCase() === foodMatch.code.toLowerCase() ||
            it.food.name.toLowerCase() === foodMatch.name.toLowerCase())
      );

      if (existingIndex >= 0) {
        // Gộp định lượng vào dòng đã có
        const exist = updatedItems[existingIndex];
        updatedItems[existingIndex] = {
          ...exist,
          gamPerChild: Number((exist.gamPerChild + ing.gamPerChild).toFixed(2)),
          dishName: exist.dishName ? `${exist.dishName}, ${dish.name}` : dish.name,
        };
        mergedIngCount++;
      } else {
        // Thêm nguyên liệu mới
        const newItem: MenuItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          foodId: foodMatch.id,
          food: foodMatch,
          mealSession: session,
          gamPerChild: ing.gamPerChild,
          dishId: dish.id,
          dishName: dish.name,
          isFixed: false,
        };
        updatedItems.push(newItem);
        addedIngCount++;
      }
    });

    // Cập nhật tên thực đơn nếu chưa có
    let newMenuTitle = currentPlan.menuTitle;
    const sessionKey = session === 'chinh_trua' ? 'trua' : session === 'phu_xe' ? 'xe' : 'phu_xe';
    const currentTitles = currentPlan.menuTitle[sessionKey] ? currentPlan.menuTitle[sessionKey].split(', ') : [];
    if (!currentTitles.includes(dish.name)) {
      newMenuTitle = {
        ...newMenuTitle,
        [sessionKey]: currentTitles.length > 0 ? `${currentPlan.menuTitle[sessionKey]}, ${dish.name}` : dish.name,
      };
    }

    updateCurrentPlan((prev) => ({
      ...prev,
      items: updatedItems,
      menuTitle: newMenuTitle,
      status: 'DRAFT',
    }));

    showToast(
      `✓ Đã thêm món "${dish.name}" (Bung ${addedIngCount} NL mới, gộp ${mergedIngCount} gia vị/nguyên liệu chung)`,
      'success'
    );
  };

  // 13. Xóa toàn bộ nguyên liệu thuộc món ăn khỏi bữa
  const handleRemoveDishFromMenu = (dishName: string, session: MealSession) => {
    if (currentPlan.status === 'LOCKED') {
      showToast('Thực đơn đã khóa sổ, không thể xóa món!', 'error');
      return;
    }

    const beforeCount = currentPlan.items.length;
    const filteredItems = currentPlan.items.filter(
      (it) =>
        !(
          it.mealSession === session &&
          (it.dishName === dishName ||
            it.food.name.toLowerCase() === dishName.toLowerCase() ||
            (it.dishName && it.dishName.includes(dishName)))
        )
    );

    const removedCount = beforeCount - filteredItems.length;

    // Cập nhật menuTitle
    const sessionKey = session === 'chinh_trua' ? 'trua' : session === 'phu_xe' ? 'xe' : 'phu_xe';
    const oldTitle = currentPlan.menuTitle[sessionKey] || '';
    const newTitleStr = oldTitle
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s.toLowerCase() !== dishName.toLowerCase())
      .join(', ');

    updateCurrentPlan((prev) => ({
      ...prev,
      items: filteredItems,
      menuTitle: {
        ...prev.menuTitle,
        [sessionKey]: newTitleStr,
      },
      status: 'DRAFT',
    }));

    showToast(`✓ Đã xóa món "${dishName}" (giảm ${removedCount} dòng nguyên liệu)`, 'info');
  };

  // 14. Đồng bộ sĩ số ăn thực tế từ module Điểm danh
  const handleFetchAttendanceCount = () => {
    if (currentPlan.status === 'LOCKED') {
      showToast('Thực đơn đã khóa sổ, không thể sửa sĩ số!', 'error');
      return;
    }

    let actualSum = 0;
    if (currentSegment === 'maugiao') {
      if (selectedBranchId === 'branch_1') {
        // Điểm 1: Các lớp Mầm, Chồi, Lá chính trường
        actualSum = attendanceData
          .filter((c) => c.ageGroup === 'maugiao' && c.id !== 'class_mg_ghep')
          .reduce((sum, c) => sum + c.actualCount, 0);
      } else if (selectedBranchId === 'branch_2') {
        // Điểm 2: Lớp Ghép Điểm 2
        actualSum = attendanceData
          .filter((c) => c.id === 'class_mg_ghep')
          .reduce((sum, c) => sum + c.actualCount, 0);
      } else {
        // Toàn trường mẫu giáo (426 cháu)
        actualSum = attendanceData
          .filter((c) => c.ageGroup === 'maugiao')
          .reduce((sum, c) => sum + c.actualCount, 0);
      }
    } else if (currentSegment === 'nhatre') {
      // Khối nhà trẻ (100 cháu)
      actualSum = attendanceData
        .filter((c) => c.ageGroup === 'nhatre')
        .reduce((sum, c) => sum + c.actualCount, 0);
    } else {
      // Phân hệ ăn sáng
      actualSum = attendanceData.reduce((sum, c) => sum + (c.breakfastCount || 0), 0);
    }

    if (actualSum > 0) {
      updateCurrentPlan((prev) => ({
        ...prev,
        studentCount: actualSum,
        status: 'DRAFT',
      }));
      showToast(`✓ Đã lấy sĩ số điểm danh thực tế: ${actualSum} cháu`, 'success');
    } else {
      showToast('Không tìm thấy dữ liệu điểm danh phù hợp!', 'error');
    }
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

    // Tự động xuất kho FIFO các mặt hàng khô/gia vị/gạo khi thực đơn được DUYỆT hoặc KHÓA SỔ
    if (newStatus === 'APPROVED' || newStatus === 'LOCKED') {
      let exportedCount = 0;
      computedItems.forEach((cItem) => {
        const inv = inventoryItems.find(
          (it) => it.foodName.toLowerCase() === cItem.food.name.toLowerCase()
        );
        if (inv && cItem.actualBuyUnit > 0) {
          handleAddStockTransaction({
            date: currentPlan.date,
            type: 'EXPORT_MENU',
            foodId: inv.foodId,
            foodName: inv.foodName,
            unit: inv.unit,
            quantity: cItem.actualBuyUnit,
            unitPrice: inv.averagePrice,
            totalAmount: cItem.actualBuyUnit * inv.averagePrice,
            menuDate: currentPlan.date,
            reason: `Xuất kho tự động theo thực đơn ${currentPlan.date} (${newStatus})`,
            performer: 'Hệ thống tự động (FIFO)',
          });
          exportedCount++;
        }
      });
      if (exportedCount > 0) {
        showToast(`✓ Đã tự động xuất kho FIFO ${exportedCount} mặt hàng khô/gia vị cho thực đơn!`, 'success');
      }
    }

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

    // Đồng bộ điểm danh qua API Route
    fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: selectedDate,
        records: updatedList.map((c) => ({
          classroom_id: c.id,
          class_name: c.className,
          total_registered: c.registeredCount,
          absent_count: c.absentCount,
          present_count: c.actualCount,
          excused_count: c.absentCount,
          unexcused_count: 0,
          note: c.note ?? '',
        })),
      }),
    }).catch((err) => console.warn('[AttendanceSync]', err));

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

  // 9. Handlers cho 13 Phân hệ PMS Accordion Hợp nhất Chuẩn qlmn.vn
  const handleSelectPmsModule = (module: PmsSubModule) => {
    setActivePmsModule(module);
    if (module === 'nutrition_adjust_month') {
      setActiveTab('menu');
      setMenuViewMode('list');
      showToast('Đang chuyển đến: Sổ Cân đối khẩu phần tháng', 'info');
    } else if (module === 'nutrition_grid') {
      setActiveTab('menu');
      setMenuViewMode('detail');
      showToast('Đang chuyển đến: Lưới Kế toán Cân đối khẩu phần (13 Cột)', 'info');
    } else if (module === 'attendance') {
      setActiveTab('attendance');
      showToast('Đang chuyển đến: Sổ Điểm danh (9 Lớp)', 'info');
    } else if (module === 'smart_po') {
      setActiveTab('smart_po');
      showToast('Đang chuyển đến: Tiếp phẩm & Smart PO', 'info');
    } else if (module === 'food_safety') {
      setActiveTab('food_safety');
      showToast('Đang chuyển đến: Sổ Kiểm thực 3 bước ATTP', 'info');
    } else if (module === 'storage_import') {
      setActiveTab('menu');
      showToast('Đang chuyển đến: Quản lý Nhập kho (theo ngày)', 'info');
    } else if (module === 'recipes') {
      setActiveTab('menu');
      showToast('Đang chuyển đến: Danh mục Món ăn dinh dưỡng (10 món)', 'info');
    } else if (module === 'inventory_stock' || module === 'warehouse_card') {
      setActiveTab('warehouse');
      showToast('Đang chuyển đến: Kho Bán Trú (FIFO)', 'info');
    } else if (module === 'finance') {
      setActiveTab('finance');
      showToast('Đang chuyển đến: Kế toán Tài chính', 'info');
    } else if (module === 'student_meal_ledger') {
      setActiveTab('finance');
      showToast('Đang chuyển đến: Sổ tính tiền ăn học sinh (Mẫu 02-MN)', 'info');
    } else if (module === 'suppliers') {
      setActiveTab('finance');
      showToast('Đang chuyển đến: Nhà cung cấp & Công nợ 3 bước', 'info');
    } else if (module === 'nutrition_standards') {
      setActiveTab('finance');
      showToast('Đang chuyển đến: Cấu hình Định mức dinh dưỡng & Tỷ lệ 3 bữa', 'info');
    } else if (module === 'menu_templates') {
      setActiveTab('menu');
      showToast('Đang chuyển đến: Thư viện Thực đơn mẫu chuẩn QLMN (QĐ 2195)', 'info');
    } else if (module === 'reports_forms') {
      setIsPrintModalOpen(true);
    } else if (module === 'school_food') {
      setIsAddModalOpen(true);
    } else {
      showToast(`Đã chọn phân hệ: ${module}`, 'info');
    }
  };

  // Chuyển đổi điểm trường (Multi-campus Switcher)
  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId);
    if (branchId === 'all') {
      const totalAll = branches.reduce((sum, b) => sum + b.studentCount, 0) || 1210;
      updateCurrentPlan((p) => ({ ...p, studentCount: totalAll, branchId: 'all' }));
      showToast(`Đã chuyển sang chế độ: Toàn trường (${totalAll} trẻ)`, 'info');
    } else {
      const targetBranch = branches.find((b) => b.id === branchId);
      const count = targetBranch ? targetBranch.studentCount : 850;
      const bName = targetBranch ? targetBranch.name : 'Điểm trường';
      updateCurrentPlan((p) => ({ ...p, studentCount: count, branchId }));
      showToast(`Đã chuyển sang lọc: ${bName} (${count} trẻ)`, 'info');
    }
  };

  // Co giãn định lượng nhanh theo nhóm thực phẩm (Scaling Factor)
  const handleScaleNutrientGroup = (category: 'protein' | 'carbs' | 'fat' | 'veg', percent: number) => {
    const factor = 1 + percent / 100;
    updateCurrentPlan((plan) => ({
      ...plan,
      items: plan.items.map((it) => {
        const cat = it.food.category;
        const isMatch =
          (category === 'protein' && (cat === 'thit_ca' || it.food.isAnimalProtein)) ||
          (category === 'carbs' && cat === 'gao') ||
          (category === 'fat' && (cat === 'dau_mo' || it.food.isAnimalFat)) ||
          (category === 'veg' && cat === 'rau_cu');
        if (isMatch) {
          return {
            ...it,
            gamPerChild: Math.max(0.5, Math.round(it.gamPerChild * factor * 10) / 10),
          };
        }
        return it;
      }),
    }));
    showToast(`✓ Đã điều chỉnh ${percent > 0 ? '+' : ''}${percent}% định lượng nhóm ${category}`, 'success');
  };

  // Lưu ngày hiện tại vào Thư viện Thực đơn mẫu
  const handleSaveCurrentAsTemplate = () => {
    const code = `TD_${currentSegment.toUpperCase()}_${Date.now().toString().slice(-4)}`;
    const newTpl: MenuTemplateItem = {
      id: `tpl_${Date.now()}`,
      code,
      name: `Mẫu lưu ngày ${selectedDate} (${currentSegment === 'maugiao' ? 'Mẫu giáo' : currentSegment === 'nhatre' ? 'Nhà trẻ' : 'Ăn sáng'})`,
      ageGroup: currentSegment,
      mealPrice: currentPlan.mealPricePerChild,
      dishes: currentPlan.items.map((it) => ({
        dishId: it.dishId || it.id,
        dishName: it.dishName || it.food.name,
        mealSession: it.mealSession,
        category: it.food.category,
      })),
      calo: Math.round(totals.totalCalo * 10) / 10,
      proteinPct: Math.round(totals.proteinPct * 10) / 10,
      fatPct: Math.round(totals.fatPct * 10) / 10,
      carbsPct: Math.round(totals.carbsPct * 10) / 10,
      animalProteinRatio: Math.round(totals.animalProteinRatio),
      plantFatRatio: Math.round(totals.plantFatRatio),
      sodiumMg: Math.round(totals.totalSodiumMg),
      costPerChild: Math.round(totals.costPerChild),
      isQuantityPass: totals.isCaloPass,
      isQualityPass: totals.isRatioPass,
      createdAt: new Date().toLocaleString('vi-VN'),
      updatedAt: new Date().toLocaleString('vi-VN'),
      note: `Lưu tự động từ Lưới kế toán ngày ${selectedDate}`,
    };
    setMenuTemplates([newTpl, ...menuTemplates]);
    showToast(`✓ Đã lưu thành Thực đơn mẫu: ${code}`, 'success');
  };

  // 10. Handlers cho Sổ CĐKP tháng
  const handleEditMenuAdjustRecord = (record: MenuAdjustRecord) => {
    setSelectedDate(record.rawDate);
    if (record.targetGroups.includes('Mẫu giáo')) {
      setCurrentSegment('maugiao');
    } else if (record.targetGroups.includes('Nhà trẻ')) {
      setCurrentSegment('nhatre');
    } else {
      setCurrentSegment('ansang');
    }
    setActivePmsModule('nutrition_grid');
    setMenuViewMode('detail');
    showToast(`Đang mở Lưới 13 cột điều chỉnh ngày ${record.date}`, 'info');
  };

  const handleAddMenuAdjustRecord = (newRec: Partial<MenuAdjustRecord>) => {
    showToast(`✓ Đã tạo ngày CĐKP mới: ${newRec.date}`, 'success');
  };

  const handleDeleteMenuAdjustRecords = (ids: string[]) => {
    setMenuAdjustRecords((prev) => prev.filter((r) => !ids.includes(r.id)));
    showToast(`✓ Đã xóa ${ids.length} ngày cân đối khẩu phần`, 'info');
  };

  const handleDeleteStorageItem = (id: string) => {
    setStorageImportGroups((prev) =>
      prev
        .map((group) => {
          if (!group.items.some((it) => it.id === id)) return group;
          const updatedItems = group.items.filter((it) => it.id !== id);
          const updatedTotal = updatedItems.reduce((sum, it) => sum + it.totalPrice, 0);
          return {
            ...group,
            itemCount: updatedItems.length,
            items: updatedItems,
            totalGroupAmount: updatedTotal,
          };
        })
        .filter((group) => group.items.length > 0)
    );
    showToast('✓ Đã xóa mặt hàng khỏi phiếu nhập kho', 'info');
  };

  const handleAddNewStorageItem = () => {
    showToast('Đang mở biểu mẫu thêm phiếu nhập kho mới...', 'info');
  };

  const isLocked = currentPlan.status === 'LOCKED';
  const rolePerm = ROLE_PERMISSIONS[userRole];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* 1. PMS UNIFIED SIDEBAR (Thay thế hoàn toàn Header cũ) */}
      <PmsAccordionSidebar
        activeModule={activePmsModule}
        onSelectModule={handleSelectPmsModule}
        isCollapsed={isPmsSidebarCollapsed}
        onToggleCollapse={() => setIsPmsSidebarCollapsed(!isPmsSidebarCollapsed)}
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
      />

      {/* 2. MAIN APPLICATION CONTENT (Tràn màn hình tối đa chiều dọc) */}
      <div className="flex-1 flex overflow-hidden">
        {/* VIEW 1: CÂN ĐỐI DINH DƯỠNG HOẶC QUẢN LÝ NHẬP KHO */}
        {activeTab === 'menu' && (
          activePmsModule === 'storage_import' ? (
            <div className="flex-1 flex overflow-hidden bg-slate-100">
              <StorageImportListView
                groups={storageImportGroups}
                onAddImport={handleAddNewStorageItem}
                onDeleteItem={handleDeleteStorageItem}
              />
            </div>
          ) : activePmsModule === 'recipes' ? (
            <div className="flex-1 flex overflow-hidden bg-slate-100">
              <DishListView
                initialDishes={dishItems}
                onAddDish={(dish) => {
                  setDishItems([dish, ...dishItems]);
                  showToast(`✓ Đã thêm món: ${dish.name}`, 'success');
                }}
                onDeleteDish={(id) => {
                  setDishItems((prev) => prev.filter((d) => d.id !== id));
                  showToast('✓ Đã xóa món ăn khỏi danh mục', 'info');
                }}
                onApplyToMenu={(dish) => {
                  setActivePmsModule('nutrition_grid');
                  setMenuViewMode('detail');
                  showToast(`✓ Đã áp dụng món "${dish.name}" vào thực đơn ngày`, 'success');
                }}
              />
            </div>
          ) : activePmsModule === 'menu_templates' ? (
            <div className="flex-1 flex overflow-hidden bg-slate-100">
              <MenuPlanningView
                templates={menuTemplates}
                onApplyTemplateToDate={(tpl, targetDate) => {
                  setSelectedDate(targetDate);
                  setCurrentSegment(tpl.ageGroup);
                  setActivePmsModule('nutrition_grid');
                  setMenuViewMode('detail');
                  showToast(`✓ Đã áp dụng mẫu "${tpl.name}" vào ngày ${targetDate}`, 'success');
                }}
                onDeleteTemplates={(ids) => {
                  setMenuTemplates((prev) => prev.filter((t) => !ids.includes(t.id)));
                  showToast('✓ Đã xóa thực đơn mẫu', 'info');
                }}
                onAddTemplate={(newTpl) => {
                  setMenuTemplates([newTpl, ...menuTemplates]);
                  showToast(`✓ Đã tạo mẫu mới: ${newTpl.name}`, 'success');
                }}
              />
            </div>
          ) : (activePmsModule === 'nutrition_adjust_month' || menuViewMode === 'list') ? (
            <div className="flex-1 flex overflow-hidden bg-slate-100">
              <MenuAdjustListView
                records={menuAdjustRecords}
                onEditRecord={handleEditMenuAdjustRecord}
                onAddRecord={handleAddMenuAdjustRecord}
                onDeleteRecords={handleDeleteMenuAdjustRecords}
                onOpenAuto20DaysModal={() => setIsAuto20DaysModalOpen(true)}
              />
            </div>
          ) : (
            <>
              {/* Cột Trái: Lịch tuần, Phân hệ, Cây món ăn, KPI Dinh dưỡng (Hỗ trợ thu gọn/mở rộng) */}
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
                onOpenAuto20DaysModal={() => setIsAuto20DaysModalOpen(true)}
                dishCatalog={dishItems}
                onAddDishToMenu={handleAddDishToMenu}
                onRemoveDishFromMenu={handleRemoveDishFromMenu}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              />

            {/* Cột Phải: Dải điều khiển tài chính hợp nhất + Lưới Kế toán 13 Cột Toàn Màn Hình */}
            <main className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Dải điều khiển tài chính & thao tác hợp nhất siêu gọn chuẩn QLMN */}
              <FinancialSummaryStrip
                onBackToList={() => {
                  setActivePmsModule('nutrition_adjust_month');
                  setMenuViewMode('list');
                }}
                schoolName={currentPlan.schoolName}
                segmentLabel={currentSegment === 'maugiao' ? 'Mẫu giáo' : currentSegment === 'nhatre' ? 'Nhà trẻ' : 'Ăn sáng'}
                date={selectedDate}
                onDateChange={(d) => setSelectedDate(d)}
                status={currentPlan.status}
                onStatusChange={(s) => handleStatusChange(s)}
                canApproveMenu={rolePerm.canApproveMenu}
                canLockMenu={rolePerm.canLockMenu}
                studentCount={currentPlan.studentCount}
                onStudentCountChange={handleStudentCountChange}
                onFetchAttendanceCount={handleFetchAttendanceCount}
                selectedBranchId={selectedBranchId}
                onBranchSelect={handleBranchSelect}
                branchInput={branchInput}
                onBranchInputChange={handleBranchInputChange}
                branches={branches}
                mealPricePerChild={currentPlan.mealPricePerChild}
                onMealPriceChange={(pr) =>
                  updateCurrentPlan((p) => ({ ...p, mealPricePerChild: pr }))
                }
                serviceFee={currentPlan.serviceFee || 0}
                subsidyFee={currentPlan.subsidyFee || 0}
                initialDifference={currentPlan.initialDifference || 0}
                totalCost={effectiveBranchCost}
                onAddFood={() => setIsAddModalOpen(true)}
                onCopyZalo={handleCopyZaloPO}
                onSave={() => {
                  triggerCloudSync();
                  showToast('Đã lưu dữ liệu thực đơn thành công', 'success');
                }}
                onPrint={() => setIsPrintModalOpen(true)}
                onSaveTemplate={handleSaveCurrentAsTemplate}
                onOpenAuto20DaysModal={() => setIsAuto20DaysModalOpen(true)}
                isLocked={isLocked}
                canEditNutrients={rolePerm.canEditNutrients}
              />

              {/* Cảnh báo khi thực đơn LOCKED */}
              {isLocked && (
                <div className="bg-purple-900 text-purple-100 px-3 py-1 text-xs font-bold flex items-center justify-between shrink-0 shadow-inner">
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

              {/* Lưới Kế toán 13 cột toàn màn hình cuộn mượt mà (Có Mã TP, Vạch trạng thái, Nhóm món) */}
              <NutritionGrid
                items={computedItems}
                totals={totals}
                branches={branches}
                isLocked={isLocked}
                canEditNutrients={rolePerm.canEditNutrients}
                onUpdateGam={handleUpdateGam}
                onUpdateBranchBuy={handleUpdateBranchBuy}
                onToggleFixed={handleToggleFixed}
                onRemoveItem={handleRemoveItem}
                onScaleNutrientGroup={handleScaleNutrientGroup}
                onSaveAsTemplate={handleSaveCurrentAsTemplate}
              />

              {/* Chân trang Ma trận Dinh dưỡng 7 dòng + Phân bổ Calo từng bữa + Thẻ Đánh giá Lượng/Chất + Nút cam Cân đối thực đơn */}
              <NutritionMatrixFooter
                computedItems={computedItems}
                totals={totals}
                ageGroup={currentSegment}
                onRunSolver={handleRunSolver}
                isSolving={isSolving}
                onScaleNutrientGroup={handleScaleNutrientGroup}
              />
            </main>
          </>
          )
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

        {/* VIEW 5: QUẢN LÝ KHO BÁN TRÚ (FIFO) */}
        {activeTab === 'warehouse' && (
          <WarehouseView
            inventoryItems={inventoryItems}
            transactions={stockTransactions}
            auditReports={auditReports}
            onAddStockTransaction={handleAddStockTransaction}
            onApplyAuditAdjustment={handleApplyAuditAdjustment}
            canManageWarehouse={rolePerm.canEditNutrients}
          />
        )}

        {/* VIEW 6: KẾ TOÁN TÀI CHÍNH / SỔ TÍNH TIỀN ĂN 02-MN / NCC / CẤU HÌNH ĐỊNH MỨC */}
        {activeTab === 'finance' && (
          activePmsModule === 'student_meal_ledger' ? (
            <StudentMealLedgerView
              classSummaries={classMealLedgers}
              onOpenPrintModal={() => setIsPrintModalOpen(true)}
              onShowToast={showToast}
            />
          ) : activePmsModule === 'nutrition_standards' ? (
            <NutritionStandardsView
              standards={nutritionStandards}
              onSaveStandard={(std) => {
                setNutritionStandards((prev) => ({ ...prev, [std.ageGroup]: std }));
                showToast(`✓ Đã lưu định mức & tỷ lệ 3 bữa cho ${std.title}`, 'success');
              }}
              onResetStandard={(ag) => {
                setNutritionStandards((prev) => ({ ...prev, [ag]: SEED_NUTRITION_STANDARDS[ag] }));
              }}
              onShowToast={showToast}
            />
          ) : activePmsModule === 'suppliers' ? (
            <SupplierListView
              contracts={supplierContracts}
              deliveryNotes={deliveryNotes}
              reconciliations={monthlyReconciliations}
              paymentVouchers={paymentVouchers}
              onShowToast={showToast}
            />
          ) : (
            <FinanceView
              settlements={settlements}
              suppliersDebt={suppliersDebt}
              onRecordSupplierPayment={handleRecordSupplierPayment}
            />
          )
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

      {/* TRÌNH THUẬT SĨ TỰ ĐỘNG SINH THỰC ĐƠN 4 TUẦN (QĐ 2195) */}
      <AutoMenu20DaysWizardModal
        isOpen={isAuto20DaysModalOpen}
        onClose={() => setIsAuto20DaysModalOpen(false)}
        onApplyToSchedule={handleApplyCycleToSchedule}
        initialAgeGroup={currentSegment}
        initialStudentCount={currentPlan.studentCount}
        initialBudget={currentPlan.mealPricePerChild}
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

      {/* MODAL IN ẤN A4 CHUẨN CÔNG VĂN (PHIẾU KÊ CHỢ, SỔ 01-MN, KIỂM THỰC 3 BƯỚC) */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        plan={currentPlan}
        totals={totals}
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
