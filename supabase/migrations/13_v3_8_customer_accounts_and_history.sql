-- DELI SALGADOS — V3.8 CUSTOMER ACCOUNTS AND HISTORY

create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  whatsapp text not null,
  address text not null,
  reference_point text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customer_profiles_email_lower_uidx
  on public.customer_profiles (lower(email));

alter table public.customer_profiles enable row level security;

drop policy if exists customer_profiles_select_own on public.customer_profiles;
create policy customer_profiles_select_own
on public.customer_profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists customer_profiles_update_own on public.customer_profiles;
create policy customer_profiles_update_own
on public.customer_profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists customer_profiles_insert_own on public.customer_profiles;
create policy customer_profiles_insert_own
on public.customer_profiles for insert
to authenticated
with check (id = auth.uid());

alter table public.orders
  add column if not exists customer_user_id uuid null references auth.users(id) on delete set null,
  add column if not exists customer_email text null,
  add column if not exists customer_reference_point text null;

create index if not exists idx_orders_customer_user_id on public.orders(customer_user_id);
create index if not exists idx_orders_customer_email_lower on public.orders(lower(customer_email));

drop policy if exists orders_customer_select_own on public.orders;
create policy orders_customer_select_own
on public.orders for select
to authenticated
using (
  customer_user_id = auth.uid()
  or (
    customer_email is not null
    and lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email',''))
  )
);
