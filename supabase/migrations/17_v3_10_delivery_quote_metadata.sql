-- DELI SALGADOS — V3.10 DELIVERY QUOTE METADATA

alter table public.orders
  add column if not exists delivery_provider text null
    check (delivery_provider is null or delivery_provider in ('uber','99','indrive','customer_choice')),
  add column if not exists delivery_quote_amount numeric(10,2) null,
  add column if not exists delivery_quote_currency text null default 'BRL',
  add column if not exists delivery_quote_id text null,
  add column if not exists delivery_quote_expires_at timestamptz null,
  add column if not exists delivery_eta_minutes integer null;

create index if not exists idx_orders_delivery_provider
  on public.orders(delivery_provider)
  where delivery_provider is not null;
