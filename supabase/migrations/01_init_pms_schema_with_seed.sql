-- ==============================================================================
-- NEXT-GEN PMS ENTERPRISE v2.0 - POSTGRESQL 16 SCHEMA DDL & SEED DATA
-- Căn cứ pháp lý: QĐ 2195/QĐ-BGDĐT, TT 51/2020/TT-BGDĐT, QĐ 1246/QĐ-BYT, CV 423
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BẢNG TRƯỜNG HỌC / ĐƠN VỊ THUÊ (TENANTS)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    division_code VARCHAR(30),
    province_code VARCHAR(30),
    meal_rate_maugiao NUMERIC(10, 2) DEFAULT 21000.00,
    meal_rate_nhatre NUMERIC(10, 2) DEFAULT 21000.00,
    meal_rate_ansang NUMERIC(10, 2) DEFAULT 7000.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HỒ SƠ PHÂN QUYỀN VAI TRÒ
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    email VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('bgh', 'giao_vien', 'bep_truong', 'ke_toan', 'phu_huynh')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, tenant_id, role)
);

-- 3. BẢNG LỚP HỌC (CLASSROOMS)
CREATE TABLE IF NOT EXISTS public.classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    age_group VARCHAR(15) NOT NULL CHECK (age_group IN ('maugiao', 'nhatre')),
    total_students SMALLINT NOT NULL DEFAULT 30,
    teacher_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- 4. BẢNG ĐIỂM DANH BÁO ĂN HÀNG NGÀY (DAILY_ATTENDANCE)
CREATE TABLE IF NOT EXISTS public.daily_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    total_students SMALLINT NOT NULL,
    absent_count SMALLINT NOT NULL DEFAULT 0,
    present_count SMALLINT NOT NULL DEFAULT 0,
    excused_count SMALLINT NOT NULL DEFAULT 0,
    unexcused_count SMALLINT NOT NULL DEFAULT 0,
    note TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, attendance_date, classroom_id)
);

-- 5. BẢNG THỰC PHẨM CHUẨN VIỆN DINH DƯỠNG (FOOD_ITEMS)
CREATE TABLE IF NOT EXISTS public.food_items (
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
    allergens VARCHAR(50)[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BẢNG THỰC ĐƠN NGÀY & KIỂM TOÁN QĐ 2195 (DAILY_MENUS)
CREATE TABLE IF NOT EXISTS public.daily_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    menu_date DATE NOT NULL,
    segment VARCHAR(15) NOT NULL CHECK (segment IN ('maugiao', 'nhatre', 'ansang')),
    student_count SMALLINT NOT NULL DEFAULT 1,
    budget_per_student NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'OPTIMIZED', 'APPROVED', 'LOCKED')),
    total_calo NUMERIC(6, 1),
    protein_pct NUMERIC(4, 1),
    lipid_pct NUMERIC(4, 1),
    carbs_pct NUMERIC(4, 1),
    sodium_total_mg NUMERIC(6, 1),
    free_sugar_pct NUMERIC(4, 1),
    total_cost NUMERIC(12, 2) DEFAULT 0,
    compliance_passed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, menu_date, segment)
);

-- 7. BẢNG NGUYÊN LIỆU CHI TIẾT TRONG THỰC ĐƠN (DAILY_MENU_ITEMS)
CREATE TABLE IF NOT EXISTS public.daily_menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id UUID NOT NULL REFERENCES public.daily_menus(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.food_items(id) ON DELETE SET NULL,
    food_code VARCHAR(30) NOT NULL,
    food_name VARCHAR(150) NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    raw_weight_per_student NUMERIC(8, 2) NOT NULL,
    buy_quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    sort_order SMALLINT DEFAULT 0
);

