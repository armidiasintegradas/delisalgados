-- DELI SALGADOS — CANONICAL SEED V1.2
-- Effective date: 2026-09-18

begin;

-- Initial default settings (do not overwrite if already set in production)
insert into public.settings (key, value, updated_at)
values 
  ('general', '{"business_name": "Deli Salgados", "whatsapp_number": "", "instagram_url": "https://www.instagram.com/deli.salgados", "address": "", "pickup_information": "", "delivery_information": ""}'::jsonb, now()),
  ('catalog', '{"show_search": true, "show_prices": true, "show_unavailable": false, "special_order_cta_enabled": true, "special_order_cta_text": "Precisa de um pedido especial para sua festa?"}'::jsonb, now()),
  ('messages', '{"whatsapp_opening_message": "Olá, Deli Salgados! Gostaria de enviar uma solicitação de pedido pelo cardápio digital:", "whatsapp_closing_message": "Aguardo confirmação da disponibilidade e do valor final. Obrigado!"}'::jsonb, now())
on conflict (key) do nothing;

-- 11 Canonical Categories
insert into public.categories (name, slug, sort_order, is_active)
values
  ('Empadas', 'empadas', 1, true),
  ('Trouxinhas', 'trouxinhas', 2, true),
  ('Tortas Salgadas', 'tortas-salgadas', 3, true),
  ('Massa Folhada', 'massa-folhada', 4, true),
  ('Canapés', 'canapes', 5, true),
  ('Quiches', 'quiches', 6, true),
  ('Vol-au-vent', 'vol-au-vent', 7, true),
  ('Salgados', 'salgados', 8, true),
  ('Diversos', 'diversos', 9, true),
  ('Bolinhos', 'bolinhos', 10, true),
  ('Mini Sanduíches', 'mini-sanduiches', 11, true)
on conflict (slug) do update
set name = excluded.name, sort_order = excluded.sort_order, is_active = true;

-- Helper index for idempotent variant upserts
create unique index if not exists product_variants_product_name_uq
on public.product_variants(product_id, name);

