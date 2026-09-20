-- DELI SALGADOS — V3.7 COMMERCIAL MINIMUMS
-- Minimum 25 units per flavor for simple unit-based products.
-- Minimum 50 units per order is enforced in the application/server authority.

update public.products
set minimum_quantity = 25,
    updated_at = now()
where price_type = 'simple'
  and upper(coalesce(unit_label, '')) = 'UND'
  and minimum_quantity <> 25;

alter table public.products
  drop constraint if exists products_simple_unit_minimum_25_check;

alter table public.products
  add constraint products_simple_unit_minimum_25_check
  check (
    price_type <> 'simple'
    or upper(coalesce(unit_label, '')) <> 'UND'
    or minimum_quantity >= 25
  );
