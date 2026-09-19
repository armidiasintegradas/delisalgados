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
-- DELI SALGADOS — ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all operational tables
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.catalog_change_snapshots enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;
alter table public.catalog_notices enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.audit_logs enable row level security;

-- Helper function to check if current authenticated user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid()
  );
$$;

-- 1. Categories
create policy "Public can read active categories"
  on public.categories for select
  using (is_active = true);

create policy "Admins have full access to categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- 2. Products
create policy "Public can read visible products"
  on public.products for select
  using (is_visible = true);

create policy "Admins have full access to products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Product Variants
create policy "Public can read active product variants"
  on public.product_variants for select
  using (is_active = true);

create policy "Admins have full access to product variants"
  on public.product_variants for all
  using (public.is_admin())
  with check (public.is_admin());

-- 4. Settings
create policy "Public can read settings"
  on public.settings for select
  using (true);

create policy "Admins can manage settings"
  on public.settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- 5. Catalog Notices
create policy "Public can read active notices"
  on public.catalog_notices for select
  using (is_active = true);

create policy "Admins can manage notices"
  on public.catalog_notices for all
  using (public.is_admin())
  with check (public.is_admin());

-- 6. Orders (Protected: inserts and queries managed by Server Actions/API via Service Role)
create policy "Admins can manage orders"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

-- 7. Order Items
create policy "Admins can manage order items"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- 8. Admin Profiles
create policy "Admins can read own profile or admin profiles"
  on public.admin_profiles for select
  using (auth.uid() = id or public.is_admin());

-- 9. Audit Logs
create policy "Admins can read audit logs"
  on public.audit_logs for select
  using (public.is_admin());

create policy "Admins can insert audit logs"
  on public.audit_logs for insert
  with check (public.is_admin());
-- DELI SALGADOS — CANONICAL SEED V1.2
-- Effective date: 2026-09-18

begin;

-- Initial default settings (do not overwrite if already set in production)
insert into public.settings (key, value, updated_at)
values 
  ('general', '{"business_name": "Deli Salgados", "whatsapp_number": "", "instagram_url": "https://www.instagram.com/deli.salgados", "address": "", "pickup_information": "", "delivery_information": ""}'::jsonb, now()),
  ('catalog', '{"show_search": true, "show_prices": true, "show_unavailable": false, "special_order_cta_enabled": true, "special_order_cta_text": "Precisa de um pedido especial para sua festa?"}'::jsonb, now()),
  ('messages', '{"whatsapp_opening_message": "Olá, Deli Salgados! Gostaria de enviar uma solicitação de pedido pelo cardápio digital:", "whatsapp_closing_message": "Aguardo confirmação da disponibilidade e do valor final. Obrigado!"}'::jsonb, now())
on conflict (key) do nothing;

-- 11 Canonical Categories
insert into public.categories (name, slug, sort_order, is_active)
values
  ('Empadas', 'empadas', 1, true),
  ('Trouxinhas', 'trouxinhas', 2, true),
  ('Tortas Salgadas', 'tortas-salgadas', 3, true),
  ('Massa Folhada', 'massa-folhada', 4, true),
  ('Canapés', 'canapes', 5, true),
  ('Quiches', 'quiches', 6, true),
  ('Vol-au-vent', 'vol-au-vent', 7, true),
  ('Salgados', 'salgados', 8, true),
  ('Diversos', 'diversos', 9, true),
  ('Bolinhos', 'bolinhos', 10, true),
  ('Mini Sanduíches', 'mini-sanduiches', 11, true)
on conflict (slug) do update
set name = excluded.name, sort_order = excluded.sort_order, is_active = true;

-- Helper index for idempotent variant upserts
create unique index if not exists product_variants_product_name_uq
on public.product_variants(product_id, name);

