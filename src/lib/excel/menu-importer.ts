import ExcelJS from 'exceljs';
import { AgeGroup, MenuItem, MealSession, FoodItem } from '@/types/nutrition';
import { STANDARD_FOOD_CATALOG } from '@/data/standard-foods';
import { SEED_DISH_ITEMS } from '@/data/seed-dishes';

export interface ParsedMenuItem {
  foodName: string;
  matchedFood: FoodItem | null;
  mealSession: MealSession;
  gamPerChild: number;
  dishName?: string;
  unit?: string;
  price?: number;
  warning?: string;
}

export interface ParsedDayMenu {
  date?: string;
  dayOfWeek?: string;
  menuTitle: {
    sang?: string;
    trua?: string;
    phu_trua?: string;
    xe?: string;
    phu_xe?: string;
  };
  items: ParsedMenuItem[];
  unmatchedCount: number;
}

export interface MenuImportResult {
  success: boolean;
  message: string;
  mode: 'ingredients' | 'dishes' | 'hybrid';
  days: ParsedDayMenu[];
  totalItems: number;
  matchedItemsCount: number;
}

// Chuẩn hóa chuỗi tìm kiếm tiếng Việt (bỏ dấu, thường hóa)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim();
}

// Tìm thực phẩm trong danh mục chuẩn 120+ loại
export function findBestMatchingFood(rawName: string): FoodItem | null {
  if (!rawName || !rawName.trim()) return null;
  const norm = normalizeText(rawName);

  // 1. Khớp chính xác mã hoặc tên
  let matched = STANDARD_FOOD_CATALOG.find(
    (f) => normalizeText(f.name) === norm || normalizeText(f.code) === norm
  );
  if (matched) return matched;

  // 2. Khớp chuỗi con (tên chứa từ khóa)
  matched = STANDARD_FOOD_CATALOG.find((f) => {
    const fNorm = normalizeText(f.name);
    return fNorm.includes(norm) || norm.includes(fNorm);
  });
  if (matched) return matched;

  // 3. Khớp các từ khóa thông dụng phổ biến
  const keywordsMap: Record<string, string> = {
    'thit heo': 'THIT_HEO_NAC',
    'thit lon': 'THIT_HEO_NAC',
    'thit bo': 'THIT_BO_FILE',
    'thit ga': 'THIT_GA_PHI_LE',
    'ca nac': 'CA_NAC',
    'ca': 'CA_NAC',
    'tom': 'TOM_DONG',
    'trung': 'TRUNG_GA',
    'trung cut': 'TRUNG_CUT',
    'dau hu': 'DAU_PHU',
    'tau hu': 'DAU_PHU',
    'dau phu': 'DAU_PHU',
    'gao': 'GAO_THOM',
    'com': 'GAO_THOM',
    'bun': 'BUN_TUOI',
    'pho': 'BUN_TUOI',
    'mi': 'BUN_TUOI',
    'sua': 'SUA_BOT_GROW',
    'sua tuoi': 'SUA_TUOI_TIET_TRUNG',
    'sua chua': 'SUA_CHUA',
    'bi do': 'BI_DO',
    'bau': 'BAU',
    'muop': 'MUOP',
    'rau ngot': 'RAU_NGOT',
    'rau muong': 'RAU_MUONG',
    'ca rot': 'CA_ROT',
    'khoai tay': 'KHOAI_TAY',
    'dau an': 'DAU_MEIZAN',
    'mo': 'MO_LON',
    'nuoc mam': 'NUOC_MAM',
    'duong': 'DUONG_CAT',
    'muoi': 'MUOI_IOT',
    'chuoi': 'CHUOI_TIEU',
    'du du': 'DU_DU',
    'dua hau': 'DUA_HAU',
  };

  for (const [kw, code] of Object.entries(keywordsMap)) {
    if (norm.includes(kw)) {
      matched = STANDARD_FOOD_CATALOG.find((f) => f.code === code);
      if (matched) return matched;
    }
  }

  return null;
}

// Chuẩn hóa bữa ăn
function mapMealSession(sessionText: string): MealSession {
  const norm = normalizeText(sessionText);
  if (norm.includes('sang')) return 'sang';
  if (norm.includes('phu trua') || norm.includes('trang mieng')) return 'phu_trua';
  if (norm.includes('xe') || norm.includes('chieu') || norm.includes('phu')) {
    if (norm.includes('sua') || norm.includes('phu xe')) return 'phu_xe';
    return 'xe';
  }
  return 'chinh_trua';
}

