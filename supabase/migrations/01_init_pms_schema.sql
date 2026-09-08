-- ==============================================================================
-- NEXT-GEN PMS ENTERPRISE v2.0 - POSTGRESQL 16 SCHEMA DDL CHO SUPABASE
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

-- 2. HỒ SƠ PHÂN QUYỀN GOOGLE OAUTH
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    email VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('bgh', 'giao_vien', 'bep_truong', 'y_te', 'ke_toan', 'phu_huynh')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tenant_id, role)
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

-- BẬT ROW LEVEL SECURITY (RLS) ĐA TRƯỜNG
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_safety_audits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION auth.current_tenant_id() RETURNS UUID AS $$
    SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
$$ LANGUAGE SQL STABLE;

CREATE POLICY tenant_isolation_menus ON public.daily_menus
    FOR ALL USING (tenant_id = auth.current_tenant_id() OR auth.current_tenant_id() IS NULL);

CREATE POLICY tenant_isolation_classrooms ON public.classrooms
    FOR ALL USING (tenant_id = auth.current_tenant_id() OR auth.current_tenant_id() IS NULL);

CREATE POLICY tenant_isolation_attendance ON public.daily_attendance
    FOR ALL USING (tenant_id = auth.current_tenant_id() OR auth.current_tenant_id() IS NULL);

CREATE POLICY tenant_isolation_safety_audits ON public.food_safety_audits
    FOR ALL USING (tenant_id = auth.current_tenant_id() OR auth.current_tenant_id() IS NULL);