-- Upsert simple-price products (40 products)
insert into public.products
(category_id, name, slug, description, note, unit_label, minimum_quantity, price_type, base_price, availability, is_visible, sort_order)
values
  ((select id from public.categories where slug='empadas'), 'Empadinha de Frango', 'empada-frango', null, null, 'UND', 100, 'simple', 3.90, 'available', true, 1),
  ((select id from public.categories where slug='empadas'), 'Empadinha de Camarão', 'empada-camarao', null, null, 'UND', 100, 'simple', 4.90, 'available', true, 2),
  ((select id from public.categories where slug='empadas'), 'Empadinha de Bacalhau', 'empada-bacalhau', null, null, 'UND', 100, 'simple', 4.90, 'available', true, 3),
  
  ((select id from public.categories where slug='trouxinhas'), 'Trouxinha de Frango com Queijo', 'trouxinha-frango-queijo', null, null, 'UND', 100, 'simple', 6.00, 'available', true, 1),
  ((select id from public.categories where slug='trouxinhas'), 'Trouxinha de Bacalhau', 'trouxinha-bacalhau', null, null, 'UND', 100, 'simple', 6.90, 'available', true, 2),
  ((select id from public.categories where slug='trouxinhas'), 'Trouxinha Folhada de Frango com Cream Cheese', 'trouxinha-frango-cream-cheese', null, null, 'UND', 100, 'simple', 6.00, 'available', true, 3),
  ((select id from public.categories where slug='trouxinhas'), 'Trouxinha de Massa Folhada com Damasco e Gorgonzola', 'trouxinha-gorgonzola-damasco-cream-cheese-amendoa', null, null, 'UND', 100, 'simple', 8.00, 'available', true, 4),
  
  ((select id from public.categories where slug='massa-folhada'), 'Pastel de Frango em Massa Folhada com Cream Cheese', 'pastel-frango-cream-cheese', null, null, 'UND', 100, 'simple', 6.00, 'available', true, 1),
  ((select id from public.categories where slug='massa-folhada'), 'Pastel de Camarão com Cream Cheese', 'pastel-camarao-cream-cheese', null, null, 'UND', 100, 'simple', 7.00, 'available', true, 2),
  ((select id from public.categories where slug='massa-folhada'), 'Folhado de Ameixa com Bacon', 'folhado-ameixa-bacon', null, null, 'UND', 100, 'simple', 5.90, 'available', true, 3),
  ((select id from public.categories where slug='massa-folhada'), 'Mini Croissant de Queijo com Presunto', 'mini-croissant-queijo-presunto', null, null, 'UND', 100, 'simple', 3.50, 'available', true, 4),
  ((select id from public.categories where slug='massa-folhada'), 'Flor de Massa Folhada de Salaminho', 'flor-massa-folhada-salaminho', null, null, 'UND', 100, 'simple', 7.50, 'available', true, 5),
  
  ((select id from public.categories where slug='canapes'), 'Canapé de Salaminho', 'canape-salaminho', null, null, 'UND', 100, 'simple', 6.00, 'available', true, 1),
  ((select id from public.categories where slug='canapes'), 'Canapé de Frango', 'canape-frango', null, null, 'UND', 100, 'simple', 4.60, 'available', true, 2),
  ((select id from public.categories where slug='canapes'), 'Barquete de Presunto Parma com Cream Cheese', 'barquete-presunto-parma-cream-cheese', null, null, 'UND', 100, 'simple', 8.90, 'available', true, 3),
  ((select id from public.categories where slug='canapes'), 'Barquete de Gorgonzola com Damasco e Amêndoas Laminadas', 'barquete-gorgonzola-damasco-amendoas', null, null, 'UND', 100, 'simple', 8.90, 'available', true, 4),
  
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Alho-Poró', 'quiche-alho-poro', null, null, 'UND', 100, 'simple', 3.95, 'available', true, 1),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Frango', 'quiche-frango', null, null, 'UND', 100, 'simple', 4.00, 'available', true, 2),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche Romeu e Julieta', 'quiche-romeu-julieta', null, null, 'UND', 100, 'simple', 4.00, 'available', true, 3),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche Nordestino', 'quiche-nordestino', 'Charque e banana da terra', null, 'UND', 100, 'simple', 4.50, 'available', true, 4),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Tomate Seco com Queijo', 'quiche-tomate-seco-queijo-manjericao', null, null, 'UND', 100, 'simple', 5.00, 'available', true, 5),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Queijo do Reino', 'quiche-queijo-reino', null, null, 'UND', 100, 'simple', 5.50, 'available', true, 6),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Gorgonzola com Damasco', 'quiche-gorgonzola-damasco', null, null, 'UND', 100, 'simple', 5.50, 'available', true, 7),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Bacalhau', 'quiche-bacalhau', null, null, 'UND', 100, 'simple', 5.00, 'available', true, 8),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Queijo', 'quiche-queijo', null, null, 'UND', 100, 'simple', 4.00, 'available', true, 9),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Camarão Inteiro com Queijo', 'quiche-camarao-inteiro-queijo', null, null, 'UND', 100, 'simple', 5.00, 'available', true, 10),
  
  ((select id from public.categories where slug='vol-au-vent'), 'Vol-au-vent de Camarão', 'vol-au-vent-camarao-cream-cheese', null, null, 'UND', 100, 'simple', 8.00, 'available', true, 1),
  ((select id from public.categories where slug='vol-au-vent'), 'Vol-au-vent de Gorgonzola com Damasco e Amêndoas Laminadas', 'vol-au-vent-gorgonzola-cream-cheese-damasco', null, null, 'UND', 100, 'simple', 8.90, 'available', true, 2),
  
  ((select id from public.categories where slug='salgados'), 'Coxinha', 'coxinha-frango', null, null, 'UND', 100, 'simple', 1.70, 'available', true, 1),
  ((select id from public.categories where slug='salgados'), 'Risoles de Carne', 'risole-carne', null, null, 'UND', 100, 'simple', 1.80, 'available', true, 2),
  ((select id from public.categories where slug='salgados'), 'Pastelzinho de Festa', 'pastel-festa', null, null, 'UND', 100, 'simple', 2.30, 'available', true, 3),
  ((select id from public.categories where slug='salgados'), 'Canudinho de Frango', 'canudinho-frango', null, null, 'UND', 100, 'simple', 3.70, 'available', true, 4),
  ((select id from public.categories where slug='salgados'), 'Canudinho de Carne', 'canudinho-carne', null, null, 'UND', 100, 'simple', 3.95, 'available', true, 5),
  
  ((select id from public.categories where slug='diversos'), 'Tortinha de Doce de Leite Condensado', 'tortinha-doce-leite', null, null, 'UND', 100, 'simple', 3.50, 'available', true, 1),
  
  ((select id from public.categories where slug='bolinhos'), 'Bolinho de Queijo', 'bolinho-queijo', null, null, 'UND', 100, 'simple', 2.00, 'available', true, 1),
  ((select id from public.categories where slug='bolinhos'), 'Bolinho de Presunto e Queijo', 'bolinho-presunto-queijo', null, null, 'UND', 100, 'simple', 2.30, 'available', true, 2),
  ((select id from public.categories where slug='bolinhos'), 'Bolinho de Calabresa', 'bolinho-calabresa', null, null, 'UND', 100, 'simple', 1.80, 'available', true, 3),
  ((select id from public.categories where slug='bolinhos'), 'Bolinho de Bacalhau', 'bolinho-bacalhau', null, null, 'UND', 100, 'simple', 5.10, 'available', true, 4),
  
  ((select id from public.categories where slug='mini-sanduiches'), 'Mini Burger', 'mini-burguer', null, null, 'UND', 100, 'simple', 5.00, 'available', true, 1),
  ((select id from public.categories where slug='mini-sanduiches'), 'Mini Hot Dog', 'mini-hot-dog', null, null, 'UND', 100, 'simple', 3.95, 'available', true, 2)
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  note = excluded.note,
  unit_label = excluded.unit_label,
  minimum_quantity = excluded.minimum_quantity,
  price_type = 'simple',
  base_price = excluded.base_price,
  availability = 'available',
  is_visible = true,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Upsert variant-based products (3 products: Tortas e Camarão Empanado)
