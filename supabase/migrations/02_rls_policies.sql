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
