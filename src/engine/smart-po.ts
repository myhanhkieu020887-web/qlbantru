import { ComputedMenuItem, SmartPurchaseOrder, SupplierInfo, SupplierType } from '@/types/nutrition';
import { formatNumber, formatCurrency } from '@/lib/utils';

export const REGISTERED_SUPPLIERS: Record<SupplierType, SupplierInfo> = {
  thit_ca: {
    id: 'thit_ca',
    name: 'Công ty CP Chăn nuôi C.P. Việt Nam',
    categoryName: 'Thịt heo, Thịt gà & Trứng tươi CP (kèm Hải sản Biển Đông)',
    deliveryTime: '06:00 sáng',
    contactName: 'Anh Trung (Điều phối giao nhận C.P)',
    phone: '028.3821.2368',
    iconName: 'Beef',
  },
  rau_cu: {
    id: 'rau_cu',
    name: 'HTX Nông nghiệp Rau an toàn VietGAP Hàm Thắng',
    categoryName: 'Rau xanh, Củ quả tươi & Nấm rơm VietGAP',
    deliveryTime: '05:45 sáng',
    contactName: 'Chị Ngọc (Vựa rau VietGAP)',
    phone: '0252.386.0000',
    iconName: 'Carrot',
  },
  gia_vi: {
    id: 'gia_vi',
    name: 'Cửa hàng Bách hóa Tổng hợp Minh Phát',
    categoryName: 'Gia vị, Nước mắm, Dầu ăn Neptune & Đồ khô',
    deliveryTime: '06:45 sáng',
    contactName: 'Anh Phát (Chủ cửa hàng bách hóa)',
    phone: '0252.386.5432',
    iconName: 'Container',
  },
  sua_banh: {
    id: 'sua_banh',
    name: 'NPP Sữa Dielac Vinamilk Bình Thuận',
    categoryName: 'Sữa tươi Vinamilk 180ml, Sữa bột Dielac & Sữa chua',
    deliveryTime: '07:00 sáng',
    contactName: 'Chị Lan (Điều phối Vinamilk)',
    phone: '0252.381.4567',
    iconName: 'Milk',
  },
  gao_bun: {
    id: 'gao_bun',
    name: 'Cửa hàng Bách hóa Tổng hợp Minh Phát (Gạo & Bún)',
    categoryName: 'Gạo tẻ ST25 thơm Sóc Trăng & Bún tươi sợi nhỏ',
    deliveryTime: '06:00 sáng',
    contactName: 'Anh Phát (Lò bún & Gạo ST25)',
    phone: '0252.386.5432',
    iconName: 'Wheat',
  },
};

export function classifySupplier(item: ComputedMenuItem): SupplierType {
  // Ưu tiên 0: Nhà cung cấp mặc định được chỉ định trong CSDL Thực phẩm
  if (item.food.defaultSupplierId) {
    return item.food.defaultSupplierId;
  }

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