insert into public.products
(category_id, name, slug, description, note, unit_label, minimum_quantity, price_type, base_price, availability, is_visible, sort_order)
values
  ((select id from public.categories where slug='tortas-salgadas'), 'Torta Salgada de Frango', 'torta-frango', null, null, 'UND', 1, 'variants', null, 'available', true, 1),
  ((select id from public.categories where slug='tortas-salgadas'), 'Torta Salgada de Bacalhau', 'torta-bacalhau', null, null, 'UND', 1, 'variants', null, 'available', true, 2),
  ((select id from public.categories where slug='salgados'), 'Camarão Empanado 1 kg', 'camarao-empanado-1kg', null, null, '1 kg', 1, 'variants', null, 'available', true, 6)
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  unit_label = excluded.unit_label,
  minimum_quantity = excluded.minimum_quantity,
  price_type = 'variants',
  base_price = null,
  availability = 'available',
  is_visible = true,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Upsert active variants (4 active variants)
insert into public.product_variants
(product_id, name, price, unit_label, minimum_quantity, sort_order, is_active)
values
  ((select id from public.products where slug='torta-frango'), '1,5 kg', 170.00, 'UND', 1, 1, true),
  ((select id from public.products where slug='torta-bacalhau'), '1,5 kg', 230.00, 'UND', 1, 1, true),
  ((select id from public.products where slug='camarao-empanado-1kg'), 'Congelado', 175.00, '1 kg', 1, 1, true),
  ((select id from public.products where slug='camarao-empanado-1kg'), 'Frito', 195.00, '1 kg', 1, 2, true)