-- 8. BẢNG KIỂM THỰC 3 BƯỚC & MEDIA CLOUDINARY (FOOD_SAFETY_AUDITS)
CREATE TABLE IF NOT EXISTS public.food_safety_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    audit_date DATE NOT NULL,
    menu_id UUID REFERENCES public.daily_menus(id) ON DELETE SET NULL,
    step1_verified BOOLEAN DEFAULT FALSE,
    step1_photo_url VARCHAR(500),
    step2_verified BOOLEAN DEFAULT FALSE,
    step2_core_temp NUMERIC(4, 1),
    step3_verified BOOLEAN DEFAULT FALSE,
    sample_box_seal_code VARCHAR(50),
    sample_photos_urls VARCHAR(500)[],
    is_distribution_unlocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, audit_date)
);

-- CHO PHÉP QUYỀN TRUY CẬP CHO ANON & AUTHENTICATED
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ==============================================================================
-- DỮ LIỆU KHỞI TẠO CHUẨN (SEED DATA)
-- ==============================================================================

-- 1. SEED TRƯỜNG MẦM NON HÀM THẮNG
INSERT INTO public.tenants (id, code, name, division_code, province_code, meal_rate_maugiao, meal_rate_nhatre, meal_rate_ansang)
VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'HAMTHANG-MN',
    'Trường Mầm Non Hàm Thắng',
    'PGD-HAMTHUANBAC',
    'BINHTHUAN',
    21000.00,
    21000.00,
    7000.00
) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- 2. SEED 9 LỚP HỌC HÀM THẮNG
INSERT INTO public.classrooms (tenant_id, code, name, age_group, total_students, teacher_name) VALUES
('a1111111-1111-1111-1111-111111111111', 'LA1', 'Lớp Lá 1 (5-6T)', 'maugiao', 65, 'Cô Nguyễn Thị Hoa'),
('a1111111-1111-1111-1111-111111111111', 'LA2', 'Lớp Lá 2 (5-6T)', 'maugiao', 65, 'Cô Trần Thị Lan'),
('a1111111-1111-1111-1111-111111111111', 'CHOI1', 'Lớp Chồi 1 (4-5T)', 'maugiao', 65, 'Cô Lê Thị Mai'),
('a1111111-1111-1111-1111-111111111111', 'CHOI2', 'Lớp Chồi 2 (4-5T)', 'maugiao', 65, 'Cô Phạm Thị Cúc'),
('a1111111-1111-1111-1111-111111111111', 'MAM1', 'Lớp Mầm 1 (3-4T)', 'maugiao', 60, 'Cô Đặng Thị Hạnh'),
('a1111111-1111-1111-1111-111111111111', 'MAM2', 'Lớp Mầm 2 (3-4T)', 'maugiao', 60, 'Cô Vũ Thị Thu'),
('a1111111-1111-1111-1111-111111111111', 'NT1', 'Nhà Trẻ 1 (25-36T)', 'nhatre', 60, 'Cô Bùi Thị Thảo'),
('a1111111-1111-1111-1111-111111111111', 'NT2', 'Nhà Trẻ 2 (25-36T)', 'nhatre', 60, 'Cô Hoàng Thị Oanh'),
('a1111111-1111-1111-1111-111111111111', 'NT3', 'Nhà Trẻ 3 (18-24T)', 'nhatre', 60, 'Cô Ngô Thị Yến')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- 3. SEED THỰC ĐƠN NGÀY 2026-09-09 (THỨ TƯ - 526 CHÁU)
INSERT INTO public.daily_menus (
    id, tenant_id, menu_date, segment, student_count, budget_per_student, status,
    total_calo, protein_pct, lipid_pct, carbs_pct, sodium_total_mg, free_sugar_pct, total_cost, compliance_passed
) VALUES (
    'b2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    '2026-09-09',
    'maugiao',
    526,
    21000.00,
    'OPTIMIZED',
    689.5,
    13.0,
    33.7,
    53.3,
    950.0,
    4.5,
    11165830.00,
    TRUE
) ON CONFLICT (tenant_id, menu_date, segment) DO UPDATE SET total_cost = EXCLUDED.total_cost;

