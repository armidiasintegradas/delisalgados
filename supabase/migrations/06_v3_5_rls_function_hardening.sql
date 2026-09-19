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
