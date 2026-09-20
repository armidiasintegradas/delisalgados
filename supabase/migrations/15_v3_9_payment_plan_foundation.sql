-- DELI SALGADOS — V3.9 PAYMENT PLAN FOUNDATION

alter table public.orders
  add column if not exists payment_plan text not null default 'deposit_50'
    check (payment_plan in ('deposit_50','full')),
  add column if not exists payment_method text not null default 'pix'
    check (payment_method in ('pix')),
  add column if not exists payment_status text not null default 'pending'
    check (payment_status in ('pending','partially_paid','paid','failed','refunded')),
  add column if not exists deposit_percentage integer not null default 50
    check (deposit_percentage between 0 and 100),
  add column if not exists amount_due_now numeric(10,2) not null default 0,
  add column if not exists amount_paid numeric(10,2) not null default 0,
  add column if not exists balance_due numeric(10,2) not null default 0,
  add column if not exists payment_provider text null,
  add column if not exists payment_reference text null,
  add column if not exists payment_confirmed_at timestamptz null;

update public.orders
set
  payment_plan = coalesce(payment_plan,'deposit_50'),
  payment_method = coalesce(payment_method,'pix'),
  payment_status = coalesce(payment_status,'pending'),
  deposit_percentage = case when payment_plan='full' then 100 else 50 end,
  amount_due_now = case when payment_plan='full' then total else round((total * 0.50)::numeric,2) end,
  amount_paid = coalesce(amount_paid,0),
  balance_due = total - coalesce(amount_paid,0);

create index if not exists idx_orders_payment_status on public.orders(payment_status);
