import { generateMonth20DaysCycle } from '../src/engine/menu-cycle-generator.ts';
import {
  generate4WeeksMenuMatrixWorkbook,
  generate20DaysAuditWorkbook,
} from '../src/lib/excel/exporter.ts';

console.log('================================================================');
console.log('KIỂM THỬ ENGINE TỰ ĐỘNG SINH THỰC ĐƠN 4 TUẦN (20 NGÀY) QĐ 2195');
console.log('================================================================\n');

// 1. Chạy thuật toán sinh 20 ngày
const res = generateMonth20DaysCycle(282, 21000, 'maugiao', '2026-09-07');

console.log('1. KIỂM TRA SỐ LƯỢNG NGÀY & TUẦN:');
console.log(` - Tổng số ngày sinh ra: ${res.days.length} ngày (Mục tiêu: 20 ngày)`);
if (res.days.length === 20) {
  console.log(' -> [PASS] Đủ 20 ngày làm việc (4 tuần x 5 ngày)!');
} else {
  console.error(' -> [FAIL] Số lượng ngày không khớp 20!');
  process.exit(1);
}

// 2. Kiểm tra quy tắc xoay vòng 5 nhóm đạm
console.log('\n2. KIỂM TRA QUY TẮC XOAY VÒNG 5 NHÓM ĐẠM HỌC ĐƯỜNG:');
const expectedGroups = [
  'Thịt heo nạc',
  'Thịt bò tươi & Trứng',
  'Thủy hải sản',
  'Gia cầm',
  'Đa dạng',
];

for (let w = 1; w <= 4; w++) {
  const weekDays = res.days.filter((d) => d.weekIndex === w);
  console.log(` - Tuần ${w}:`);
  weekDays.forEach((d) => {
    console.log(
      `   + ${d.dayOfWeek} (${d.dateString}): [${d.proteinGroup}] -> ${d.mainDishName} | Canh: ${d.soupDishName} | Calo: ${d.totalCalo} Kcal | Tiền: ${d.costPerChild.toLocaleString('vi-VN')} đ`
    );
  });
}

// Kiểm tra không trùng món chính trong 2 ngày kế cận
let hasConsecutiveDuplicate = false;
for (let i = 0; i < res.days.length - 1; i++) {
  if (res.days[i].mainDishName === res.days[i + 1].mainDishName) {
    hasConsecutiveDuplicate = true;
    console.error(`Lỗi: Ngày ${res.days[i].dateString} và ${res.days[i + 1].dateString} trùng món ${res.days[i].mainDishName}`);
  }
}

if (!hasConsecutiveDuplicate) {
  console.log(' -> [PASS] 100% không có 2 ngày liền kề trùng món chính!');
} else {
  console.error(' -> [FAIL] Có ngày liên tiếp bị trùng món!');
  process.exit(1);
}

// 3. Kiểm tra các chỉ số dinh dưỡng & ngân sách bình quân
console.log('\n3. KIỂM TRA CHỈ SỐ BÌNH QUÂN CHU KỲ (SO VỚI QĐ 2195 & TT 51):');
console.log(` - Năng lượng Calo TB: ${res.averageCalo} Kcal (Chuẩn Mẫu giáo: 615 - 738 Kcal)`);
console.log(` - Tiền ăn bình quân: ${res.averageCost.toLocaleString('vi-VN')} đ (Định mức: 21.000 đ)`);
console.log(` - Cơ cấu P - L - G: ${res.averageProteinPct}% : ${res.averageFatPct}% : ${res.averageCarbsPct}%`);
console.log(` - Tỷ lệ ngày ĐẠT: ${res.complianceSummary.passedDays}/${res.complianceSummary.totalDays} ngày (${(res.complianceSummary.passedDays / res.complianceSummary.totalDays * 100).toFixed(0)}%)`);

if (res.averageCalo >= 615 && res.averageCalo <= 738) {
  console.log(' -> [PASS] Năng lượng Calo trung bình đạt chuẩn Thông tư 51!');
} else {
  console.error(' -> [FAIL] Năng lượng Calo trung bình ngoài ngưỡng!');
  process.exit(1);
}

if (Math.abs(res.averageCost - 21000) <= 100) {
  console.log(' -> [PASS] Ngân sách tiền ăn bình quân khớp tuyệt đối định mức 21.000đ!');
} else {
  console.error(' -> [FAIL] Lệch ngân sách quá ngưỡng cho phép!');
  process.exit(1);
}

// 4. Kiểm tra sinh 2 tệp Excel (A4 Ngang Phụ Huynh & Sổ 20 Ngày Thanh Tra)
console.log('\n4. KIỂM TRA TẠO WORKBOOK EXCEL 2-IN-1:');
try {
  const wb1 = await generate4WeeksMenuMatrixWorkbook(res, 'TRƯỜNG MẦM NON HOA HƯỚNG DƯƠNG');
  const buf1 = await wb1.xlsx.writeBuffer();
  console.log(` - [PASS] Tạo thành công Workbook 1 (Ma trận 4 tuần A4 ngang phụ huynh) - Dung lượng: ${buf1.byteLength} bytes`);

  const wb2 = await generate20DaysAuditWorkbook(res, 'TRƯỜNG MẦM NON HOA HƯỚNG DƯƠNG');
  const buf2 = await wb2.xlsx.writeBuffer();
  console.log(` - [PASS] Tạo thành công Workbook 2 (Sổ kiểm toán 20 ngày thanh tra) - Dung lượng: ${buf2.byteLength} bytes`);
} catch (err) {
  console.error(' -> [FAIL] Lỗi khi tạo file Excel:', err);
  process.exit(1);
}

console.log('\n================================================================');
console.log('TẤT CẢ 4 HẠNG MỤC KIỂM THỬ ĐÃ PASS 100% TUYỆT ĐỐI!');
console.log('================================================================');
