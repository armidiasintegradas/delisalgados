-- DELI SALGADOS — V3.20 STRUCTURED ADDRESS SNAPSHOT ON ORDERS

alter table public.orders
  add column if not exists customer_postal_code text null,
  add column if not exists customer_street text null,
  add column if not exists customer_address_number text null,
  add column if not exists customer_complement text null,
  add column if not exists customer_neighborhood text null,
  add column if not exists customer_city text null,
  add column if not exists customer_state text null;
