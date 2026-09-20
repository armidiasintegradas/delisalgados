-- DELI SALGADOS — V3.13 PAYMENT WEBHOOK EVENTS
-- Idempotency and audit trail for automatic payment confirmations.

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  action text null,
  payment_reference text null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(provider, event_id)
);

alter table public.payment_webhook_events enable row level security;

revoke all on table public.payment_webhook_events from public, anon, authenticated;
grant all on table public.payment_webhook_events to service_role;

create index if not exists idx_payment_webhook_events_reference
  on public.payment_webhook_events(provider, payment_reference);

create index if not exists idx_orders_payment_reference
  on public.orders(payment_provider, payment_reference)
  where payment_reference is not null;
