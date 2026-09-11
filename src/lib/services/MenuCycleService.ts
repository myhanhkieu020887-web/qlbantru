import { AgeGroup, DailyMenuPlan, MenuItem, MealSession } from '@/types/nutrition';
import { MenuTemplateItem } from '@/types/menu-template';
import { SEED_MENU_TEMPLATES } from '@/data/seed-menu-templates';
import { SEED_WEEKLY_SCHEDULE } from '@/data/seed-weekly-schedule';

// ─────────────────────────────────────────────
// Hằng số chu kỳ 4 tuần A/B/C/D
// Tuần 1 = A, Tuần 2 = B, Tuần 3 = C, Tuần 4 = D
// ─────────────────────────────────────────────
const CYCLE_LABELS = ['A', 'B', 'C', 'D'] as const;
type CycleLabel = (typeof CYCLE_LABELS)[number];

// Map: dayOfWeek (1=T2..5=T6) → template code suffix
// Ví dụ: 'T1_T2' = Tuần A Thứ Hai
const DAY_SUFFIX: Record<number, string> = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6' };

// Tên tuần theo index 0-based trong tháng
const WEEK_CYCLE: CycleLabel[] = ['A', 'B', 'C', 'D'];

/**
 * Kết quả 1 ngày được gán trong fill-month
 */
export interface FillDayResult {
  date: string;           // ISO: '2026-09-01'
  weekLabel: CycleLabel;  // 'A' | 'B' | 'C' | 'D'
  templateCode: string;   // 'TD_MG_T1_T2'
  templateFound: boolean;
  skipped: boolean;       // true nếu ngày đã LOCKED
  plan: DailyMenuPlan | null;
}

export interface FillMonthResult {
  month: number;          // 1-12
  year: number;
  ageGroup: AgeGroup;
  totalDays: number;      // Số ngày làm việc trong tháng (T2-T6)
  filledDays: number;
  skippedDays: number;
  days: FillDayResult[];
}

/**
 * MenuCycleService — Tự động gán thực đơn 4 tuần xoay vòng cho cả tháng.
 *
 * Logic:
 * 1. Lấy tất cả ngày T2–T6 trong tháng
 * 2. Xác định tuần thứ mấy trong tháng (0-based) → chọn cycle A/B/C/D
 * 3. Tìm template khớp với ageGroup + weekLabel + dayOfWeek
 * 4. Tạo DailyMenuPlan từ template và seed data
 * 5. Skip ngày đã LOCKED
 */
export class MenuCycleService {
  private readonly templates: MenuTemplateItem[];

  constructor(templates: MenuTemplateItem[] = SEED_MENU_TEMPLATES) {
    this.templates = templates;
  }

  /**
   * Tạo danh sách FillDayResult cho cả tháng.
   * Không gọi Supabase — chỉ tính toán thuần túy.
   */
  buildMonthPlan(
    month: number,          // 1–12
    year: number,
    ageGroup: AgeGroup,
    studentCount: number,
    budgetPerStudent: number,
    lockedDates: Set<string> = new Set()
  ): FillMonthResult {
    const workDays = this.getWorkDays(month, year);
    const days: FillDayResult[] = [];

    // Xác định ngày đầu tiên của tháng là tuần thứ mấy trong năm → tính cycle offset
    const firstDay = new Date(year, month - 1, 1);
    // Tuần đầu tiên có T2 trong tháng
    const firstMonday = this.getFirstMonday(firstDay);
    let weekIndexInMonth = 0;

    for (const date of workDays) {
      const d = new Date(date);
      const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); // ISO: 1=T2 ... 7=CN
      const isoDay = dayOfWeek - 1; // 0=T2 ... 4=T6

      // Tính weekIndexInMonth: số tuần kể từ đầu tháng
      const weeksSinceFirst = Math.floor(
        (d.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      weekIndexInMonth = Math.max(0, weeksSinceFirst);

      const cycleIndex = weekIndexInMonth % 4;
      const weekLabel = WEEK_CYCLE[cycleIndex];

      // Tìm template: phương án đơn giản — tìm theo ageGroup + weekLabel + dayOfWeek suffix
      const daySuffix = DAY_SUFFIX[isoDay + 1] ?? 'T2';
      const template = this.findTemplate(ageGroup, weekLabel, daySuffix);
      const isLocked = lockedDates.has(date);

      days.push({
        date,
        weekLabel,
        templateCode: template?.code ?? `TD_${ageGroup.toUpperCase()}_T${cycleIndex + 1}_${daySuffix}`,
        templateFound: !!template,
        skipped: isLocked,
        plan: isLocked ? null : (template ? this.templateToPlan(template, date, ageGroup, studentCount, budgetPerStudent) : null),
      });
    }

    const filled = days.filter((d) => !d.skipped && d.plan !== null).length;
    const skipped = days.filter((d) => d.skipped).length;

    return {
      month,
      year,
      ageGroup,
      totalDays: workDays.length,
      filledDays: filled,
      skippedDays: skipped,
      days,
    };
  }

  /**
   * Lấy tất cả ngày T2–T6 (làm việc) trong tháng.
   */
  private getWorkDays(month: number, year: number): string[] {
    const days: string[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dow = date.getDay(); // 0=CN, 1=T2..6=T7
      if (dow >= 1 && dow <= 5) {
        // T2 - T6
        days.push(this.formatDate(date));
      }
    }
    return days;
  }

  /**
   * Tìm ngày T2 đầu tiên trong hoặc trước ngày đầu tháng.
   */
  private getFirstMonday(firstDay: Date): Date {
    const d = new Date(firstDay);
    const dow = d.getDay();
    // Lùi về T2 của tuần chứa ngày 1
    const diff = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + diff);
    return d;
  }

