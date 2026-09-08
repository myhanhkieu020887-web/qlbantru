# Next-Gen PMS Enterprise v2.0 🥗🥦

> **Hệ Thống Quản Lý Dinh Dưỡng & Bán Trú Mầm Non Chuẩn Bộ GD&ĐT & Bộ Y Tế**
> Áp dụng Quyết định 2195/QĐ-BGDĐT, Công văn 423/BGDĐT-GDMN, Quyết định 1246/QĐ-BYT và Thông tư 28/2016/TT-BGDĐT.

---

## 🌟 Tính Năng Cốt Lõi

1. **Cân Đối Khẩu Phần Dinh Dưỡng (MILP Elastic Solver)**:
   - Tính toán năng lượng chính xác theo công thức Atwater ($4 - 9 - 4\text{ Kcal/g}$).
   - Đảm bảo cơ cấu $P : L : G$, tỷ lệ đạm động vật/tổng đạm $\ge 50\%$, chất béo thực vật $\ge 30\%$, canxi và sắt.
   - Thuật toán tối ưu hóa tự động theo đơn giá thực tế và ngân sách bán trú (bình quân $21.000\text{ đ/cháu/ngày}$).

2. **Giao Diện Split View Đột Phá (Linear / Stripe SaaS Style)**:
   - **Cột trái (28%)**: Lịch tuần 5 ngày, bộ lọc phân hệ (Nhà trẻ 24-36 tháng / Mẫu giáo 3-5 tuổi), sĩ số, đơn giá và 4 thẻ KPI cập nhật thời gian thực.
   - **Cột phải (72%)**: Lưới kế toán 13 cột với độ phân giải cao, cuộn độc lập, không bị che khuất.

3. **Phân Hệ Nghiệp Vụ Chuyên Biệt**:
   - **Sổ Điểm Danh 9 Lớp**: Quản lý sĩ số thực tế, trẻ nghỉ ăn sáng/ăn trưa, tự động tính tỷ lệ ăn và đồng bộ sang thực đơn.
   - **Tiếp Phẩm & Smart PO (5 Nhà Cung Ứng)**: Tự động phân loại 21 mặt hàng thành 5 đơn hàng nhà xe (Thịt cá, Rau củ VietGAP, Hàng khô gia vị, Sữa bữa phụ, Gạo bún), khớp $100\%$ ngân sách ($11.165.830\text{ đ}$), hỗ trợ in phiếu A4 và sao chép nội dung gửi Zalo 1-click.
   - **Kiểm Thực 3 Bước & Mở Khóa Chia Ăn**: Kiểm soát 3 giai đoạn theo QĐ 1246/BYT (06:00 Tiếp phẩm $\to$ 09:30 Nấu chín $\ge 75^\circ\text{C} \to$ 10:15 Lưu mẫu 24h & Khóa chia ăn).

4. **Xuất Báo Cáo Kế Toán Chuẩn Thanh Tra**:
   - Xuất tệp Excel OpenXML đa sheet: Sổ Tính Khẩu Phần Mẫu 01-MN, Phiếu Tiếp Phẩm Giao Nhận và Sổ Kiểm Thực 3 Bước.

5. **Kiến Trúc Cloud & Phân Quyền Đa Vai Trò (RBAC)**:
   - Kết nối Supabase Cloud PostgreSQL 16.
   - 5 vai trò phân quyền: Ban Giám Hiệu, Phó Hiệu Trưởng Bán Trú, Bếp Trưởng, Kế Toán, Giáo Viên Chủ Nhiệm.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Tính toán dinh dưỡng & Solver**: TypeScript Custom MILP Elastic Engine, Atwater Formula Engine.
- **Báo cáo & Tệp**: ExcelJS, Blob API.
- **Backend & Database**: Supabase Cloud PostgreSQL 16.

---

## 🚀 Cài Đặt & Chạy Dự Án

```bash
# Cài đặt dependencies
pnpm install

# Khởi chạy môi trường phát triển
pnpm run dev

# Biên dịch sản phẩm
pnpm run build
```

---

## 📄 Bản Quyền
Phát triển bởi đội ngũ kỹ thuật PMS Next-Gen. Chuẩn hóa cho trường mầm non tại Việt Nam.