/**
 * Phân tích file Excel thực đơn (Buffer)
 */
export async function parseMenuExcel(buffer: Buffer): Promise<MenuImportResult> {
  const workbook = new ExcelJS.Workbook();
  // @ts-expect-error exceljs write/read buffer typing
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return {
      success: false,
      message: 'Không tìm thấy Sheet nào trong file Excel!',
      mode: 'ingredients',
      days: [],
      totalItems: 0,
      matchedItemsCount: 0,
    };
  }

  const rows: string[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const vals = row.values as unknown[];
    if (Array.isArray(vals)) {
      rows.push(
        vals.slice(1).map((v) => (v !== null && v !== undefined ? String(v).trim() : ''))
      );
    }
  });

  if (rows.length === 0) {
    return {
      success: false,
      message: 'File Excel không có dữ liệu!',
      mode: 'ingredients',
      days: [],
      totalItems: 0,
      matchedItemsCount: 0,
    };
  }

  // 1. Kiểm tra header hàng để nhận diện cấu trúc
  let headerRowIdx = -1;
  let colSession = -1;
  let colName = -1;
  let colGam = -1;
  let colDish = -1;
  let colUnit = -1;
  let colPrice = -1;

  for (let r = 0; r < Math.min(10, rows.length); r++) {
    const row = rows[r].map((c) => normalizeText(c));
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (cell.includes('thuc pham') || cell.includes('nguyen lieu') || cell.includes('ten hang')) colName = c;
      if (cell.includes('bua') || cell.includes('bua an')) colSession = c;
      if (cell.includes('dinh luong') || cell.includes('gam') || cell.includes('g/tre') || cell.includes('so luong')) colGam = c;
      if (cell.includes('mon') || cell.includes('ten mon')) colDish = c;
      if (cell.includes('dvt') || cell.includes('don vi')) colUnit = c;
      if (cell.includes('don gia') || cell.includes('gia')) colPrice = c;
    }
    if (colName !== -1 && (colGam !== -1 || colSession !== -1)) {
      headerRowIdx = r;
      break;
    }
  }

  const parsedItems: ParsedMenuItem[] = [];
  let matchedCount = 0;

  // Nếu tìm thấy cột kiểu nguyên liệu chi tiết (Kiểu A)
  if (colName !== -1 && headerRowIdx !== -1) {
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      const rawName = row[colName];
      if (!rawName || rawName === '' || rawName.toLowerCase().startsWith('tong') || rawName.startsWith('---')) continue;

      const rawGam = colGam !== -1 ? parseFloat(row[colGam]?.replace(',', '.') || '0') : 50;
      const rawSession = colSession !== -1 ? row[colSession] : 'chinh_trua';
      const rawDish = colDish !== -1 ? row[colDish] : undefined;
      const rawUnit = colUnit !== -1 ? row[colUnit] : undefined;
      const rawPrice = colPrice !== -1 ? parseFloat(row[colPrice]?.replace(/[.,]/g, '') || '0') : undefined;

      const matched = findBestMatchingFood(rawName);
      if (matched) matchedCount++;

      parsedItems.push({
        foodName: rawName,
        matchedFood: matched,
        mealSession: mapMealSession(rawSession),
        gamPerChild: isNaN(rawGam) || rawGam <= 0 ? 50 : rawGam,
        dishName: rawDish,
        unit: rawUnit || matched?.unit || 'kg',
        price: rawPrice || matched?.price,
        warning: matched ? undefined : 'Chưa khớp danh mục chuẩn Viện Dinh Dưỡng, dùng thông số mặc định',
      });
    }

    const dayMenu: ParsedDayMenu = {
      menuTitle: {
        trua: parsedItems.find((i) => i.mealSession === 'chinh_trua')?.dishName || 'Bữa trưa dinh dưỡng',
        xe: parsedItems.find((i) => i.mealSession === 'xe')?.dishName || 'Bữa xế chiều',
        phu_xe: parsedItems.find((i) => i.mealSession === 'phu_xe')?.dishName || 'Sữa dinh dưỡng',
      },
      items: parsedItems,
      unmatchedCount: parsedItems.length - matchedCount,
    };

    return {
      success: true,
      message: `Đã đọc thành công ${parsedItems.length} thực phẩm (Khớp ${matchedCount}/${parsedItems.length} thực phẩm trong danh mục chuẩn)`,
      mode: 'ingredients',
      days: [dayMenu],
      totalItems: parsedItems.length,
      matchedItemsCount: matchedCount,
    };
  }

  // Phương án B: Đọc danh sách món ăn từ các dòng
  const dishDiscovered: ParsedMenuItem[] = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (const cell of row) {
      if (!cell || cell.length < 3) continue;
      // Tìm xem có khớp món trong SEED_DISH_ITEMS không
      const normCell = normalizeText(cell);
      const matchedDish = SEED_DISH_ITEMS.find((d) => normalizeText(d.name).includes(normCell) || normCell.includes(normalizeText(d.name)));
      if (matchedDish) {
        matchedDish.ingredients.forEach((ing) => {
          const food = STANDARD_FOOD_CATALOG.find((f) => f.code === ing.foodCode || f.id === ing.foodId) || null;
          if (food) matchedCount++;
          dishDiscovered.push({
            foodName: ing.foodName,
            matchedFood: food,
            mealSession: matchedDish.mealSession === 'sang' ? 'sang' : matchedDish.mealSession === 'chieu' ? 'xe' : 'chinh_trua',
            gamPerChild: ing.gamPerChild,
            dishName: matchedDish.name,
            unit: ing.unit,
            price: ing.unitPrice,
          });
        });
      }
    }
  }

  if (dishDiscovered.length > 0) {
    return {
      success: true,
      message: `Đã nhận diện món ăn và trích xuất ${dishDiscovered.length} nguyên liệu từ thư viện món`,
      mode: 'dishes',
      days: [{
        menuTitle: { trua: 'Thực đơn nạp từ Excel', xe: 'Món xế chiều' },
        items: dishDiscovered,
        unmatchedCount: dishDiscovered.length - matchedCount,
      }],
      totalItems: dishDiscovered.length,
      matchedItemsCount: matchedCount,
    };
  }

  return {
    success: false,
    message: 'Không nhận diện được cấu trúc cột thực phẩm hoặc món ăn. Vui lòng bấm "Tải file mẫu Excel chuẩn" để kiểm tra định dạng.',
    mode: 'ingredients',
    days: [],
    totalItems: 0,
    matchedItemsCount: 0,
  };
}

