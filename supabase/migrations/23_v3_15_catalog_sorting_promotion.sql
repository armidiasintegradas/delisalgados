-- DELI SALGADOS — V3.15 CATALOG SORTING / PROMOTIONS
alter table public.products
  add column if not exists is_promotion boolean not null default false;