on conflict (product_id, name) do update set
  price = excluded.price,
  unit_label = excluded.unit_label,
  minimum_quantity = excluded.minimum_quantity,
  sort_order = excluded.sort_order,
  is_active = true;

commit;
-- DELI SALGADOS — MIGRATION 04 HARDENING V3.3
-- 1. Ensure admin_profiles has is_active column
alter table if exists public.admin_profiles
  add column if not exists is_active boolean not null default true;

-- 2. Ensure orders has whatsapp_opened_at column
alter table if exists public.orders
  add column if not exists whatsapp_opened_at timestamptz;

-- 3. Order sequence for concurrent DL-XXXX generation
create sequence if not exists public.order_public_code_seq start with 1;

create or replace function public.next_order_public_code()
returns text
language plpgsql
as $$
declare
  next_val bigint;
begin
  next_val := nextval('public.order_public_code_seq');
  return 'DL-' || lpad(next_val::text, 4, '0');
end;
$$;
-- ====================================================================
-- DELI SALGADOS MIGRATION 05: ORDER HANDOFF & TRANSACTIONAL RPC
-- ====================================================================

-- 1. Add handoff security token columns to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS handoff_token_hash TEXT,
ADD COLUMN IF NOT EXISTS handoff_token_expires_at TIMESTAMPTZ;