-- Upsert simple-price products (40 products)
insert into public.products
(category_id, name, slug, description, note, unit_label, minimum_quantity, price_type, base_price, availability, is_visible, sort_order)
values
  ((select id from public.categories where slug='empadas'), 'Empadinha de Frango', 'empada-frango', null, null, 'UND', 100, 'simple', 3.90, 'available', true, 1),
  ((select id from public.categories where slug='empadas'), 'Empadinha de Camarão', 'empada-camarao', null, null, 'UND', 100, 'simple', 4.90, 'available', true, 2),
  ((select id from public.categories where slug='empadas'), 'Empadinha de Bacalhau', 'empada-bacalhau', null, null, 'UND', 100, 'simple', 4.90, 'available', true, 3),
  
  ((select id from public.categories where slug='trouxinhas'), 'Trouxinha de Frango com Queijo', 'trouxinha-frango-queijo', null, null, 'UND', 100, 'simple', 6.00, 'available', true, 1),
  ((select id from public.categories where slug='trouxinhas'), 'Trouxinha de Bacalhau', 'trouxinha-bacalhau', null, null, 'UND', 100, 'simple', 6.90, 'available', true, 2),
  ((select id from public.categories where slug='trouxinhas'), 'Trouxinha Folhada de Frango com Cream Cheese', 'trouxinha-frango-cream-cheese', null, null, 'UND', 100, 'simple', 6.00, 'available', true, 3),
  ((select id from public.categories where slug='trouxinhas'), 'Trouxinha de Massa Folhada com Damasco e Gorgonzola', 'trouxinha-gorgonzola-damasco-cream-cheese-amendoa', null, null, 'UND', 100, 'simple', 8.00, 'available', true, 4),
  
  ((select id from public.categories where slug='massa-folhada'), 'Pastel de Frango em Massa Folhada com Cream Cheese', 'pastel-frango-cream-cheese', null, null, 'UND', 100, 'simple', 6.00, 'available', true, 1),
  ((select id from public.categories where slug='massa-folhada'), 'Pastel de Camarão com Cream Cheese', 'pastel-camarao-cream-cheese', null, null, 'UND', 100, 'simple', 7.00, 'available', true, 2),
  ((select id from public.categories where slug='massa-folhada'), 'Folhado de Ameixa com Bacon', 'folhado-ameixa-bacon', null, null, 'UND', 100, 'simple', 5.90, 'available', true, 3),
  ((select id from public.categories where slug='massa-folhada'), 'Mini Croissant de Queijo com Presunto', 'mini-croissant-queijo-presunto', null, null, 'UND', 100, 'simple', 3.50, 'available', true, 4),
  ((select id from public.categories where slug='massa-folhada'), 'Flor de Massa Folhada de Salaminho', 'flor-massa-folhada-salaminho', null, null, 'UND', 100, 'simple', 7.50, 'available', true, 5),
  
  ((select id from public.categories where slug='canapes'), 'Canapé de Salaminho', 'canape-salaminho', null, null, 'UND', 100, 'simple', 6.00, 'available', true, 1),
  ((select id from public.categories where slug='canapes'), 'Canapé de Frango', 'canape-frango', null, null, 'UND', 100, 'simple', 4.60, 'available', true, 2),
  ((select id from public.categories where slug='canapes'), 'Barquete de Presunto Parma com Cream Cheese', 'barquete-presunto-parma-cream-cheese', null, null, 'UND', 100, 'simple', 8.90, 'available', true, 3),
  ((select id from public.categories where slug='canapes'), 'Barquete de Gorgonzola com Damasco e Amêndoas Laminadas', 'barquete-gorgonzola-damasco-amendoas', null, null, 'UND', 100, 'simple', 8.90, 'available', true, 4),
  
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Alho-Poró', 'quiche-alho-poro', null, null, 'UND', 100, 'simple', 3.95, 'available', true, 1),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Frango', 'quiche-frango', null, null, 'UND', 100, 'simple', 4.00, 'available', true, 2),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche Romeu e Julieta', 'quiche-romeu-julieta', null, null, 'UND', 100, 'simple', 4.00, 'available', true, 3),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche Nordestino', 'quiche-nordestino', 'Charque e banana da terra', null, 'UND', 100, 'simple', 4.50, 'available', true, 4),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Tomate Seco com Queijo', 'quiche-tomate-seco-queijo-manjericao', null, null, 'UND', 100, 'simple', 5.00, 'available', true, 5),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Queijo do Reino', 'quiche-queijo-reino', null, null, 'UND', 100, 'simple', 5.50, 'available', true, 6),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Gorgonzola com Damasco', 'quiche-gorgonzola-damasco', null, null, 'UND', 100, 'simple', 5.50, 'available', true, 7),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Bacalhau', 'quiche-bacalhau', null, null, 'UND', 100, 'simple', 5.00, 'available', true, 8),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Queijo', 'quiche-queijo', null, null, 'UND', 100, 'simple', 4.00, 'available', true, 9),
  ((select id from public.categories where slug='quiches'), 'Mini Quiche de Camarão Inteiro com Queijo', 'quiche-camarao-inteiro-queijo', null, null, 'UND', 100, 'simple', 5.00, 'available', true, 10),
  
  ((select id from public.categories where slug='vol-au-vent'), 'Vol-au-vent de Camarão', 'vol-au-vent-camarao-cream-cheese', null, null, 'UND', 100, 'simple', 8.00, 'available', true, 1),
  ((select id from public.categories where slug='vol-au-vent'), 'Vol-au-vent de Gorgonzola com Damasco e Amêndoas Laminadas', 'vol-au-vent-gorgonzola-cream-cheese-damasco', null, null, 'UND', 100, 'simple', 8.90, 'available', true, 2),
  
  ((select id from public.categories where slug='salgados'), 'Coxinha', 'coxinha-frango', null, null, 'UND', 100, 'simple', 1.70, 'available', true, 1),
  ((select id from public.categories where slug='salgados'), 'Risoles de Carne', 'risole-carne', null, null, 'UND', 100, 'simple', 1.80, 'available', true, 2),
  ((select id from public.categories where slug='salgados'), 'Pastelzinho de Festa', 'pastel-festa', null, null, 'UND', 100, 'simple', 2.30, 'available', true, 3),
  ((select id from public.categories where slug='salgados'), 'Canudinho de Frango', 'canudinho-frango', null, null, 'UND', 100, 'simple', 3.70, 'available', true, 4),
  ((select id from public.categories where slug='salgados'), 'Canudinho de Carne', 'canudinho-carne', null, null, 'UND', 100, 'simple', 3.95, 'available', true, 5),
  
  ((select id from public.categories where slug='diversos'), 'Tortinha de Doce de Leite Condensado', 'tortinha-doce-leite', null, null, 'UND', 100, 'simple', 3.50, 'available', true, 1),
  
  ((select id from public.categories where slug='bolinhos'), 'Bolinho de Queijo', 'bolinho-queijo', null, null, 'UND', 100, 'simple', 2.00, 'available', true, 1),
  ((select id from public.categories where slug='bolinhos'), 'Bolinho de Presunto e Queijo', 'bolinho-presunto-queijo', null, null, 'UND', 100, 'simple', 2.30, 'available', true, 2),
  ((select id from public.categories where slug='bolinhos'), 'Bolinho de Calabresa', 'bolinho-calabresa', null, null, 'UND', 100, 'simple', 1.80, 'available', true, 3),
  ((select id from public.categories where slug='bolinhos'), 'Bolinho de Bacalhau', 'bolinho-bacalhau', null, null, 'UND', 100, 'simple', 5.10, 'available', true, 4),
  
  ((select id from public.categories where slug='mini-sanduiches'), 'Mini Burger', 'mini-burguer', null, null, 'UND', 100, 'simple', 5.00, 'available', true, 1),
  ((select id from public.categories where slug='mini-sanduiches'), 'Mini Hot Dog', 'mini-hot-dog', null, null, 'UND', 100, 'simple', 3.95, 'available', true, 2)
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  note = excluded.note,
  unit_label = excluded.unit_label,
  minimum_quantity = excluded.minimum_quantity,
  price_type = 'simple',
  base_price = excluded.base_price,
  availability = 'available',
  is_visible = true,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Upsert variant-based products (3 products: Tortas e Camarão Empanado)
