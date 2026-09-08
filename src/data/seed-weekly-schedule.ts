import { DayMenuBundle, DailyMenuPlan, MenuItem } from '../types/nutrition';
import { SEED_FOOD_ITEMS, SEED_MENU_PLAN_HAMTHANG } from './seed-data-hamthang';
import { STANDARD_FOOD_CATALOG } from './standard-foods';

const findFood = (code: string) => {
  return STANDARD_FOOD_CATALOG.find((f) => f.code === code) || SEED_FOOD_ITEMS[0];
};

// ==========================================
// THỰC ĐƠN PHÂN HỆ ĂN SÁNG (7.000 đ/trẻ)
// ==========================================
const createBreakfastPlan = (date: string, title: string, items: MenuItem[]): DailyMenuPlan => ({
  id: `breakfast_${date}`,
  date,
  schoolName: 'Trường Mẫu Giáo Hàm Thắng',
  divisionName: 'UBND PHƯỜNG HÀM THẮNG',
  ageGroup: 'ansang',
  studentCount: 350,
  mealPricePerChild: 7000,
  serviceFee: 0,
  menuCode: `SÁNG. ${date}`,
  menuTitle: { sang: title },
  items,
  status: 'OPTIMIZED',
});

// ==========================================
// 5 NGÀY TRONG TUẦN (Thứ 2 -> Thứ 6)
// ==========================================
export const SEED_WEEKLY_SCHEDULE: DayMenuBundle[] = [
  // 1. THỨ HAI (2026-09-07)
  {
    date: '2026-09-07',
    dayOfWeek: 'Thứ Hai',
    maugiao: {
      id: 'menu_20260907_mg',
      date: '2026-09-07',
      schoolName: 'Trường Mẫu Giáo Hàm Thắng',
      divisionName: 'UBND PHƯỜNG HÀM THẮNG',
      ageGroup: 'maugiao',
      studentCount: 526,
      mealPricePerChild: 21000,
      serviceFee: 0,
      menuCode: 'TRƯA. 07/9/2026',
      menuTitle: {
        trua: 'Cơm tẻ dẻo; Thịt kho tàu; Canh chua cá nạc',
        xe: 'Bánh gạo dinh dưỡng',
        phu_xe: 'Sữa Ellac mầm non',
      },
      status: 'APPROVED',
      approvedBy: 'Hiệu trưởng Lưu Thị Lai',
      approvedAt: '07:30 07/09/2026',
      items: [
        { id: 't2_1', foodId: 'food_1', food: findFood('GAO_THOM'), mealSession: 'chinh_trua', gamPerChild: 55 },
        { id: 't2_2', foodId: 'food_thit_heo_nac', food: findFood('THIT_HEO_NAC'), mealSession: 'chinh_trua', gamPerChild: 35 },
        { id: 't2_3', foodId: 'food_2', food: findFood('CA_NAC'), mealSession: 'chinh_trua', gamPerChild: 25 },
        { id: 't2_4', foodId: 'food_14', food: findFood('BAU'), mealSession: 'chinh_trua', gamPerChild: 20 },
        { id: 't2_5', foodId: 'food_5', food: findFood('DAU_MEIZAN'), mealSession: 'chinh_trua', gamPerChild: 10 },
        { id: 't2_6', foodId: 'food_7', food: findFood('NUOC_MAM'), mealSession: 'chinh_trua', gamPerChild: 2.5, isFixed: true },
        { id: 't2_7', foodId: 'food_9', food: findFood('DUONG_CAT'), mealSession: 'chinh_trua', gamPerChild: 10, isFixed: true },
        { id: 't2_8', foodId: 'food_banh_mi', food: findFood('BANH_MI'), mealSession: 'xe', gamPerChild: 40 },
        { id: 't2_9', foodId: 'food_sua_tuoi', food: findFood('SUA_TUOI_VINAMILK'), mealSession: 'phu_xe', gamPerChild: 100, isFixed: true },
      ],
    },
    nhatre: {
      id: 'menu_20260907_nt',
      date: '2026-09-07',
      schoolName: 'Trường Mẫu Giáo Hàm Thắng',
      divisionName: 'UBND PHƯỜNG HÀM THẮNG',
      ageGroup: 'nhatre',
      studentCount: 120,
      mealPricePerChild: 21000,
      serviceFee: 0,
      menuCode: 'NT. 07/9/2026',
      menuTitle: {
        trua: 'Cơm nát; Thịt băm kho mềm; Canh bí đỏ cá',
        xe: 'Cháo bí đỏ thịt heo',
        phu_xe: 'Sữa Ellac mầm non',
      },
      status: 'APPROVED',
      items: [
        { id: 't2_nt1', foodId: 'food_1', food: findFood('GAO_THOM'), mealSession: 'chinh_trua', gamPerChild: 48 },
        { id: 't2_nt2', foodId: 'food_thit_heo_nac', food: findFood('THIT_HEO_NAC'), mealSession: 'chinh_trua', gamPerChild: 32 },
        { id: 't2_nt3', foodId: 'food_bi_do', food: findFood('BI_DO'), mealSession: 'chinh_trua', gamPerChild: 25 },
        { id: 't2_nt4', foodId: 'food_5', food: findFood('DAU_MEIZAN'), mealSession: 'chinh_trua', gamPerChild: 12 },
        { id: 't2_nt5', foodId: 'food_sua_tuoi', food: findFood('SUA_TUOI_VINAMILK'), mealSession: 'phu_xe', gamPerChild: 100, isFixed: true },
      ],
    },
    ansang: createBreakfastPlan('2026-09-07', 'Cháo tôm thịt hải sản', [
      { id: 't2_as1', foodId: 'food_1', food: findFood('GAO_THOM'), mealSession: 'sang', gamPerChild: 30 },
      { id: 't2_as2', foodId: 'food_17', food: findFood('TOM_DONG'), mealSession: 'sang', gamPerChild: 15 },
      { id: 't2_as3', foodId: 'food_thit_heo_nac', food: findFood('THIT_HEO_NAC'), mealSession: 'sang', gamPerChild: 10 },
    ]),
  },

  // 2. THỨ BA (2026-09-08)
  {
    date: '2026-09-08',
    dayOfWeek: 'Thứ Ba',
    maugiao: {
      id: 'menu_20260908_mg',
      date: '2026-09-08',
      schoolName: 'Trường Mẫu Giáo Hàm Thắng',
      divisionName: 'UBND PHƯỜNG HÀM THẮNG',
      ageGroup: 'maugiao',
      studentCount: 526,
      mealPricePerChild: 21000,
      serviceFee: 0,
      menuCode: 'TRƯA. 08/9/2026',
      menuTitle: {
        trua: 'Cơm thơm lài; Chả thịt chiên xì dầu; Canh đu đủ thịt heo',
        xe: 'Nui xào thịt heo băm',
        phu_xe: 'Nước chanh tươi',
      },
      status: 'APPROVED',
      items: [
        { id: 't3_1', foodId: 'food_1', food: findFood('GAO_THOM'), mealSession: 'chinh_trua', gamPerChild: 52 },
        { id: 't3_2', foodId: 'food_thit_heo_nac', food: findFood('THIT_HEO_NAC'), mealSession: 'chinh_trua', gamPerChild: 38 },
        { id: 't3_3', foodId: 'food_15', food: findFood('CAI_NGOT'), mealSession: 'chinh_trua', gamPerChild: 25 },
        { id: 't3_4', foodId: 'food_nui', food: findFood('NUI_SAO'), mealSession: 'xe', gamPerChild: 45 },
        { id: 't3_5', foodId: 'food_5', food: findFood('DAU_MEIZAN'), mealSession: 'chinh_trua', gamPerChild: 11 },
        { id: 't3_6', foodId: 'food_9', food: findFood('DUONG_CAT'), mealSession: 'phu_xe', gamPerChild: 15, isFixed: true },
      ],
    },
    nhatre: {
      id: 'menu_20260908_nt',
      date: '2026-09-08',
      schoolName: 'Trường Mẫu Giáo Hàm Thắng',
      divisionName: 'UBND PHƯỜNG HÀM THẮNG',
      ageGroup: 'nhatre',
      studentCount: 120,
      mealPricePerChild: 21000,
      serviceFee: 0,
      menuCode: 'NT. 08/9/2026',
      menuTitle: {
        trua: 'Cháo sườn heo đậu xanh; Canh đu đủ băm',
        xe: 'Nui mềm thịt heo',
        phu_xe: 'Mận chín',
      },
      status: 'APPROVED',
      items: [
        { id: 't3_nt1', foodId: 'food_1', food: findFood('GAO_THOM'), mealSession: 'chinh_trua', gamPerChild: 45 },
        { id: 't3_nt2', foodId: 'food_thit_heo_nac', food: findFood('THIT_HEO_NAC'), mealSession: 'chinh_trua', gamPerChild: 30 },
        { id: 't3_nt3', foodId: 'food_nui', food: findFood('NUI_SAO'), mealSession: 'xe', gamPerChild: 35 },
      ],
    },
    ansang: createBreakfastPlan('2026-09-08', 'Bánh canh chả cá', [
      { id: 't3_as1', foodId: 'food_18', food: findFood('BUN_TUOI'), mealSession: 'sang', gamPerChild: 50 },
      { id: 't3_as2', foodId: 'food_19', food: findFood('CHA_CA'), mealSession: 'sang', gamPerChild: 20 },
    ]),
  },

  // 3. THỨ TƯ (2026-09-09) - NGÀY MẪU GỐC CHUẨN XÁC KHỚP FILE XLS HÀM THẮNG
  {
    date: '2026-09-09',
    dayOfWeek: 'Thứ Tư',
    maugiao: SEED_MENU_PLAN_HAMTHANG,
    nhatre: {
      ...SEED_MENU_PLAN_HAMTHANG,
      id: 'menu_20260909_nhatre',
      ageGroup: 'nhatre',
      studentCount: 526,
      menuCode: 'NT. 09/9/2026',
    },
    ansang: createBreakfastPlan('2026-09-09', 'Cháo gà bông cải xanh', [
      { id: 't4_as1', foodId: 'food_1', food: findFood('GAO_THOM'), mealSession: 'sang', gamPerChild: 35 },
      { id: 't4_as2', foodId: 'food_thit_ga', food: findFood('THIT_GA_PHI_LE'), mealSession: 'sang', gamPerChild: 22 },
      { id: 't4_as3', foodId: 'food_15', food: findFood('CAI_NGOT'), mealSession: 'sang', gamPerChild: 15 },
    ]),
  },

  // 4. THỨ NĂM (2026-09-10)
  {
    date: '2026-09-10',
    dayOfWeek: 'Thứ Năm',
    maugiao: {
      id: 'menu_20260910_mg',
      date: '2026-09-10',
      schoolName: 'Trường Mẫu Giáo Hàm Thắng',
      divisionName: 'UBND PHƯỜNG HÀM THẮNG',
      ageGroup: 'maugiao',
      studentCount: 526,
      mealPricePerChild: 21000,
      serviceFee: 0,
      menuCode: 'TRƯA. 10/9/2026',
      menuTitle: {
        trua: 'Cơm thơm lài; Tôm ram thịt ba rọi; Canh mồng tơi cua đồng',
        xe: 'Miến gà nấu cà chua',
        phu_xe: 'Sữa Ellac mầm non',
      },
      status: 'DRAFT',
      items: [
        { id: 't5_1', foodId: 'food_1', food: findFood('GAO_THOM'), mealSession: 'chinh_trua', gamPerChild: 53 },
        { id: 't5_2', foodId: 'food_17', food: findFood('TOM_DONG'), mealSession: 'chinh_trua', gamPerChild: 25 },
        { id: 't5_3', foodId: 'food_thit_heo_nac', food: findFood('THIT_HEO_NAC'), mealSession: 'chinh_trua', gamPerChild: 20 },
        { id: 't5_4', foodId: 'food_mong_toi', food: findFood('MONG_TOI'), mealSession: 'chinh_trua', gamPerChild: 25 },
        { id: 't5_5', foodId: 'food_18', food: findFood('BUN_TUOI'), mealSession: 'xe', gamPerChild: 45 },
        { id: 't5_6', foodId: 'food_sua_tuoi', food: findFood('SUA_TUOI_VINAMILK'), mealSession: 'phu_xe', gamPerChild: 100, isFixed: true },
      ],
    },
    nhatre: {
      id: 'menu_20260910_nt',
      date: '2026-09-10',
      schoolName: 'Trường Mẫu Giáo Hàm Thắng',
      divisionName: 'UBND PHƯỜNG HÀM THẮNG',
      ageGroup: 'nhatre',
      studentCount: 120,
      mealPricePerChild: 21000,
      serviceFee: 0,
      menuCode: 'NT. 10/9/2026',
      menuTitle: {
        trua: 'Cháo tôm thịt mồng tơi cua đồng',
        xe: 'Miến cà chua thịt băm',
        phu_xe: 'Dưa hấu đỏ',
      },
      status: 'DRAFT',
      items: [
        { id: 't5_nt1', foodId: 'food_1', food: findFood('GAO_THOM'), mealSession: 'chinh_trua', gamPerChild: 45 },
        { id: 't5_nt2', foodId: 'food_17', food: findFood('TOM_DONG'), mealSession: 'chinh_trua', gamPerChild: 20 },
        { id: 't5_nt3', foodId: 'food_dua_hau', food: findFood('DUA_HAU'), mealSession: 'phu_xe', gamPerChild: 50, isFixed: true },
      ],
    },
    ansang: createBreakfastPlan('2026-09-10', 'Bún riêu cua đồng', [
      { id: 't5_as1', foodId: 'food_18', food: findFood('BUN_TUOI'), mealSession: 'sang', gamPerChild: 50 },
      { id: 't5_as2', foodId: 'food_20', food: findFood('TRUNG_CUT'), mealSession: 'sang', gamPerChild: 20, isFixed: true },
    ]),
  },

  // 5. THỨ SÁU (2026-09-11)
  {
    date: '2026-09-11',
    dayOfWeek: 'Thứ Sáu',
    maugiao: {
      id: 'menu_20260911_mg',
      date: '2026-09-11',
      schoolName: 'Trường Mẫu Giáo Hàm Thắng',
      divisionName: 'UBND PHƯỜNG HÀM THẮNG',
      ageGroup: 'maugiao',
      studentCount: 526,
      mealPricePerChild: 21000,
      serviceFee: 0,
      menuCode: 'TRƯA. 11/9/2026',
      menuTitle: {
        trua: 'Cơm thơm lài; Thịt bò xào cà rốt củ cải; Canh chua tôm',
        xe: 'Cháo gà ác đậu xanh',
        phu_xe: 'Chuối tiêu tráng miệng',
      },
      status: 'DRAFT',
      items: [
        { id: 't6_1', foodId: 'food_1', food: findFood('GAO_THOM'), mealSession: 'chinh_trua', gamPerChild: 52 },
        { id: 't6_2', foodId: 'food_thit_bo', food: findFood('THIT_BO_FILE'), mealSession: 'chinh_trua', gamPerChild: 30 },
        { id: 't6_3', foodId: 'food_ca_rot', food: findFood('CA_ROT'), mealSession: 'chinh_trua', gamPerChild: 20 },
        { id: 't6_4', foodId: 'food_thit_ga', food: findFood('THIT_GA_PHI_LE'), mealSession: 'xe', gamPerChild: 25 },
        { id: 't6_5', foodId: 'food_chuoi_tieu', food: findFood('CHUOI_TIEU'), mealSession: 'phu_xe', gamPerChild: 60, isFixed: true },
      ],
    },
    nhatre: {
      id: 'menu_20260911_nt',
      date: '2026-09-11',
      schoolName: 'Trường Mẫu Giáo Hàm Thắng',
      divisionName: 'UBND PHƯỜNG HÀM THẮNG',
      ageGroup: 'nhatre',
      studentCount: 120,
      mealPricePerChild: 21000,
      serviceFee: 0,
      menuCode: 'NT. 11/9/2026',
      menuTitle: {
        trua: 'Cơm nát; Bò băm xào cà rốt; Canh bí đỏ',
        xe: 'Cháo gà đậu xanh',
        phu_xe: 'Chuối tiêu chín mềm',
      },
      status: 'DRAFT',
      items: [
        { id: 't6_nt1', foodId: 'food_1', food: findFood('GAO_THOM'), mealSession: 'chinh_trua', gamPerChild: 45 },
        { id: 't6_nt2', foodId: 'food_thit_bo', food: findFood('THIT_BO_FILE'), mealSession: 'chinh_trua', gamPerChild: 25 },
        { id: 't6_nt3', foodId: 'food_chuoi_tieu', food: findFood('CHUOI_TIEU'), mealSession: 'phu_xe', gamPerChild: 50, isFixed: true },
      ],
    },
    ansang: createBreakfastPlan('2026-09-11', 'Mì Quảng tôm thịt', [
      { id: 't6_as1', foodId: 'food_18', food: findFood('BUN_TUOI'), mealSession: 'sang', gamPerChild: 45 },
      { id: 't6_as2', foodId: 'food_17', food: findFood('TOM_DONG'), mealSession: 'sang', gamPerChild: 15 },
      { id: 't6_as3', foodId: 'food_thit_heo_nac', food: findFood('THIT_HEO_NAC'), mealSession: 'sang', gamPerChild: 15 },
    ]),
  },
];