-- 2. Ensure public_code uniqueness and composite index for secure lookup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_public_code_key'
  ) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_public_code_key UNIQUE (public_code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_handoff_lookup 
ON public.orders (public_code, handoff_token_hash);

-- 3. Atomic Transactional RPC for Order Creation
-- This function receives pre-calculated, server-validated order and item JSONB payloads,
-- atomically consumes the next sequence code, creates the order and all items,
-- and returns the full created order with its items in a single PostgreSQL transaction.
CREATE OR REPLACE FUNCTION public.create_deli_order_v34(
  p_order JSONB,
  p_items JSONB,
  p_token_hash TEXT,
  p_token_expires_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_public_code TEXT;
  v_item JSONB;
  v_result JSONB;
BEGIN
  -- Generate order UUID
  v_order_id := COALESCE((p_order->>'id')::UUID, gen_random_uuid());
  
  -- Monotonically and concurrently consume next public code from sequence
  v_public_code := next_order_public_code();

  -- Insert order record
  INSERT INTO public.orders (
    id,
    public_code,
    customer_name,
    customer_phone,
    desired_date,
    fulfillment_type,
    delivery_address,
    customer_note,
    total,
    status,
    whatsapp_status,
    handoff_token_hash,
    handoff_token_expires_at,
    created_at,
    updated_at
  ) VALUES (
    v_order_id,
    v_public_code,
    p_order->>'customer_name',
    p_order->>'customer_phone',
    (p_order->>'desired_date')::DATE,
    (p_order->>'fulfillment_type')::fulfillment_type,
    p_order->>'delivery_address',
    p_order->>'customer_note',
    (p_order->>'total')::DECIMAL(10, 2),
    'generated',
    'pending',
    p_token_hash,
    p_token_expires_at,
    NOW(),
    NOW()
  );

  -- Insert each order item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      id,
      order_id,
      product_id,
      variant_id,
      product_name_snapshot,
      variant_name_snapshot,
      unit_label_snapshot,
      unit_price_snapshot,
      quantity,
      subtotal,
      note
    ) VALUES (
      COALESCE((v_item->>'id')::UUID, gen_random_uuid()),
      v_order_id,
      (v_item->>'product_id')::UUID,
      CASE WHEN v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' != '' 
           THEN (v_item->>'variant_id')::UUID 
           ELSE NULL 
      END,
      v_item->>'product_name_snapshot',
      v_item->>'variant_name_snapshot',
      v_item->>'unit_label_snapshot',
      (v_item->>'unit_price_snapshot')::DECIMAL(10, 2),
      (v_item->>'quantity')::INTEGER,
      (v_item->>'subtotal')::DECIMAL(10, 2),
      v_item->>'note'
    );
  END LOOP;

  -- Build and return JSON representation of the complete order
  SELECT jsonb_build_object(
    'id', o.id,
    'public_code', o.public_code,
    'customer_name', o.customer_name,
    'customer_phone', o.customer_phone,
    'desired_date', o.desired_date,
    'fulfillment_type', o.fulfillment_type,
    'delivery_address', o.delivery_address,
    'customer_note', o.customer_note,
    'total', o.total,
    'status', o.status,
    'whatsapp_status', o.whatsapp_status,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'items', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', oi.id,
        'order_id', oi.order_id,
        'product_id', oi.product_id,
        'variant_id', oi.variant_id,
        'product_name_snapshot', oi.product_name_snapshot,
        'variant_name_snapshot', oi.variant_name_snapshot,
        'unit_label_snapshot', oi.unit_label_snapshot,
        'unit_price_snapshot', oi.unit_price_snapshot,
        'quantity', oi.quantity,
        'subtotal', oi.subtotal,
        'note', oi.note
      )), '[]'::jsonb)
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    )
  ) INTO v_result
  FROM public.orders o
  WHERE o.id = v_order_id;

  RETURN v_result;
END;
$$;

-- 4. Grant execution permissions to authenticated & service_role
GRANT EXECUTE ON FUNCTION public.create_deli_order_v34(JSONB, JSONB, TEXT, TIMESTAMPTZ) TO service_role;


-- ====================================================================
-- V3.5 POST-BOOTSTRAP HARDENING
-- ====================================================================
-- DELI SALGADOS — V3.5 RLS / FUNCTION HARDENING
-- Restrict privileged policies/functions and add missing supporting indexes.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = (select auth.uid())
      and coalesce(is_active, true) = true
  );
$$;

alter function public.next_order_public_code() set search_path = public, pg_temp;

revoke all on function public.create_deli_order_v34(jsonb, jsonb, text, timestamptz) from public;
revoke execute on function public.create_deli_order_v34(jsonb, jsonb, text, timestamptz) from anon;
revoke execute on function public.create_deli_order_v34(jsonb, jsonb, text, timestamptz) from authenticated;
grant execute on function public.create_deli_order_v34(jsonb, jsonb, text, timestamptz) to service_role;

revoke all on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Public can read active categories" on public.categories;
drop policy if exists "Admins have full access to categories" on public.categories;
create policy "Public can read active categories"
  on public.categories for select to anon
  using (is_active = true);
create policy "Admins have full access to categories"
  on public.categories for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can read visible products" on public.products;
