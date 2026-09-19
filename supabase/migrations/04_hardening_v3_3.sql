-- DELI SALGADOS — MIGRATION 04 HARDENING V3.3
-- 1. Ensure admin_profiles has is_active column
alter table if exists public.admin_profiles
  add column if not exists is_active boolean not null default true;

-- 2. Ensure orders has whatsapp_opened_at column
alter table if exists public.orders
  add column if not exists whatsapp_opened_at timestamptz;

-- 3. Order sequence for concurrent DL-XXXX generation
create sequence if not exists public.order_public_code_seq start with 1;

create or replace function public.next_order_public_code()
returns text
language plpgsql
as $$
declare
  next_val bigint;
begin
  next_val := nextval('public.order_public_code_seq');
  return 'DL-' || lpad(next_val::text, 4, '0');
end;
$$;
