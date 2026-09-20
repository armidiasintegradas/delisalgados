-- DELI SALGADOS — V3.20 MULTIPLE PRODUCT IMAGES

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 1,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_images_product_sort
  on public.product_images(product_id, sort_order, created_at);

create unique index if not exists product_images_one_primary_per_product
  on public.product_images(product_id)
  where is_primary = true;

insert into public.product_images (product_id, image_url, sort_order, is_primary)
select p.id, p.image_url, 1, true
from public.products p
where p.image_url is not null
  and btrim(p.image_url) <> ''
  and not exists (
    select 1 from public.product_images pi where pi.product_id = p.id
  );

alter table public.product_images enable row level security;

drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read
on public.product_images for select
to anon, authenticated
using (true);