drop policy if exists "Admins have full access to products" on public.products;
create policy "Public can read visible products"
  on public.products for select to anon
  using (is_visible = true);
create policy "Admins have full access to products"
  on public.products for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can read active product variants" on public.product_variants;
drop policy if exists "Admins have full access to product variants" on public.product_variants;
create policy "Public can read active product variants"
  on public.product_variants for select to anon
  using (is_active = true);
create policy "Admins have full access to product variants"
  on public.product_variants for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can read settings" on public.settings;
drop policy if exists "Admins can manage settings" on public.settings;
create policy "Public can read settings"
  on public.settings for select to anon
  using (true);
create policy "Admins can manage settings"
  on public.settings for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public can read active notices" on public.catalog_notices;
drop policy if exists "Admins can manage notices" on public.catalog_notices;
create policy "Public can read active notices"
  on public.catalog_notices for select to anon
  using (is_active = true);
create policy "Admins can manage notices"
  on public.catalog_notices for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders"
  on public.orders for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can manage order items" on public.order_items;
create policy "Admins can manage order items"
  on public.order_items for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can read own profile or admin profiles" on public.admin_profiles;
create policy "Admins can read own profile or admin profiles"
  on public.admin_profiles for select to authenticated
  using (((select auth.uid()) = id) or public.is_admin());

drop policy if exists "Admins can read audit logs" on public.audit_logs;
drop policy if exists "Admins can insert audit logs" on public.audit_logs;
create policy "Admins can read audit logs"
  on public.audit_logs for select to authenticated
  using (public.is_admin());
create policy "Admins can insert audit logs"
  on public.audit_logs for insert to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can manage catalog snapshots" on public.catalog_change_snapshots;
create policy "Admins can manage catalog snapshots"
  on public.catalog_change_snapshots for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_catalog_change_snapshots_product_id
  on public.catalog_change_snapshots(product_id);
create index if not exists idx_order_items_order_id
  on public.order_items(order_id);
create index if not exists idx_order_items_product_id
  on public.order_items(product_id);
create index if not exists idx_order_items_variant_id
  on public.order_items(variant_id);

drop index if exists public.product_variants_product_name_uq;


-- DELI SALGADOS — V3.5 PRIVATE AUTH HELPER
-- Move security-definer admin helper out of the exposed public API schema.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = (select auth.uid())
      and coalesce(is_active, true) = true
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

drop policy if exists "Admins have full access to categories" on public.categories;
create policy "Admins have full access to categories"
  on public.categories for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists "Admins have full access to products" on public.products;
create policy "Admins have full access to products"
  on public.products for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists "Admins have full access to product variants" on public.product_variants;
create policy "Admins have full access to product variants"
  on public.product_variants for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists "Admins can manage settings" on public.settings;
create policy "Admins can manage settings"
  on public.settings for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists "Admins can manage notices" on public.catalog_notices;
create policy "Admins can manage notices"
  on public.catalog_notices for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders"
  on public.orders for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists "Admins can manage order items" on public.order_items;
create policy "Admins can manage order items"
  on public.order_items for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop policy if exists "Admins can read own profile or admin profiles" on public.admin_profiles;
create policy "Admins can read own profile or admin profiles"
  on public.admin_profiles for select to authenticated
  using (((select auth.uid()) = id) or private.is_admin());

drop policy if exists "Admins can read audit logs" on public.audit_logs;
drop policy if exists "Admins can insert audit logs" on public.audit_logs;
create policy "Admins can read audit logs"
  on public.audit_logs for select to authenticated
  using (private.is_admin());
create policy "Admins can insert audit logs"
  on public.audit_logs for insert to authenticated
  with check (private.is_admin());

drop policy if exists "Admins can manage catalog snapshots" on public.catalog_change_snapshots;
create policy "Admins can manage catalog snapshots"
  on public.catalog_change_snapshots for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

drop function if exists public.is_admin();


-- DELI SALGADOS — V3.5 FIX ORDER RPC TYPES
-- orders.fulfillment_type and desired_date are text columns with CHECK constraints,
-- so the transactional RPC must not cast to a nonexistent enum type.