  /**
   * Tìm template phù hợp.
   * Ưu tiên: code chứa ageGroup + weekCycle + daySuffix
   * Fallback: bất kỳ template nào của ageGroup + daySuffix đó
   */
  private findTemplate(
    ageGroup: AgeGroup,
    weekLabel: CycleLabel,
    daySuffix: string
  ): MenuTemplateItem | undefined {
    const weekNum = CYCLE_LABELS.indexOf(weekLabel) + 1;
    const targetCode = `TD_${ageGroup === 'maugiao' ? 'MG' : 'NT'}_T${weekNum}_${daySuffix}`;

    // Exact match
    let found = this.templates.find(
      (t) => t.ageGroup === ageGroup && t.code === targetCode
    );

    // Fallback: tìm bất kỳ template nào của ageGroup đó
    if (!found) {
      found = this.templates.find((t) => t.ageGroup === ageGroup);
    }

    return found;
  }

  /**
   * Chuyển MenuTemplateItem → DailyMenuPlan đơn giản.
   * Items được tạo từ dishes trong template (chưa có gramPerChild — dùng seed-weekly-schedule làm reference).
   */
  private templateToPlan(
    template: MenuTemplateItem,
    date: string,
    ageGroup: AgeGroup,
    studentCount: number,
    budgetPerStudent: number
  ): DailyMenuPlan {
    // Lấy items từ seed-weekly-schedule làm skeleton
    const seedBundle = SEED_WEEKLY_SCHEDULE.find((b) =>
      ['maugiao', 'nhatre', 'ansang'].includes(ageGroup) ? true : false
    );
    const seedPlan = seedBundle ? (ageGroup === 'maugiao' ? seedBundle.maugiao : seedBundle.nhatre) : null;

    // Tạo items từ dishes của template
    const items: MenuItem[] = template.dishes.map((dish, idx) => {
      // Tìm item tương ứng từ seed plan nếu có (để lấy food data)
      const seedItem = seedPlan?.items.find((i) => i.mealSession === dish.mealSession);

      return {
        id: `fill_${date}_${idx}`,
        foodId: seedItem?.foodId ?? `food_${dish.dishId}`,
        food: seedItem?.food ?? {
          id: dish.dishId,
          code: dish.dishId.toUpperCase(),
          name: dish.dishName,
          category: 'khac' as const,
          unit: 'Kg',
          price: 0,
          gamExchange: 1000,
          wasteFactor: 1.0,
          isAnimalProtein: false,
          isAnimalFat: false,
          isFreeSugar: false,
          sodiumMg: 0,
          protein100g: 0,
          fat100g: 0,
          carbs100g: 0,
        },
        mealSession: dish.mealSession as MealSession,
        gamPerChild: seedItem?.gamPerChild ?? 50,
        dishId: dish.dishId,
        dishName: dish.dishName,
        isFixed: false,
      };
    });

    return {
      id: `cycle_${date}_${template.code}`,
      date,
      schoolName: 'Trường Mẫu Giáo Hàm Thắng',
      divisionName: 'UBND PHƯỜNG HÀM THẮNG',
      ageGroup,
      studentCount,
      mealPricePerChild: budgetPerStudent,
      serviceFee: 0,
      status: 'DRAFT',
      menuCode: template.code,
      menuTitle: {
        trua: template.dishes.find((d) => d.mealSession === 'chinh_trua')?.dishName,
        xe: template.dishes.find((d) => d.mealSession === 'xe')?.dishName,
        phu_xe: template.dishes.find((d) => d.mealSession === 'phu_xe')?.dishName,
      },
      items,
      initialDifference: 0,
    };
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
