-- DELI SALGADOS — DATABASE SCHEMA V1.2
-- Supabase PostgreSQL migration

create extension if not exists "uuid-ossp";

-- 1. Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  note text,
  unit_label text not null default 'UND',
  minimum_quantity int not null default 1,
  price_type text not null default 'simple' check (price_type in ('simple', 'variants')),
  base_price numeric(10,2),
  availability text not null default 'available' check (availability in ('available', 'unavailable', 'on_request')),
  is_visible boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Product Variants
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  unit_label text not null default 'UND',
  minimum_quantity int not null default 1,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, name)
);

-- 4. Historical Snapshots
create table if not exists public.catalog_change_snapshots (
  id uuid primary key default gen_random_uuid(),
  batch_key text not null,
  product_id uuid not null references public.products(id) on delete cascade,
  captured_at timestamptz not null default now(),
  payload jsonb not null,
  unique (batch_key, product_id)
);

-- 5. Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique,
  customer_name text not null,
  customer_phone text not null,
  desired_date text not null,
  fulfillment_type text not null default 'pickup' check (fulfillment_type in ('pickup', 'delivery', 'to_agree')),
  delivery_address text,
  customer_note text,
  total numeric(10,2) not null default 0,
  status text not null default 'generated' check (status in ('generated', 'contacted', 'confirmed', 'preparing', 'completed', 'cancelled')),
  whatsapp_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Order Items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text,
  unit_label_snapshot text not null,
  unit_price_snapshot numeric(10,2) not null,
  quantity int not null,
  subtotal numeric(10,2) not null,
  note text,
  created_at timestamptz not null default now()
);

-- 7. Settings
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Catalog Notices
create table if not exists public.catalog_notices (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Admin Profiles
create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  role text not null default 'editor' check (role in ('administrator', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10. Audit Logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for high performance
create index if not exists idx_products_category_sort on public.products(category_id, sort_order);
create index if not exists idx_products_avail_visible on public.products(availability, is_visible);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_orders_public_code on public.orders(public_code);