create or replace function public.create_deli_order_v34(
  p_order jsonb,
  p_items jsonb,
  p_token_hash text,
  p_token_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_public_code text;
  v_item jsonb;
  v_result jsonb;
begin
  v_order_id := coalesce((p_order->>'id')::uuid, gen_random_uuid());
  v_public_code := public.next_order_public_code();

  insert into public.orders (
    id,
    public_code,
    customer_name,
    customer_phone,
    desired_date,
    fulfillment_type,
    delivery_address,
    customer_note,
    total,
    status,
    whatsapp_status,
    handoff_token_hash,
    handoff_token_expires_at,
    created_at,
    updated_at
  ) values (
    v_order_id,
    v_public_code,
    p_order->>'customer_name',
    p_order->>'customer_phone',
    p_order->>'desired_date',
    p_order->>'fulfillment_type',
    nullif(p_order->>'delivery_address',''),
    nullif(p_order->>'customer_note',''),
    (p_order->>'total')::numeric(10,2),
    'generated',
    'pending',
    p_token_hash,
    p_token_expires_at,
    now(),
    now()
  );

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (
      id,
      order_id,
      product_id,
      variant_id,
      product_name_snapshot,
      variant_name_snapshot,
      unit_label_snapshot,
      unit_price_snapshot,
      quantity,
      subtotal,
      note
    ) values (
      coalesce((v_item->>'id')::uuid, gen_random_uuid()),
      v_order_id,
      (v_item->>'product_id')::uuid,
      case
        when nullif(v_item->>'variant_id','') is not null
          then (v_item->>'variant_id')::uuid
        else null
      end,
      v_item->>'product_name_snapshot',
      nullif(v_item->>'variant_name_snapshot',''),
      v_item->>'unit_label_snapshot',
      (v_item->>'unit_price_snapshot')::numeric(10,2),
      (v_item->>'quantity')::integer,
      (v_item->>'subtotal')::numeric(10,2),
      nullif(v_item->>'note','')
    );
  end loop;

  select jsonb_build_object(
    'id', o.id,
    'public_code', o.public_code,
    'customer_name', o.customer_name,
    'customer_phone', o.customer_phone,
    'desired_date', o.desired_date,
    'fulfillment_type', o.fulfillment_type,
    'delivery_address', o.delivery_address,
    'customer_note', o.customer_note,
    'total', o.total,
    'status', o.status,
    'whatsapp_status', o.whatsapp_status,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'items', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'order_id', oi.order_id,
            'product_id', oi.product_id,
            'variant_id', oi.variant_id,
            'product_name_snapshot', oi.product_name_snapshot,
            'variant_name_snapshot', oi.variant_name_snapshot,
            'unit_label_snapshot', oi.unit_label_snapshot,
            'unit_price_snapshot', oi.unit_price_snapshot,
            'quantity', oi.quantity,
            'subtotal', oi.subtotal,
            'note', oi.note
          )
          order by oi.created_at, oi.id
        ),
        '[]'::jsonb
      )
      from public.order_items oi
      where oi.order_id = o.id
    )
  )
  into v_result
  from public.orders o
  where o.id = v_order_id;

  return v_result;
end;
$$;

revoke all on function public.create_deli_order_v34(jsonb, jsonb, text, timestamptz) from public;
revoke execute on function public.create_deli_order_v34(jsonb, jsonb, text, timestamptz) from anon;
revoke execute on function public.create_deli_order_v34(jsonb, jsonb, text, timestamptz) from authenticated;
grant execute on function public.create_deli_order_v34(jsonb, jsonb, text, timestamptz) to service_role;


-- DELI SALGADOS — V3.5 RESTRICT PUBLIC CODE SEQUENCE FUNCTION
-- Public codes are generated only inside the privileged transactional order RPC.

revoke all on function public.next_order_public_code() from public;
revoke execute on function public.next_order_public_code() from anon;
revoke execute on function public.next_order_public_code() from authenticated;
grant execute on function public.next_order_public_code() to service_role;
