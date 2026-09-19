-- DELI SALGADOS — CURRENT AVAILABILITY PATCH V1.2
-- Effective date: 2026-09-18
-- Goal:
-- 1) preserve all existing product information;
-- 2) snapshot the pre-change state;
-- 3) mark all existing products unavailable;
-- 4) activate only the current assortment defined by the client;
-- 5) do not delete products or historical variants;
-- 6) public catalog should default to showing available products only.

begin;

create table if not exists public.catalog_change_snapshots (
  id uuid primary key default gen_random_uuid(),
  batch_key text not null,
  product_id uuid not null references public.products(id) on delete cascade,
  captured_at timestamptz not null default now(),
  payload jsonb not null,
  unique (batch_key, product_id)
);

-- Snapshot current state before any mutation.
insert into public.catalog_change_snapshots (batch_key, product_id, payload)
select
  'deli-current-menu-2026-09-18-v1.2',
  p.id,
  jsonb_build_object(
    'product', to_jsonb(p),
    'variants', coalesce(
      (
        select jsonb_agg(to_jsonb(v) order by v.sort_order, v.name)
        from public.product_variants v
        where v.product_id = p.id
      ),
      '[]'::jsonb
    )
  )
from public.products p
on conflict (batch_key, product_id) do nothing;

-- Preserve records, but reset current availability.
update public.products
set availability = 'unavailable',
    updated_at = now();

-- Public catalog behavior: keep unavailable records in DB/admin, but do not show them by default.
insert into public.settings (key, value, updated_at)
values (
  'catalog',
  '{"show_search":true,"show_prices":true,"show_unavailable":false}'::jsonb,
  now()
)
on conflict (key) do update
set value = coalesce(public.settings.value, '{}'::jsonb)
            || '{"show_search":true,"show_prices":true,"show_unavailable":false}'::jsonb,
    updated_at = now();

-- Keep canonical 11 categories.
insert into public.categories (name, slug, sort_order, is_active)
values
('Empadas','empadas',1,true),
('Trouxinhas','trouxinhas',2,true),
('Tortas Salgadas','tortas-salgadas',3,true),
('Massa Folhada','massa-folhada',4,true),
('Canapés','canapes',5,true),
('Quiches','quiches',6,true),
('Vol-au-vent','vol-au-vent',7,true),
('Salgados','salgados',8,true),
('Diversos','diversos',9,true),
('Bolinhos','bolinhos',10,true),
('Mini Sanduíches','mini-sanduiches',11,true)
on conflict (slug) do update
set name=excluded.name, sort_order=excluded.sort_order, is_active=true;

-- Helper index for idempotent variant upserts.
create unique index if not exists product_variants_product_name_uq
on public.product_variants(product_id, name);


