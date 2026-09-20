-- DELI SALGADOS — V3.19 STRUCTURED ADDRESS + ORDER READY STATUS

alter table public.customer_profiles
  add column if not exists postal_code text null,
  add column if not exists street text null,
  add column if not exists address_number text null,
  add column if not exists complement text null,
  add column if not exists neighborhood text null,
  add column if not exists city text null,
  add column if not exists state text null;

-- Expand operational order status with an explicit ready stage.
alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in (
    'generated',
    'contacted',
    'confirmed',
    'preparing',
    'ready',
    'completed',
    'cancelled'
  ));

create index if not exists idx_orders_customer_status_updated
  on public.orders(customer_user_id, status, updated_at desc);