insert into public.products
(category_id, name, slug, description, note, unit_label, minimum_quantity, price_type, base_price, availability, is_visible, sort_order)
values
  ((select id from public.categories where slug='tortas-salgadas'), 'Torta Salgada de Frango', 'torta-frango', null, null, 'UND', 1, 'variants', null, 'available', true, 1),
  ((select id from public.categories where slug='tortas-salgadas'), 'Torta Salgada de Bacalhau', 'torta-bacalhau', null, null, 'UND', 1, 'variants', null, 'available', true, 2),
  ((select id from public.categories where slug='salgados'), 'Camarão Empanado 1 kg', 'camarao-empanado-1kg', null, null, '1 kg', 1, 'variants', null, 'available', true, 6)
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  unit_label = excluded.unit_label,
  minimum_quantity = excluded.minimum_quantity,
  price_type = 'variants',
  base_price = null,
  availability = 'available',
  is_visible = true,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Upsert active variants (4 active variants)
insert into public.product_variants
(product_id, name, price, unit_label, minimum_quantity, sort_order, is_active)
values
  ((select id from public.products where slug='torta-frango'), '1,5 kg', 170.00, 'UND', 1, 1, true),
  ((select id from public.products where slug='torta-bacalhau'), '1,5 kg', 230.00, 'UND', 1, 1, true),
  ((select id from public.products where slug='camarao-empanado-1kg'), 'Congelado', 175.00, '1 kg', 1, 1, true),
  ((select id from public.products where slug='camarao-empanado-1kg'), 'Frito', 195.00, '1 kg', 1, 2, true)
on conflict (product_id, name) do update set
  price = excluded.price,
  unit_label = excluded.unit_label,
  minimum_quantity = excluded.minimum_quantity,
  sort_order = excluded.sort_order,
  is_active = true;

commit;
