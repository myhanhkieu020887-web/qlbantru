-- =============================================================================
-- PMS Next-Gen — Migration 001: Initial Schema + RLS
-- Chạy file này trong Supabase SQL Editor (1 lần duy nhất)
-- =============================================================================

-- -------------------------------------------------------
-- 0. Extensions
-- -------------------------------------------------------
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------
-- 1. TENANTS (Đơn vị chủ quản — ví dụ: Phòng GD&ĐT)
-- -------------------------------------------------------
create table if not exists public.tenants (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  code        text unique not null,  -- ví dụ: 'HAMTHANG'
  address     text,
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- -------------------------------------------------------
-- 2. SCHOOLS (Trường học thuộc tenant)
-- -------------------------------------------------------
create table if not exists public.schools (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  name          text not null,
  code          text not null,
  division_name text,
  address       text,
  phone         text,
  principal     text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (tenant_id, code)
);

-- -------------------------------------------------------
-- 3. SCHOOL_BRANCHES (Điểm trường — đa cơ sở)
-- -------------------------------------------------------
create table if not exists public.school_branches (
  id            uuid primary key default uuid_generate_v4(),
  school_id     uuid not null references public.schools(id) on delete cascade,
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  code          text not null,   -- 'D1', 'D2'
  name          text not null,   -- 'Cơ sở chính', 'Phân hiệu'
  student_count int  not null default 0,
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now(),
  unique (school_id, code)
);

-- -------------------------------------------------------
-- 4. USER_PROFILES (Hồ sơ user gắn với tenant + role)
-- -------------------------------------------------------
create table if not exists public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  school_id   uuid references public.schools(id) on delete set null,
  full_name   text,
  role        text not null default 'ke_toan'
                check (role in ('bgh','ke_toan','bep_truong','giao_vien')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- -------------------------------------------------------
-- 5. FOOD_ITEMS (Danh mục thực phẩm — dùng chung theo tenant)
-- -------------------------------------------------------
create table if not exists public.food_items (
  id                  uuid primary key default uuid_generate_v4(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  code                text not null,
  name                text not null,
  category            text not null
                        check (category in ('gao','thit_ca','rau_cu','gia_vi','dau_mo','sua_banh','khac')),
  unit                text not null default 'Kg',
  price               numeric(12,2) not null default 0,
  step_size           numeric(8,3),
  gam_exchange        numeric(10,3) not null default 1000,
  waste_factor        numeric(5,4) not null default 1.0,
  is_animal_protein   boolean not null default false,
  is_animal_fat       boolean not null default false,
  is_free_sugar       boolean not null default false,
  sodium_mg           numeric(8,2) not null default 0,
  protein_100g        numeric(8,4) not null default 0,
  fat_100g            numeric(8,4) not null default 0,
  carbs_100g          numeric(8,4) not null default 0,
  calcium_mg          numeric(8,2),
  phosphorus_mg       numeric(8,2),
  iron_mg             numeric(8,2),
  vitamin_b1_mg       numeric(8,2),
  vitamin_c_mg        numeric(8,2),
  is_warehouse_item   boolean not null default false,
  allergens           text[] default '{}',
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (tenant_id, code)
);

-- -------------------------------------------------------
-- 6. DAILY_MENUS (Thực đơn hàng ngày)
-- -------------------------------------------------------
create table if not exists public.daily_menus (
  id                  uuid primary key default uuid_generate_v4(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  school_id           uuid not null references public.schools(id) on delete cascade,
  menu_date           date not null,
  segment             text not null
                        check (segment in ('maugiao','nhatre','ansang','cbgvnv')),
  student_count       int  not null default 0,
  budget_per_student  numeric(12,2) not null default 0,
  status              text not null default 'DRAFT'
                        check (status in ('DRAFT','OPTIMIZED','APPROVED','LOCKED')),
  menu_title          jsonb not null default '{}',  -- {trua, xe, phu_xe}
  menu_code           text,
  approved_by         text,
  approved_at         text,
  total_calo          numeric(10,4),
  protein_pct         numeric(7,4),
  lipid_pct           numeric(7,4),
  carbs_pct           numeric(7,4),
  total_cost          numeric(14,2),
  compliance_passed   boolean,
  initial_difference  numeric(14,2) default 0,
  created_by          uuid references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (tenant_id, school_id, menu_date, segment)
);

-- -------------------------------------------------------
-- 7. DAILY_MENU_ITEMS (Dòng thực phẩm trong thực đơn)
-- -------------------------------------------------------
create table if not exists public.daily_menu_items (
  id                    uuid primary key default uuid_generate_v4(),
  menu_id               uuid not null references public.daily_menus(id) on delete cascade,
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  food_id               uuid references public.food_items(id) on delete set null,
  food_code             text not null,
  food_name             text not null,
  meal_session          text not null
                          check (meal_session in ('sang','chinh_trua','phu_trua','xe','phu_xe')),
  gam_per_child         numeric(10,4) not null default 0,
  dish_id               text,
  dish_name             text,
  is_fixed              boolean not null default false,
  buy_quantity          numeric(12,4),  -- kg hoặc ĐVT
  unit_price            numeric(12,2),
  line_total            numeric(14,2),
  sort_order            int  not null default 0,
  branch_quantities     jsonb,          -- {branch_1: 123, branch_2: 45}
  created_at            timestamptz not null default now()
);

-- -------------------------------------------------------
-- 8. DAILY_ATTENDANCE (Điểm danh hàng ngày)
-- -------------------------------------------------------
create table if not exists public.daily_attendance (
  id                uuid primary key default uuid_generate_v4(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  school_id         uuid not null references public.schools(id) on delete cascade,
  attendance_date   date not null,
  classroom_id      text not null,
  class_name        text not null default '',
  total_registered  int  not null default 0,
  present_count     int  not null default 0,
  absent_count      int  not null default 0,
  excused_count     int  not null default 0,
  unexcused_count   int  not null default 0,
  note              text default '',
  recorded_by       uuid references auth.users(id),
  updated_at        timestamptz not null default now(),
  unique (tenant_id, school_id, attendance_date, classroom_id)
);

-- -------------------------------------------------------
-- 9. INVENTORY_ITEMS (Kho bán trú)
-- -------------------------------------------------------
create table if not exists public.inventory_items (
  id                uuid primary key default uuid_generate_v4(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  school_id         uuid not null references public.schools(id) on delete cascade,
  food_id           uuid references public.food_items(id) on delete set null,
  food_code         text not null,
  food_name         text not null,
  unit              text not null default 'Kg',
  gam_exchange      numeric(10,3) not null default 1000,
  current_stock     numeric(14,4) not null default 0,
  min_stock_alert   numeric(14,4) not null default 0,
  average_price     numeric(12,2) not null default 0,
  notes             text,
  updated_at        timestamptz not null default now(),
  unique (tenant_id, school_id, food_code)
);

-- -------------------------------------------------------
-- 10. STOCK_TRANSACTIONS (Nhật ký kho FIFO)
-- -------------------------------------------------------
create table if not exists public.stock_transactions (
  id                uuid primary key default uuid_generate_v4(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  school_id         uuid not null references public.schools(id) on delete cascade,
  transaction_code  text unique not null,
  transaction_date  date not null,
  type              text not null
                      check (type in ('IMPORT','EXPORT_MENU','EXPORT_MANUAL','ADJUSTMENT')),
  food_code         text not null,
  food_name         text not null,
  unit              text not null default 'Kg',
  quantity          numeric(14,4) not null,
  unit_price        numeric(12,2) not null default 0,
  total_amount      numeric(16,2) not null default 0,
  batch_id          text,
  menu_date         date,
  reason            text not null default '',
  performer         text not null default '',
  performed_by      uuid references auth.users(id),
  created_at        timestamptz not null default now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
create index if not exists idx_daily_menus_date       on public.daily_menus(tenant_id, menu_date);
create index if not exists idx_daily_menus_school     on public.daily_menus(school_id, menu_date);
create index if not exists idx_menu_items_menu        on public.daily_menu_items(menu_id);
create index if not exists idx_attendance_date        on public.daily_attendance(tenant_id, attendance_date);
create index if not exists idx_food_items_tenant      on public.food_items(tenant_id, code);
create index if not exists idx_stock_tx_date          on public.stock_transactions(tenant_id, transaction_date);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_daily_menus_updated_at') then
    create trigger trg_daily_menus_updated_at before update on public.daily_menus
      for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_food_items_updated_at') then
    create trigger trg_food_items_updated_at before update on public.food_items
      for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_inventory_items_updated_at') then
    create trigger trg_inventory_items_updated_at before update on public.inventory_items
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
alter table public.tenants         enable row level security;
alter table public.schools         enable row level security;
alter table public.school_branches enable row level security;
alter table public.user_profiles   enable row level security;
alter table public.food_items      enable row level security;
alter table public.daily_menus     enable row level security;
alter table public.daily_menu_items enable row level security;
alter table public.daily_attendance enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_transactions enable row level security;

-- Helper function: lấy tenant_id của user hiện tại
create or replace function public.my_tenant_id()
returns uuid language sql stable security definer as $$
  select tenant_id from public.user_profiles where id = auth.uid()
$$;

-- Helper function: lấy school_id của user hiện tại
create or replace function public.my_school_id()
returns uuid language sql stable security definer as $$
  select school_id from public.user_profiles where id = auth.uid()
$$;

-- Policies: mỗi user chỉ xem/sửa data của tenant mình
create policy "tenant_isolate_tenants"        on public.tenants         for all using (id = public.my_tenant_id());
create policy "tenant_isolate_schools"        on public.schools         for all using (tenant_id = public.my_tenant_id());
create policy "tenant_isolate_branches"       on public.school_branches for all using (tenant_id = public.my_tenant_id());
create policy "tenant_isolate_profiles"       on public.user_profiles   for all using (tenant_id = public.my_tenant_id());
create policy "tenant_isolate_foods"          on public.food_items      for all using (tenant_id = public.my_tenant_id());
create policy "tenant_isolate_menus"          on public.daily_menus     for all using (tenant_id = public.my_tenant_id());
create policy "tenant_isolate_menu_items"     on public.daily_menu_items for all using (tenant_id = public.my_tenant_id());
create policy "tenant_isolate_attendance"     on public.daily_attendance for all using (tenant_id = public.my_tenant_id());
create policy "tenant_isolate_inventory"      on public.inventory_items for all using (tenant_id = public.my_tenant_id());
create policy "tenant_isolate_stock_tx"       on public.stock_transactions for all using (tenant_id = public.my_tenant_id());

-- =============================================================================
-- SEED DATA: 1 Tenant + 1 School mẫu (Trường Mầm Non Hàm Thắng)
-- =============================================================================
insert into public.tenants (id, name, code, address, phone)
values (
  'a1111111-1111-1111-1111-111111111111',
  'Trường Mẫu Giáo Hàm Thắng',
  'HAMTHANG',
  'Phường Hàm Thắng, TP. Phan Thiết, Bình Thuận',
  '0252 xxxxx'
) on conflict (id) do nothing;

insert into public.schools (id, tenant_id, name, code, division_name)
values (
  'b2222222-2222-2222-2222-222222222222',
  'a1111111-1111-1111-1111-111111111111',
  'Trường Mẫu Giáo Hàm Thắng',
  'HAMTHANG_MAIN',
  'UBND PHƯỜNG HÀM THẮNG'
) on conflict (id) do nothing;

insert into public.school_branches (school_id, tenant_id, code, name, student_count, sort_order)
values
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'D1', 'Cơ sở chính (Đ1)', 850, 1),
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'D2', 'Phân hiệu (Đ2)', 360, 2)
on conflict (school_id, code) do nothing;
