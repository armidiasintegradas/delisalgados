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
