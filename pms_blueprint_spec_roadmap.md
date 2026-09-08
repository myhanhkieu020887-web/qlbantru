# HỆ THỐNG QUẢN LÝ MẦM NON & DINH DƯỠNG BÁN TRÚ THẾ HỆ MỚI (NEXT-GEN PMS)
## TÀI LIỆU THIẾT KẾ KIẾN TRÚC (BLUEPRINT), ĐẶC TẢ KỸ THUẬT (SPEC) & LỘ TRÌNH (ROADMAP) — PHIÊN BẢN ENTERPRISE QUỐC TẾ v2.0
### *Kiến trúc: Microsoft 365 Data-Dense Ribbon Grid • Zero-Cost Supabase Free Tier • HiGHS MILP WebAssembly*
### *Căn cứ pháp lý: Quyết định 2195/QĐ-BGDĐT (2022), Công văn 423/BGDĐT-GDMN (2023), Thông tư 51/2020/TT-BGDĐT, Quyết định 1246/QĐ-BYT & Tiêu chuẩn Codex Alimentarius*

---

## MỤC LỤC TỔNG QUAN

- [PHẦN 1: TỔNG QUAN VĂN BẢN PHÁP LÝ & MÔ HÌNH TOÁN HỌC](#phần-1-tổng-quan-văn-bản-pháp-lý--mô-hình-toán-học)
- [PHẦN 2: KIẾN TRÚC HỆ THỐNG TỔNG THỂ (SYSTEM BLUEPRINT)](#phần-2-kiến-trúc-hệ-thống-tổng-thể-system-blueprint)
- [PHẦN 3: THIẾT KẾ GIAO DIỆN CHUẨN QUỐC TẾ (DATA-DENSE RIBBON SYSTEM)](#phần-3-thiết-kế-giao-diện-chuẩn-quốc-tế-data-dense-ribbon-system)
- [PHẦN 4: HẠ TẦNG ZERO-COST SUPABASE FREE TIER & CLOUDINARY (SPEC)](#phần-4-hạ-tầng-zero-cost-supabase-free-tier--cloudinary-spec)
- [PHẦN 5: CÁC ENGINE CỐT LÕI (SMART PO, DỊ ỨNG CODEX, ATTP 3 BƯỚC, I18N)](#phần-5-các-engine-cốt-lõi-smart-po-dị-ứng-codex-attp-3-bước-i18n)
- [PHẦN 6: ĐẶC TẢ DDL CƠ SỞ DỮ LIỆU TỐI ƯU COMPACT (POSTGRESQL 16)](#phần-6-đặc-tả-ddl-cơ-sở-dữ-liệu-tối-ưu-compact-postgresql-16)
- [PHẦN 7: LỘ TRÌNH TRIỂN KHAI 16 TUẦN (ENTERPRISE ROADMAP)](#phần-7-lộ-trình-triển-khai-16-tuần-enterprise-roadmap)

---

# PHẦN 1: TỔNG QUAN VĂN BẢN PHÁP LÝ & MÔ HÌNH TOÁN HỌC

### 1.1. Quyết định 2195/QĐ-BGDĐT (Ban hành 10/08/2022)
*Hướng dẫn công tác tổ chức bữa ăn học đường kết hợp tăng cường hoạt động thể lực cho trẻ em trong các cơ sở giáo dục mầm non.*
- **Kiểm soát Natri (Muối)**: Lượng Natri tối đa nạp vào tại trường của 1 trẻ:
  $$\sum_{j=1}^M \left( \frac{\text{Na}_j}{100} \right) x_j \le 1200\text{ mg/ngày/trẻ} \quad (\approx 3\text{ g muối})$$
- **Kiểm soát Đường tự do (Free Sugars)**: Năng lượng từ đường bổ sung $\le 10\%$ tổng năng lượng khẩu phần:
  $$\sum_{j \in \text{FreeSugar}} \left( \frac{4 G_j}{100} \right) x_j \le 0.10 \times E_{\text{total}}$$
- **Cơ cấu P - L - G**:
  - *Mẫu giáo (3 - 5 tuổi)*: $P \in [13\%, 20\%]$, $L \in [25\%, 35\%]$, $G \in [52\%, 60\%]$. Mục tiêu khuyến nghị: $15 : 25 : 60$.
  - *Nhà trẻ (18 - 36 tháng)*: $P \in [13\%, 20\%]$, $L \in [30\%, 40\%]$, $G \in [50\%, 60\%]$. Mục tiêu khuyến nghị: $14 : 36 : 50$.
- **Nguồn gốc Protein & Lipid**: Đạm động vật $\ge 50\%$ tổng đạm; Mỡ thực vật $\ge 45\%$ tổng chất béo.
- **Hoạt động thể lực 60 phút/ngày**: Tích hợp nhật ký thể lực và biểu đồ phát triển thể chất WHO Z-score (HAZ, WAZ, BAZ) liên thông với Sổ Y tế học đường.
- **Chu kỳ thực đơn**: Bắt buộc tối thiểu **4 tuần (20 ngày làm việc)** không lặp lại món chính.

### 1.2. Công văn 423/BGDĐT-GDMN (Ban hành 07/02/2023)
*Tăng cường công tác nuôi dưỡng và đảm bảo an toàn cho trẻ em tại các cơ sở giáo dục mầm non.*
- **Cấm Suất ăn chế biến sẵn ngoài (Catering)**: 100% cơ sở GDMN bắt buộc vận hành bếp ăn nội bộ theo quy tắc một chiều.
- **Quy trình Kiểm thực 3 bước & Lưu mẫu 24 giờ**: Thực hiện theo QĐ 1246/QĐ-BYT. Khóa chia ăn số tự động chỉ mở khi mẫu lưu 24h đã được niêm phong và nhiệt độ tâm thực phẩm nấu chín đạt $\ge 75^\circ$C.

### 1.3. Mô hình Toán học Quy hoạch Nguyên Tuyến tính MILP (HiGHS Solver)
$$\min_{\mathbf{x}, \mathbf{s}} \left[ \sum_{j=1}^M c_j x_j + W_{\text{ratio}} \sum_{k \in \{P,L,G\}} (s_k^+ + s_k^-) + W_{\text{Na}} s_{\text{Na}}^+ + W_{\text{sugar}} s_{\text{sugar}}^+ \right]$$
- $x_j$: Định lượng gam thực phẩm $j$ cho 1 trẻ ($x_j \in \mathbb{R}_{\ge 0}$ hoặc $x_j \in \mathbb{Z}$ với nguyên liệu đếm hạt/quả).
- $W_{\text{ratio}} = 1000$: Trọng số phạt lệch cơ cấu P-L-G.
- $W_{\text{Na}} = 1500$, $W_{\text{sugar}} = 1500$: Trọng số phạt vi phạm Natri và Đường theo QĐ 2195 (Elastic Goal Constraints đảm bảo bài toán luôn khả thi `feasible`).

---

# PHẦN 2: KIẾN TRÚC HỆ THỐNG TỔNG THỂ (SYSTEM BLUEPRINT)

```mermaid
graph TB
    subgraph UI_UX_Presentation [Lớp Trình Diễn Chuẩn Quốc Tế (Presentation Layer)]
        RibbonBar["Microsoft 365 Ribbon Toolbar<br>(5 Tabs: Home, Solver, Logistics, Reports, View)"]
        Grid13["Compact Data Grid (13 Cột)<br>(Fast Keyboard Navigation, Tabular Nums)"]
        Shortcuts["Keyboard Engine<br>(F9 Solver, Ctrl+E Excel, Ctrl+P Print, Ctrl+B Ribbon)"]
        i18nEngine["Instant Bilingual Switcher<br>(VI ↔ EN Realtime Sync)"]
        AllergenAlert["Codex 14 Allergen Matrix<br>(Auto Conflict Warning Badge)"]
    end

    subgraph Client_Compute [Tính Toán Phía Trình Duyệt (Zero-Cost Compute)]
        HiGHS_WASM["HiGHS MILP Solver WebAssembly<br>(Cân đối <30ms hoàn toàn Offline/Client-side)"]
        Formulas["Nutrition Formulas Engine<br>(Bảo toàn năng lượng Atwater 100%)"]
    end

    subgraph Zero_Cost_Cloud [Hạ Tầng Đám Mây Miễn Phí (Zero-Cost Cloud Infrastructure)]
        SupaAuth["Supabase Auth (100% Google OAuth 1-Tap)<br>(0 email gửi, không chạm trần 30 mail/h)"]
        SupaDB[(Supabase PostgreSQL 16 Cluster<br>500MB Compact Schema + Row Level Security)]
        SupaRT["Selective Realtime Channel<br>(Bếp trưởng & GV Điểm danh: ~25 conns < 200 limit)"]
        CloudinaryFree["Cloudinary Media CDN (25 GB/tháng)<br>(Tối ưu hóa tự động WebP cho ảnh Kiểm thực & Mẫu lưu)"]
        GH_Cron["GitHub Actions Keep-Alive<br>(Tự động ping 06:00 AM hàng ngày chống pause 7 ngày)"]
    end

    RibbonBar --> HiGHS_WASM
    Grid13 --> Formulas
    UI_UX_Presentation --> SupaAuth
    UI_UX_Presentation --> SupaDB
    UI_UX_Presentation --> CloudinaryFree
    CloudinaryFree -->|URL Ảnh Siêu Nhẹ| SupaDB
    GH_Cron -->|Ping REST API| SupaDB
```

---

# PHẦN 3: THIẾT KẾ GIAO DIỆN CHUẨN QUỐC TẾ (DATA-DENSE RIBBON SYSTEM)

### 3.1. Triết lý Thiết kế: Microsoft 365 Grid + Linear Design System
- **Mật độ thông tin cao (Data-Dense Dashboard)**: Tối ưu diện tích làm việc cho kế toán dinh dưỡng, giảm khoảng trắng thừa (padding/margin compact).
- **Hệ thống Font & Số liệu Kế toán**:
  - Font Sans-serif: `Inter` / `Fira Sans` sắc nét, dễ đọc.
  - Định dạng số: `font-mono tabular-nums text-right` đảm bảo thẳng hàng tuyệt đối các cột đơn giá, trọng lượng tươi, thành tiền.
- **Thanh Ribbon 5 Tab Thông Minh**:
  1. **Trang chủ (Home)**: Nhập sĩ số, mức tiền ăn, chọn độ tuổi, thêm món, thêm thực phẩm, nút Cân đối nhanh `F9`.
  2. **Cân đối & Solver (Solver & Balance)**: Tùy biến tỷ lệ P-L-G ($15:25:60$, $14:36:50$, $13:30:57$), kiểm soát 3 chốt chặn QĐ 2195, giải thuật MILP.
  3. **Kho & Đơn hàng (Logistics & Health)**: Mở Smart PO, Sổ kiểm thực 3 bước ATTP, Quản lý kho FIFO, Sổ Sức khỏe & Dị ứng học đường.
  4. **Báo cáo & Xuất bản (Reports & Compliance)**: Xuất Sổ dinh dưỡng `.xlsx` chuẩn QLMN 1788793513, In A4 1-Click hồ sơ thanh tra ngày, Quyết toán tài chính 02-MN.
  5. **Chế độ xem (View)**: Thu gọn / mở rộng Ribbon `Ctrl+B`, chuyển đổi phân hệ mẫu giáo / nhà trẻ / ăn sáng, xem điểm danh chuyên cần.

---

# PHẦN 4: HẠ TẦNG ZERO-COST SUPABASE FREE TIER & CLOUDINARY (SPEC)

| Hạng mục Hạ tầng | Giới hạn Supabase Free | Giải pháp Tối ưu hóa Zero-Cost Tuyệt đối |
| :--- | :--- | :--- |
| **Lưu trữ Ảnh** | 1 GB Storage tổng cộng | **Offload 100% sang Cloudinary Free Tier (25 GB/tháng)**. Ảnh chụp mẫu lưu 24h và hóa đơn tiếp phẩm được nén tự động sang định dạng WebP; Supabase PostgreSQL chỉ lưu trữ chuỗi URL CDN ($< 100$ bytes). |
| **Xác thực Auth** | 30 emails/giờ rate limit | **100% Google OAuth (Google Sign-In 1-chạm)**. Không dùng email kích hoạt/OTP qua SMTP; phụ huynh và giáo viên đăng nhập an toàn tức thì. |
| **Realtime** | 200 kết nối đồng thời | **Selective Realtime**: Chỉ kích hoạt kênh WebSocket cho màn hình Bếp trưởng và Giáo viên điểm danh ($\approx 20 - 30$ clients/trường); Phụ huynh dùng React Query Cache. |
| **Dung lượng DB** | 500 MB PostgreSQL | **Compact Data Types**: Sử dụng `SMALLINT`, `DATE`, `NUMERIC(8,2)`. 500 MB lưu trữ an toàn dữ liệu học sinh và thực đơn trong **5 - 10 năm**. |
| **Chống Tạm Dừng** | Tự động pause sau 7 ngày | **GitHub Actions Keep-Alive Cronjob**: Tự động gửi request GET siêu nhẹ vào REST API lúc 06:00 AM giờ Việt Nam hàng ngày, duy trì hệ thống online 365 ngày/năm. |
| **Chi phí Tính toán** | Giới hạn Egress & Compute | **Client-side WebAssembly**: Thuật toán HiGHS MILP chạy $100\%$ trên trình duyệt của kế toán ($0\text{ ms}$ server time, $0\text{ byte}$ egress). |

---

# PHẦN 5: CÁC ENGINE CỐT LÕI

### 5.1. Smart Purchase Order (Smart PO)
Tự động tổng hợp và phân nhóm nguyên liệu thực đơn theo **5 nhóm nhà cung cấp chuyên trách**:
1. *Thịt, cá, gia cầm tươi sống* (Giao 06:00 sáng).
2. *Rau, củ, quả tươi* (Giao 06:15 sáng).
3. *Gia vị, dầu ăn & Hàng khô* (Giao 06:30 sáng).
4. *Sữa tươi, bánh & Bữa phụ xế* (Giao 08:30 sáng).
5. *Gạo & Nông sản ngũ cốc* (Giao đầu tuần).
- Tích hợp tính năng **Sao chép nhanh văn bản đặt hàng** gửi trực tiếp qua Zalo/WhatsApp cho nhà cung ứng.

### 5.2. Codex 14 Allergen Cross-Matrix Engine
- Quản lý 14 nhóm dị ứng chuẩn Codex Alimentarius và Bộ Y tế: Đậu phộng, Hải sản giáp xác, Cá, Thân mềm, Sữa bò/Lactose, Trứng, Đậu nành, Gluten/Lúa mì, Mè/Vừng, Hạt dinh dưỡng cây...
- Sử dụng **Regex Word-Boundary Matching** (`(^|[\s,.;:()/-])keyword([\s,.;:()/-]|$)`) loại bỏ $100\%$ lỗi nhận diện sai trong tiếng Việt (ví dụ: *Đường cát* không bị nhận diện nhầm thành *Cá*).

### 5.3. State Machine Kiểm Thực 3 Bước (CV 423 & QĐ 1246)
- **Bước 1 (Nhập thực phẩm - 06:00)**: Chụp ảnh cảm quan, kiểm tra hạn dùng, hóa đơn VietGAP $\to$ Tải Cloudinary.
- **Bước 2 (Chế biến - 09:30)**: Đo nhiệt độ tâm thức ăn chín ($\ge 75^\circ$C), kiểm tra cảm quan trước khi múc ra khay.
- **Bước 3 (Lưu mẫu & Khóa chia ăn - 10:15)**: Niêm phong hũ mẫu $\ge 100$g (150ml chất lỏng), quét mã QR tem lưu 24h $\to$ Cờ Realtime tự động mở khóa chia ăn cho các lớp.

### 5.4. Hệ Thống Song Ngữ i18n
- Module song ngữ tức thời Tiếng Việt - Tiếng Anh phục vụ các trường mầm non quốc tế và song ngữ (BIS, UNIS, Vinschool, Maple Bear...).
- Bộ từ điển chuyên ngành dinh dưỡng học đường chuẩn xác 100%.

---

# PHẦN 6: ĐẶC TẢ DDL CƠ SỞ DỮ LIỆU TỐI ƯU COMPACT (POSTGRESQL 16)

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BẢNG TRƯỜNG HỌC (TENANTS)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    division_code VARCHAR(30),
    province_code VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HỒ SƠ PHÂN QUYỀN GOOGLE OAUTH
CREATE TABLE public.tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    email VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('bgh', 'giao_vien', 'bep_truong', 'y_te', 'ke_toan', 'phu_huynh')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tenant_id, role)
);

-- 3. BẢNG THỰC PHẨM CHUẨN VIỆN DINH DƯỠNG
CREATE TABLE public.food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(30) NOT NULL,
    unit VARCHAR(15) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    step_size NUMERIC(6, 3) DEFAULT 1.0,
    gam_exchange NUMERIC(6, 1) DEFAULT 1000.0,
    extrude_factor NUMERIC(4, 1) DEFAULT 0.0,
    is_animal_protein BOOLEAN DEFAULT FALSE,
    is_animal_fat BOOLEAN DEFAULT FALSE,
    is_free_sugar BOOLEAN DEFAULT FALSE,
    sodium_mg NUMERIC(6, 1) DEFAULT 0.0,
    protein_100g NUMERIC(5, 2) NOT NULL,
    fat_100g NUMERIC(5, 2) NOT NULL,
    carbs_100g NUMERIC(5, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. BẢNG THỰC ĐƠN NGÀY & KIỂM TOÁN QĐ 2195
CREATE TABLE public.daily_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    menu_date DATE NOT NULL,
    age_group VARCHAR(15) NOT NULL CHECK (age_group IN ('maugiao', 'nhatre')),
    actual_students SMALLINT NOT NULL DEFAULT 1,
    meal_price_per_student NUMERIC(8, 2) NOT NULL,
    service_fee_per_student NUMERIC(8, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'OPTIMIZED', 'APPROVED', 'LOCKED')),
    total_calo NUMERIC(6, 1),
    protein_pct NUMERIC(4, 1),
    lipid_pct NUMERIC(4, 1),
    carbs_pct NUMERIC(4, 1),
    sodium_total_mg NUMERIC(6, 1), -- <= 1200 mg
    free_sugar_pct NUMERIC(4, 1),  -- <= 10%
    compliance_passed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, menu_date, age_group)
);

-- 5. BẢNG KIỂM THỰC 3 BƯỚC & CLOUDINARY MEDIA
CREATE TABLE public.food_safety_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    audit_date DATE NOT NULL,
    menu_id UUID NOT NULL REFERENCES public.daily_menus(id),
    step1_verified BOOLEAN DEFAULT FALSE,
    step1_photo_url VARCHAR(500), -- Link Cloudinary
    step2_verified BOOLEAN DEFAULT FALSE,
    step2_core_temp NUMERIC(4, 1), -- >= 75°C
    step3_verified BOOLEAN DEFAULT FALSE,
    sample_box_seal_code VARCHAR(50) NOT NULL, -- Mã QR tem niêm phong
    sample_photos_urls VARCHAR(500)[], -- Mảng URL Cloudinary
    is_distribution_unlocked BOOLEAN DEFAULT FALSE, -- Mở khóa chia ăn Realtime
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, audit_date)
);

-- KÍCH HOẠT ROW LEVEL SECURITY (RLS) ĐA TRƯỜNG
ALTER TABLE public.daily_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_safety_audits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION auth.current_tenant_id() RETURNS UUID AS $$
    SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
$$ LANGUAGE SQL STABLE;

CREATE POLICY tenant_isolation_daily_menus ON public.daily_menus
    FOR ALL USING (tenant_id = auth.current_tenant_id());

CREATE POLICY tenant_isolation_safety_audits ON public.food_safety_audits
    FOR ALL USING (tenant_id = auth.current_tenant_id());
```

---

# PHẦN 7: LỘ TRÌNH TRIỂN KHAI 16 TUẦN (ENTERPRISE ROADMAP)

```mermaid
gantt
    title Lộ trình Triển khai Next-Gen PMS Enterprise v2.0
    dateFormat  YYYY-MM-DD
    section Giai đoạn 1: Core Engine & Math
    DDL Supabase Compact & Google OAuth 1-Tap         :a1, 2026-09-15, 2w
    GitHub Actions Keep-Alive Cronjob                 :a2, 2026-09-22, 1w
    HiGHS MILP WASM (QĐ 2195: Natri, Đường tự do)     :a3, 2026-09-22, 3w
    section Giai đoạn 2: Logistics & ATTP
    Tích hợp Cloudinary Free Tier (Ảnh WebP)          :b1, 2026-10-06, 2w
    State Machine Kiểm thực 3 bước & Khóa chia ăn     :b2, 2026-10-13, 2w
    Smart Purchase Order Generator (5 Nhà cung ứng)   :b3, 2026-10-20, 2w
    section Giai đoạn 3: UI/UX & Quốc tế hóa
    Microsoft 365 Ribbon 5 Tab Toolbar                :c1, 2026-10-27, 3w
    Bilingual i18n VI/EN & Shortcuts Engine           :c2, 2026-11-10, 2w
    Codex 14 Allergen Cross-Matrix                    :c3, 2026-11-17, 2w
    section Giai đoạn 4: Thí điểm & Nghiệm thu
    Kiểm thử tải Free Tier & Bảo toàn Atwater         :d1, 2026-11-24, 2w
    Thí điểm thực tế tại trường mầm non               :d2, 2026-12-08, 3w
    Bàn giao tài liệu & Vận hành chính thức           :d3, 2026-12-29, 1w
```

### Tiêu chí Nghiệm thu Tổng thể:
1. **Toán học & Dinh dưỡng**: Sai số công thức Atwater $\le 0.05$ kcal; Đáp ứng đầy đủ ràng buộc QĐ 2195 (Natri $\le 1200$mg, Đường $\le 10\%$, Đạm ĐV $\ge 50\%$).
2. **Chi phí Hạ tầng**: $0$ VNĐ phí bản quyền server/database; $0\text{ MB}$ tiêu thụ trên Supabase Storage (offload toàn bộ sang Cloudinary); hệ thống hoạt động 365 ngày không bị pause nhờ GitHub Actions.
3. **Hiệu năng & Tốc độ**: Bộ giải MILP WASM cân đối thực đơn $< 30$ms; hỗ trợ phím tắt chuẩn Desktop (`F9`, `Ctrl+E`, `Ctrl+P`, `Ctrl+B`).
4. **Chuẩn Quốc Tế**: Giao diện Ribbon 5 tab chuẩn Microsoft 365, hỗ trợ song ngữ Tiếng Việt & Tiếng Anh, cảnh báo dị ứng 14 nhóm Codex Alimentarius.
