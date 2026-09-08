import { ComputedMenuItem, SmartPurchaseOrder, SupplierInfo, SupplierType } from '@/types/nutrition';
import { formatNumber, formatCurrency } from '@/lib/utils';

export const REGISTERED_SUPPLIERS: Record<SupplierType, SupplierInfo> = {
  thit_ca: {
    id: 'thit_ca',
    name: 'Công ty Thực phẩm Tươi Sống Hưng Thịnh',
    categoryName: 'Thịt bò, Thịt heo, Thủy hải sản & Trứng tươi',
    deliveryTime: '06:00 sáng',
    contactName: 'Anh Hưng (Đội xe tươi sống)',
    phone: '0913.456.789',
    iconName: 'Beef',
  },
  rau_cu: {
    id: 'rau_cu',
    name: 'HTX Nông sản Rau Củ Sạch Hàm Thắng (VietGAP)',
    categoryName: 'Rau xanh, Củ quả tươi & Nấm rơm',
    deliveryTime: '06:15 sáng',
    contactName: 'Chị Mai (Vựa rau sạch)',
    phone: '0988.123.456',
    iconName: 'Carrot',
  },
  gia_vi: {
    id: 'gia_vi',
    name: 'Đại lý Bách Hóa & Thực Phẩm Khô Minh Phát',
    categoryName: 'Gia vị, Nước mắm, Dầu ăn & Đồ khô',
    deliveryTime: '06:30 sáng',
    contactName: 'Anh Phát (Giao hàng khô)',
    phone: '0903.789.123',
    iconName: 'Container',
  },
  sua_banh: {
    id: 'sua_banh',
    name: 'Chi nhánh Sữa & Trái cây Tươi Bình Thuận',
    categoryName: 'Sữa chua Susu, Bánh & Trái cây tráng miệng',
    deliveryTime: '08:30 sáng',
    contactName: 'Chị Lan (Điều phối sữa & quả)',
    phone: '0937.654.321',
    iconName: 'Milk',
  },
  gao_bun: {
    id: 'gao_bun',
    name: 'Cơ sở Lương thực & Bún tươi Phương Nam',
    categoryName: 'Gạo tẻ ST25 & Bún tươi sợi nhỏ',
    deliveryTime: '06:00 sáng',
    contactName: 'Anh Nam (Lò bún & Gạo)',
    phone: '0918.999.888',
    iconName: 'Wheat',
  },
};

export function classifySupplier(item: ComputedMenuItem): SupplierType {
  const cat = item.food.category;
  const code = item.food.code.toUpperCase();

  // 1. Phân loại theo danh mục chuẩn (Category-First)
  if (cat === 'sua_banh') return 'sua_banh';
  if (cat === 'gao') return 'gao_bun';
  if (cat === 'rau_cu') return 'rau_cu';
  if (cat === 'thit_ca') return 'thit_ca';
  if (cat === 'gia_vi' || cat === 'dau_mo') return 'gia_vi';

  // 2. Phân loại theo mã thực phẩm (Word-Boundary Token Matching chống nhầm lẫn)
  if (/^(BUN|GAO)(_|$)/.test(code)) return 'gao_bun';
  if (/^(SUA|THANHLONG|CHUOI|TAO)(_|$)/.test(code)) return 'sua_banh';
  if (/^(THIT|CA_|CHA_CA|TOM|BO|HEO|TRUNG)(_|$)/.test(code)) return 'thit_ca';
  if (/^(BAU|CAI|NAM|HANH|NGO|CA_CHUA|CU_CAI)(_|$)/.test(code)) return 'rau_cu';

  return 'gia_vi';
}

export function generateSmartPurchaseOrders(
  date: string,
  items: ComputedMenuItem[]
): Record<SupplierType, SmartPurchaseOrder> {
  const initialMap: Record<SupplierType, SmartPurchaseOrder> = {
    thit_ca: {
      supplierId: 'thit_ca',
      supplier: REGISTERED_SUPPLIERS.thit_ca,
      date,
      items: [],
      totalCost: 0,
      status: 'PENDING',
    },
    rau_cu: {
      supplierId: 'rau_cu',
      supplier: REGISTERED_SUPPLIERS.rau_cu,
      date,
      items: [],
      totalCost: 0,
      status: 'PENDING',
    },
    gia_vi: {
      supplierId: 'gia_vi',
      supplier: REGISTERED_SUPPLIERS.gia_vi,
      date,
      items: [],
      totalCost: 0,
      status: 'PENDING',
    },
    sua_banh: {
      supplierId: 'sua_banh',
      supplier: REGISTERED_SUPPLIERS.sua_banh,
      date,
      items: [],
      totalCost: 0,
      status: 'PENDING',
    },
    gao_bun: {
      supplierId: 'gao_bun',
      supplier: REGISTERED_SUPPLIERS.gao_bun,
      date,
      items: [],
      totalCost: 0,
      status: 'PENDING',
    },
  };

  for (const it of items) {
    const supType = classifySupplier(it);
    initialMap[supType].items.push({
      foodCode: it.food.code,
      foodName: it.food.name,
      category: it.food.category,
      unit: it.food.unit,
      buyQuantity: it.actualBuyKg,
      unitPrice: it.food.price,
      totalCost: it.totalPrice,
      mealSession: it.mealSession,
    });
    initialMap[supType].totalCost += it.totalPrice;
  }

  return initialMap;
}

export function formatZaloOrderMessage(po: SmartPurchaseOrder, schoolName: string = 'Trường Mầm Non Hàm Thắng'): string {
  const lines: string[] = [
    `📦 ĐƠN ĐẶT HÀNG BÁN TRÚ NGÀY: ${po.date}`,
    `Trường: ${schoolName}`,
    `Nhà cung cấp: ${po.supplier.name}`,
    `Người nhận: ${po.supplier.contactName} (${po.supplier.phone})`,
    `⏰ Giờ giao quy định: ${po.supplier.deliveryTime}`,
    '----------------------------------------',
    'DANH MỤC HÀNG CẦN GIAO:',
  ];

  po.items.forEach((item, idx) => {
    lines.push(
      `${idx + 1}. ${item.foodName}: ${formatNumber(item.buyQuantity, 2)} ${item.unit} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.totalCost)}`
    );
  });

  lines.push('----------------------------------------');
  lines.push(`💰 TỔNG TIỀN ĐƠN HÀNG: ${formatCurrency(po.totalCost)}`);
  lines.push('⚠️ Yêu cầu: Hàng tươi sạch, có hóa đơn/tem VietGAP, giao đúng giờ để bếp kiểm thực 3 bước!');

  return lines.join('\n');
}
