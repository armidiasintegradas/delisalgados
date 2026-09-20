-- DELI SALGADOS — V3.17 UNIQUE CUSTOMER IDENTITY
-- Email is already protected by customer_profiles_email_lower_uidx.
-- This adds the same invariant for WhatsApp after stripping formatting.
create unique index if not exists customer_profiles_whatsapp_digits_uidx
on public.customer_profiles ((regexp_replace(whatsapp, '\\D', '', 'g')))
where regexp_replace(whatsapp, '\\D', '', 'g') <> '';