/**
 * Tạo file Excel mẫu chuẩn (.xlsx) để người dùng tải về tham chiếu
 */
export async function generateMenuTemplateWorkbook(): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PMS Next-Gen v2.5';
  wb.created = new Date();

  // SHEET 1: Mẫu Nhập Thực Đơn Chi Tiết
  const ws1 = wb.addWorksheet('Thuc_Don_Chuan_Mau', { views: [{ showGridLines: true }] });
  ws1.columns = [
    { width: 6 },  // STT
    { width: 16 }, // Bữa ăn
    { width: 26 }, // Tên món ăn
    { width: 28 }, // Tên thực phẩm / Nguyên liệu
    { width: 12 }, // Đơn vị tính
    { width: 20 }, // Định lượng 1 trẻ (g)
    { width: 16 }, // Đơn giá dự kiến (đ)
    { width: 24 }, // Ghi chú
  ];

  // Header tiêu đề
  ws1.mergeCells('A1:H1');
  ws1.getCell('A1').value = 'BIỂU MẪU NHẬP THỰC ĐƠN BÁN TRÚ MẦM NON (CHUẨN PMS v2.5)';
  ws1.getCell('A1').font = { name: 'Arial', size: 12, bold: true, color: { argb: '1E3A8A' } };
  ws1.getCell('A1').alignment = { horizontal: 'center' };

  ws1.mergeCells('A2:H2');
  ws1.getCell('A2').value = 'Hướng dẫn: Điền danh sách nguyên liệu và định lượng g/trẻ theo từng bữa. Hệ thống sẽ tự động tính toán tổng mua và cân bằng dinh dưỡng.';
  ws1.getCell('A2').font = { name: 'Arial', size: 9, italic: true, color: { argb: '475569' } };
  ws1.getCell('A2').alignment = { horizontal: 'center' };

  // Headers
  const headers = [
    'STT',
    'Bữa ăn (*)',
    'Tên món ăn',
    'Tên thực phẩm (*)',
    'Đơn vị tính',
    'Định lượng 1 trẻ (g) (*)',
    'Đơn giá dự kiến (đ)',
    'Ghi chú',
  ];
  const hRow = ws1.addRow(headers);
  hRow.height = 24;
  hRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E40AF' } };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Dữ liệu mẫu 1 ngày
  const sampleData = [
    [1, 'Chính trưa', 'Cơm thơm lài', 'Gạo thơm lài', 'kg', 55, 13500, 'Gạo dẻo'],
    [2, 'Chính trưa', 'Thịt heo kho cút', 'Thịt heo nạc đùi', 'kg', 35, 110000, 'Thịt tươi'],
    [3, 'Chính trưa', 'Thịt heo kho cút', 'Trứng chim cút', 'quả', 20, 80000, '2 quả/cháu'],
    [4, 'Chính trưa', 'Canh bí đỏ tôm', 'Bí đỏ hồ lô', 'kg', 30, 20000, 'Bí dẻo'],
    [5, 'Chính trưa', 'Canh bí đỏ tôm', 'Tôm đồng tươi sống', 'kg', 12, 180000, 'Tôm lột vỏ'],
    [6, 'Chính trưa', 'Rau muống xào tỏi', 'Rau muống non', 'kg', 35, 18000, 'Rau sạch'],
    [7, 'Chính trưa', 'Gia vị chung', 'Dầu thực vật Meizan', 'lít', 8, 38000, 'Dầu ăn'],
    [8, 'Chính trưa', 'Gia vị chung', 'Nước mắm Nam Ngư', 'lít', 2.5, 35000, 'Gia vị'],
    [9, 'Phụ trưa', 'Chuối tiêu chín', 'Chuối tiêu chín mềm', 'kg', 60, 22000, 'Tráng miệng'],
    [10, 'Xế chiều', 'Cháo lươn đậu xanh', 'Gạo thơm lài', 'kg', 25, 13500, 'Nấu cháo xế'],
    [11, 'Xế chiều', 'Cháo lươn đậu xanh', 'Thịt gà phi lê', 'kg', 20, 85000, 'Bổ sung đạm'],
    [12, 'Phụ xế', 'Sữa chua men sống', 'Sữa chua Vinamilk có đường', 'hộp', 100, 7500, '1 hộp/cháu'],
  ];

  sampleData.forEach((row) => {
    const r = ws1.addRow(row);
    r.height = 18;
    r.eachCell((c, idx) => {
      c.font = { name: 'Arial', size: 9 };
      c.alignment = { vertical: 'middle', horizontal: idx === 1 || idx === 2 ? 'center' : idx === 6 || idx === 7 ? 'right' : 'left' };
      c.border = { top: { style: 'thin', color: { argb: 'CBD5E1' } }, bottom: { style: 'thin', color: { argb: 'CBD5E1' } } };
    });
  });

  // SHEET 2: Danh Mục 120+ Thực Phẩm Viện Dinh Dưỡng Có Sẵn
  const ws2 = wb.addWorksheet('Danh_Muc_Thuc_Pham_Chuan', { views: [{ showGridLines: true }] });
  ws2.columns = [
    { width: 6 },  // STT
    { width: 18 }, // Mã TP
    { width: 30 }, // Tên thực phẩm
    { width: 14 }, // Nhóm
    { width: 10 }, // ĐVT
    { width: 14 }, // Đơn giá (đ)
    { width: 14 }, // Calo/100g
    { width: 14 }, // Đạm/100g
    { width: 14 }, // Béo/100g
    { width: 14 }, // Đường bột/100g
  ];

  const hRow2 = ws2.addRow([
    'STT',
    'Mã thực phẩm',
    'Tên thực phẩm chuẩn',
    'Nhóm thực phẩm',
    'ĐVT',
    'Đơn giá (đ)',
    'Calo/100g',
    'Đạm/100g',
    'Béo/100g',
    'Carbs/100g',
  ]);
  hRow2.height = 24;
  hRow2.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '047857' } };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  STANDARD_FOOD_CATALOG.forEach((f, idx) => {
    const calo100g = f.protein100g * 4 + f.fat100g * 9 + f.carbs100g * 4;
    const r = ws2.addRow([
      idx + 1,
      f.code,
      f.name,
      f.category,
      f.unit,
      f.price,
      Math.round(calo100g),
      f.protein100g,
      f.fat100g,
      f.carbs100g,
    ]);
    r.height = 18;
    r.eachCell((c, cIdx) => {
      c.font = { name: 'Arial', size: 8.5 };
      c.alignment = { vertical: 'middle', horizontal: cIdx <= 2 ? 'center' : cIdx >= 6 ? 'right' : 'left' };
    });
  });

  return wb;
}