-- 4. SEED NGUYÊN LIỆU KHẨU PHẦN ĂN (21 MÓN HÀM THẮNG KHỚP 11.165.830 Đ)
INSERT INTO public.daily_menu_items (menu_id, food_code, food_name, meal_type, raw_weight_per_student, buy_quantity, unit_price, line_total, is_locked, sort_order) VALUES
('b2222222-2222-2222-2222-222222222222', 'GAO', 'Gạo tẻ', 'trua_chinh', 100.00, 53.00, 16000.00, 848000.00, false, 1),
('b2222222-2222-2222-2222-222222222222', 'CAMAT', 'Cá mát nục (fillet)', 'trua_chinh', 30.00, 16.00, 75000.00, 1200000.00, false, 2),
('b2222222-2222-2222-2222-222222222222', 'THITHEO', 'Thịt heo nạc dăm', 'trua_chinh', 20.00, 11.00, 110000.00, 1210000.00, false, 3),
('b2222222-2222-2222-2222-222222222222', 'NAMROM', 'Nấm rơm tươi', 'trua_chinh', 15.00, 8.00, 80000.00, 640000.00, false, 4),
('b2222222-2222-2222-2222-222222222222', 'BAU', 'Quả bầu non', 'trua_chinh', 40.00, 23.00, 12000.00, 276000.00, false, 5),
('b2222222-2222-2222-2222-222222222222', 'DAUAN', 'Dầu thực vật Cái Lân', 'trua_chinh', 10.00, 5.26, 42000.00, 220920.00, true, 6),
('b2222222-2222-2222-2222-222222222222', 'NUOCMAM', 'Nước mắm cá cơm 30N', 'trua_chinh', 2.00, 1.05, 38000.00, 39900.00, true, 7),
('b2222222-2222-2222-2222-222222222222', 'DUONG', 'Đường tinh luyện Biên Hòa', 'trua_chinh', 3.00, 1.58, 26000.00, 41080.00, true, 8),
('b2222222-2222-2222-2222-222222222222', 'MUOI', 'Muối tinh sấy i-ốt', 'trua_chinh', 0.50, 0.26, 8000.00, 2080.00, true, 9),
('b2222222-2222-2222-2222-222222222222', 'HANHLA', 'Hành lá tươi', 'trua_chinh', 2.00, 1.20, 35000.00, 42000.00, true, 10),
('b2222222-2222-2222-2222-222222222222', 'NGO', 'Rau ngò rí', 'trua_chinh', 1.00, 0.60, 40000.00, 24000.00, true, 11),
('b2222222-2222-2222-2222-222222222222', 'BUN', 'Bún tươi sợi nhỏ', 'xe', 80.00, 42.00, 15000.00, 630000.00, false, 12),
('b2222222-2222-2222-2222-222222222222', 'THITBO', 'Thịt bò phi lê', 'xe', 25.00, 13.00, 230000.00, 2990000.00, false, 13),
('b2222222-2222-2222-2222-222222222222', 'CAITHIA', 'Cải thìa sạch', 'xe', 35.00, 20.00, 16000.00, 320000.00, false, 14),
('b2222222-2222-2222-2222-222222222222', 'CACHUA', 'Cà chua chín đỏ', 'xe', 15.00, 8.00, 18000.00, 144000.00, false, 15),
('b2222222-2222-2222-2222-222222222222', 'DAUAN_XE', 'Dầu ăn xế', 'xe', 5.00, 2.63, 42000.00, 110460.00, true, 16),
('b2222222-2222-2222-2222-222222222222', 'NUOCMAM_XE', 'Nước mắm xế', 'xe', 1.50, 0.79, 38000.00, 30020.00, true, 17),
('b2222222-2222-2222-2222-222222222222', 'DUONG_XE', 'Đường xế', 'xe', 2.00, 1.05, 26000.00, 27300.00, true, 18),
('b2222222-2222-2222-2222-222222222222', 'TRUNGCUT', 'Trứng cút tươi', 'xe', 30.00, 1773.00, 800.00, 1418400.00, true, 19),
('b2222222-2222-2222-2222-222222222222', 'SUACHUA', 'Sữa chua Vinamilk Susu', 'phu', 100.00, 316.00, 5000.00, 1580000.00, true, 20),
('b2222222-2222-2222-2222-222222222222', 'THANHLONG', 'Thanh long ruột trắng', 'phu', 50.00, 29.00, 15000.00, 435000.00, false, 21);
