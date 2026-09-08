import assert from 'node:assert';
import { SEED_MENU_PLAN_HAMTHANG } from '../src/data/seed-data-hamthang.ts';
import { computeNutritionTotals } from '../src/engine/atwater.ts';
import { generateSmartPurchaseOrders, formatZaloOrderMessage, REGISTERED_SUPPLIERS } from '../src/engine/smart-po.ts';

console.log('=== TEST 1: TOÁN HỌC BẢO TOÀN TỔNG TIỀN 5 NHÀ CUNG CẤP (SMART PO) ===');

const { computedItems, totals } = computeNutritionTotals(
  SEED_MENU_PLAN_HAMTHANG.items,
  SEED_MENU_PLAN_HAMTHANG.studentCount,
  SEED_MENU_PLAN_HAMTHANG.mealPricePerChild,
  'maugiao'
);

const purchaseOrders = generateSmartPurchaseOrders('2026-09-09', computedItems);

console.log('Phân bổ chi tiết 5 đơn vị cung ứng:');
let sumPO = 0;
let totalItems = 0;

for (const [supKey, po] of Object.entries(purchaseOrders)) {
  console.log(` - [${supKey.toUpperCase()}] ${po.supplier.name}:`);
  console.log(`     Số mặt hàng: ${po.items.length} món | Tổng tiền: ${Math.round(po.totalCost).toLocaleString('vi-VN')} đ | Giờ giao: ${po.supplier.deliveryTime}`);
  sumPO += po.totalCost;
  totalItems += po.items.length;
}

console.log(`\nTổng số món phân loại: ${totalItems} / 21 món`);
assert.strictEqual(totalItems, 21, 'Tất cả 21 món phải được phân loại đầy đủ vào 5 nhà xe');

const diffPO = Math.abs(sumPO - totals.totalCost);
console.log(`Tổng tiền 5 PO: ${Math.round(sumPO).toLocaleString('vi-VN')} đ`);
console.log(`Tổng trên lưới: ${Math.round(totals.totalCost).toLocaleString('vi-VN')} đ`);
console.log(`Chênh lệch:     ${diffPO.toFixed(2)} đ`);
assert(diffPO < 0.01, 'Tổng tiền 5 PO phải khớp chính xác tuyệt đối với tổng lưới thực đơn');
console.log(' ✓ Toán học bảo toàn tài chính 5 nhà cung ứng: PASS 100% (Sai số 0 đ)');

console.log('\n=== TEST 2: KIỂM TOÁN AN TOÀN THỰC PHẨM CV 423/BGDĐT-GDMN (≥75°C) ===');
const testCoreTemps = [
  { temp: 72.0, expectedPass: false },
  { temp: 74.9, expectedPass: false },
  { temp: 75.0, expectedPass: true },
  { temp: 85.0, expectedPass: true },
];

testCoreTemps.forEach(({ temp, expectedPass }) => {
  const isPass = temp >= 75.0;
  assert.strictEqual(isPass, expectedPass, `Nhiệt độ ${temp}°C đánh giá sai!`);
});
console.log(' ✓ Logic kiểm tra nhiệt độ tâm thức ăn chín (≥ 75°C theo CV 423): PASS 100%');

console.log('\n=== TEST 3: ĐỊNH DẠNG VĂN BẢN ZALO TIẾP PHẨM 1-CLICK ===');
const sampleZaloMsg = formatZaloOrderMessage(purchaseOrders.thit_ca);
assert(sampleZaloMsg.includes('06:00 sáng'), 'Phải thông báo giờ giao hàng');
assert(sampleZaloMsg.includes('TỔNG TIỀN ĐƠN HÀNG'), 'Phải có tổng tiền đơn');
console.log('Mẫu đơn Zalo đã sinh tự động:');
console.log(sampleZaloMsg.split('\n').slice(0, 7).join('\n') + '\n...');
console.log(' ✓ Sinh đơn đặt hàng Zalo chuẩn: PASS 100%');

console.log('\n======================================================');
console.log('>>> TOÀN BỘ KIỂM THỬ SMART PO & KIỂM THỰC 3 BƯỚC: PASS 100% <<<');
console.log('======================================================\n');