-- Upsert all currently available simple-price products.
insert into public.products
(category_id,name,slug,description,note,unit_label,minimum_quantity,price_type,base_price,availability,is_visible,sort_order)
values
((select id from public.categories where slug='empadas'),'Empadinha de Frango','empada-frango',null,null,'UND',100,'simple',3.90,'available',true,1),
((select id from public.categories where slug='empadas'),'Empadinha de Camarão','empada-camarao',null,null,'UND',100,'simple',4.90,'available',true,2),
((select id from public.categories where slug='empadas'),'Empadinha de Bacalhau','empada-bacalhau',null,null,'UND',100,'simple',4.90,'available',true,3),
((select id from public.categories where slug='trouxinhas'),'Trouxinha de Frango com Queijo','trouxinha-frango-queijo',null,null,'UND',100,'simple',6.00,'available',true,1),
((select id from public.categories where slug='trouxinhas'),'Trouxinha de Bacalhau','trouxinha-bacalhau',null,null,'UND',100,'simple',6.90,'available',true,2),
((select id from public.categories where slug='trouxinhas'),'Trouxinha Folhada de Frango com Cream Cheese','trouxinha-frango-cream-cheese',null,null,'UND',100,'simple',6.00,'available',true,3),
((select id from public.categories where slug='trouxinhas'),'Trouxinha de Massa Folhada com Damasco e Gorgonzola','trouxinha-gorgonzola-damasco-cream-cheese-amendoa',null,null,'UND',100,'simple',8.00,'available',true,4),
((select id from public.categories where slug='massa-folhada'),'Pastel de Frango em Massa Folhada com Cream Cheese','pastel-frango-cream-cheese',null,null,'UND',100,'simple',6.00,'available',true,1),
((select id from public.categories where slug='massa-folhada'),'Pastel de Camarão com Cream Cheese','pastel-camarao-cream-cheese',null,null,'UND',100,'simple',7.00,'available',true,2),
((select id from public.categories where slug='massa-folhada'),'Folhado de Ameixa com Bacon','folhado-ameixa-bacon',null,null,'UND',100,'simple',5.90,'available',true,3),
((select id from public.categories where slug='massa-folhada'),'Mini Croissant de Queijo com Presunto','mini-croissant-queijo-presunto',null,null,'UND',100,'simple',3.50,'available',true,4),
((select id from public.categories where slug='massa-folhada'),'Flor de Massa Folhada de Salaminho','flor-massa-folhada-salaminho',null,null,'UND',100,'simple',7.50,'available',true,5),
((select id from public.categories where slug='canapes'),'Canapé de Salaminho','canape-salaminho',null,null,'UND',100,'simple',6.00,'available',true,1),
((select id from public.categories where slug='canapes'),'Canapé de Frango','canape-frango',null,null,'UND',100,'simple',4.60,'available',true,2),
((select id from public.categories where slug='canapes'),'Barquete de Presunto Parma com Cream Cheese','barquete-presunto-parma-cream-cheese',null,null,'UND',100,'simple',8.90,'available',true,3),
((select id from public.categories where slug='canapes'),'Barquete de Gorgonzola com Damasco e Amêndoas Laminadas','barquete-gorgonzola-damasco-amendoas',null,null,'UND',100,'simple',8.90,'available',true,4),
((select id from public.categories where slug='quiches'),'Mini Quiche de Alho-Poró','quiche-alho-poro',null,null,'UND',100,'simple',3.95,'available',true,1),
((select id from public.categories where slug='quiches'),'Mini Quiche de Frango','quiche-frango',null,null,'UND',100,'simple',4.00,'available',true,2),
((select id from public.categories where slug='quiches'),'Mini Quiche Romeu e Julieta','quiche-romeu-julieta',null,null,'UND',100,'simple',4.00,'available',true,3),
((select id from public.categories where slug='quiches'),'Mini Quiche Nordestino','quiche-nordestino','Charque e banana da terra',null,'UND',100,'simple',4.50,'available',true,4),
((select id from public.categories where slug='quiches'),'Mini Quiche de Tomate Seco com Queijo','quiche-tomate-seco-queijo-manjericao',null,null,'UND',100,'simple',5.00,'available',true,5),
((select id from public.categories where slug='quiches'),'Mini Quiche de Queijo do Reino','quiche-queijo-reino',null,null,'UND',100,'simple',5.50,'available',true,6),
((select id from public.categories where slug='quiches'),'Mini Quiche de Gorgonzola com Damasco','quiche-gorgonzola-damasco',null,null,'UND',100,'simple',5.50,'available',true,7),
((select id from public.categories where slug='quiches'),'Mini Quiche de Bacalhau','quiche-bacalhau',null,null,'UND',100,'simple',5.00,'available',true,8),
((select id from public.categories where slug='quiches'),'Mini Quiche de Queijo','quiche-queijo',null,null,'UND',100,'simple',4.00,'available',true,9),
((select id from public.categories where slug='quiches'),'Mini Quiche de Camarão Inteiro com Queijo','quiche-camarao-inteiro-queijo',null,null,'UND',100,'simple',5.00,'available',true,10),
((select id from public.categories where slug='vol-au-vent'),'Vol-au-vent de Camarão','vol-au-vent-camarao-cream-cheese',null,null,'UND',100,'simple',8.00,'available',true,1),
((select id from public.categories where slug='vol-au-vent'),'Vol-au-vent de Gorgonzola com Damasco e Amêndoas Laminadas','vol-au-vent-gorgonzola-cream-cheese-damasco',null,null,'UND',100,'simple',8.90,'available',true,2),
((select id from public.categories where slug='salgados'),'Coxinha','coxinha-frango',null,null,'UND',100,'simple',1.70,'available',true,1),
((select id from public.categories where slug='salgados'),'Risoles de Carne','risole-carne',null,null,'UND',100,'simple',1.80,'available',true,2),
((select id from public.categories where slug='salgados'),'Pastelzinho de Festa','pastel-festa',null,null,'UND',100,'simple',2.30,'available',true,3),
((select id from public.categories where slug='salgados'),'Canudinho de Frango','canudinho-frango',null,null,'UND',100,'simple',3.70,'available',true,4),
((select id from public.categories where slug='salgados'),'Canudinho de Carne','canudinho-carne',null,null,'UND',100,'simple',3.95,'available',true,5),
((select id from public.categories where slug='diversos'),'Tortinha de Doce de Leite Condensado','tortinha-doce-leite',null,null,'UND',100,'simple',3.50,'available',true,1),
((select id from public.categories where slug='bolinhos'),'Bolinho de Queijo','bolinho-queijo',null,null,'UND',100,'simple',2.00,'available',true,1),
((select id from public.categories where slug='bolinhos'),'Bolinho de Presunto e Queijo','bolinho-presunto-queijo',null,null,'UND',100,'simple',2.30,'available',true,2),
((select id from public.categories where slug='bolinhos'),'Bolinho de Calabresa','bolinho-calabresa',null,null,'UND',100,'simple',1.80,'available',true,3),
((select id from public.categories where slug='bolinhos'),'Bolinho de Bacalhau','bolinho-bacalhau',null,null,'UND',100,'simple',5.10,'available',true,4),
((select id from public.categories where slug='mini-sanduiches'),'Mini Burger','mini-burguer',null,null,'UND',100,'simple',5.00,'available',true,1),
((select id from public.categories where slug='mini-sanduiches'),'Mini Hot Dog','mini-hot-dog',null,null,'UND',100,'simple',3.95,'available',true,2)
on conflict (slug) do update set
category_id=excluded.category_id,
name=excluded.name,
description=excluded.description,
note=excluded.note,
unit_label=excluded.unit_label,
minimum_quantity=excluded.minimum_quantity,
price_type='simple',
base_price=excluded.base_price,
availability='available',
is_visible=true,
sort_order=excluded.sort_order,
updated_at=now();

