-- DELI SALGADOS — V3.14 MANUAL PIX CONFIRMATION
-- Customer can report a Pix payment; Deli still confirms it manually.

alter table public.orders
  add column if not exists payment_reported_at timestamptz null,
  add column if not exists payment_reported_amount numeric(10,2) null;

create index if not exists idx_orders_payment_reported_pending
  on public.orders(payment_reported_at desc)
  where payment_status = 'pending' and payment_reported_at is not null;
