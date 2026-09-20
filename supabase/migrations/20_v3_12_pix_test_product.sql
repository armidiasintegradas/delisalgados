-- DELI SALGADOS — V3.12 TEMPORARY PIX TEST PRODUCT
-- Temporary exception to the canonical catalog for payment validation.
-- Remove or hide after Pix validation is complete.

insert into public.products (
  category_id, name, slug, description, note, unit_label,
  minimum_quantity, price_type, base_price, availability,
  is_visible, is_featured, sort_order, image_url, preparation_type,
  created_at, updated_at
)
values (
  'e1d7d782-006f-491c-b27a-2cce458dec6a'::uuid,
  'Produto Teste Pix',
  'produto-teste-pix',
  'Produto temporário para validar o fluxo de pagamento Pix.',
  'TESTE INTERNO — ocultar após validação do Pix.',
  'TESTE',
  1,
  'simple',
  0.01,
  'available',
  true,
  false,
  999,
  null,
  'ready',
  now(),
  now()
)
on conflict (slug) do update set
  base_price = 0.01,
  unit_label = 'TESTE',
  minimum_quantity = 1,
  availability = 'available',
  is_visible = true,
  preparation_type = 'ready',
  note = 'TESTE INTERNO — ocultar após validação do Pix.',
  updated_at = now();