-- Products that changed from old variant/lote pricing to current unit pricing keep their old variants,
-- but those legacy variants are deactivated rather than deleted.
update public.product_variants
set is_active=false
where product_id in (
  select id from public.products
  where slug in (
    'coxinha-frango',
    'risole-carne',
    'pastel-festa',
    'bolinho-calabresa',
    'bolinho-bacalhau',
    'mini-burguer',
    'mini-hot-dog',
    'vol-au-vent-camarao-cream-cheese',
    'vol-au-vent-gorgonzola-cream-cheese-damasco'
  )
);


-- Variant-based current products.
insert into public.products
(category_id,name,slug,description,note,unit_label,minimum_quantity,price_type,base_price,availability,is_visible,sort_order)
values
((select id from public.categories where slug='tortas-salgadas'),'Torta Salgada de Frango','torta-frango',null,null,'UND',1,'variants',null,'available',true,1),
((select id from public.categories where slug='tortas-salgadas'),'Torta Salgada de Bacalhau','torta-bacalhau',null,null,'UND',1,'variants',null,'available',true,2),
((select id from public.categories where slug='salgados'),'Camarão Empanado 1 kg','camarao-empanado-1kg',null,null,'1 kg',1,'variants',null,'available',true,6)
on conflict (slug) do update set
category_id=excluded.category_id,
name=excluded.name,
unit_label=excluded.unit_label,
minimum_quantity=excluded.minimum_quantity,
price_type='variants',
base_price=null,
availability='available',
is_visible=true,
sort_order=excluded.sort_order,
updated_at=now();

-- Preserve old torta size variants but only 1,5 kg is currently active.
update public.product_variants
set is_active=false
where product_id in (
  select id from public.products where slug in ('torta-frango','torta-bacalhau')
);


insert into public.product_variants
(product_id,name,price,unit_label,minimum_quantity,sort_order,is_active)
values
((select id from public.products where slug='torta-frango'),'1,5 kg',170.00,'UND',1,1,true),
((select id from public.products where slug='torta-bacalhau'),'1,5 kg',230.00,'UND',1,1,true),
((select id from public.products where slug='camarao-empanado-1kg'),'Congelado',175.00,'1 kg',1,1,true),
((select id from public.products where slug='camarao-empanado-1kg'),'Frito',195.00,'1 kg',1,2,true)
on conflict (product_id, name) do update set
price=excluded.price,
unit_label=excluded.unit_label,
minimum_quantity=excluded.minimum_quantity,
sort_order=excluded.sort_order,
is_active=true;

-- Products that are not in the current assortment remain preserved, but unavailable.
-- No DELETE is performed.

-- Sanity checks.
select count(*) as current_available_products
from public.products
where availability='available';

select c.name, count(*) as available_products
from public.products p
join public.categories c on c.id=p.category_id
where p.availability='available'
group by c.name, c.sort_order
order by c.sort_order;

select p.name, p.base_price, p.price_type, p.unit_label, p.minimum_quantity
from public.products p
where p.availability='available'
order by p.name;

commit;
