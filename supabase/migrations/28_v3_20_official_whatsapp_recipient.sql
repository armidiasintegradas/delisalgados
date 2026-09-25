-- DELI SALGADOS — V3.20 OFFICIAL WHATSAPP ORDER RECIPIENT
-- All customer -> Deli order/payment messages use the official WhatsApp number.

update public.settings
set value = jsonb_set(
      value,
      '{whatsapp_number}',
      to_jsonb('+55 81 99523-9013'::text),
      true
    ),
    updated_at = now()
where key = 'general';
