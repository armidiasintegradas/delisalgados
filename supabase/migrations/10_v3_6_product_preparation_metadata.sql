-- DELI SALGADOS — V3.6 PRODUCT PREPARATION METADATA

alter table public.products
  add column if not exists preparation_type text null
  check (preparation_type is null or preparation_type = any (array['fried','baked','frozen','ready','variants']::text[]));

alter table public.product_variants
  add column if not exists preparation_type text null
  check (preparation_type is null or preparation_type = any (array['fried','baked','frozen','ready']::text[]));

comment on column public.products.preparation_type is
'Commercial preparation/delivery state: fried, baked, frozen, ready, variants.';
comment on column public.product_variants.preparation_type is
'Variant-specific commercial preparation/delivery state.';

update public.products set preparation_type='baked'
where name in (
  'Empadinha de Frango','Empadinha de Camarão','Empadinha de Bacalhau',
  'Trouxinha de Frango com Queijo','Trouxinha de Bacalhau',
  'Trouxinha Folhada de Frango com Cream Cheese',
  'Trouxinha de Massa Folhada com Damasco e Gorgonzola',
  'Torta Salgada de Frango','Torta Salgada de Bacalhau',
  'Pastel de Frango em Massa Folhada com Cream Cheese',
  'Pastel de Camarão com Cream Cheese','Folhado de Ameixa com Bacon',
  'Mini Croissant de Queijo com Presunto','Flor de Massa Folhada de Salaminho',
  'Canapé de Salaminho','Canapé de Frango',
  'Barquete de Presunto Parma com Cream Cheese',
  'Barquete de Gorgonzola com Damasco e Amêndoas Laminadas',
  'Mini Quiche de Alho-Poró','Mini Quiche de Frango','Mini Quiche Romeu e Julieta',
  'Mini Quiche Nordestino','Mini Quiche de Tomate Seco com Queijo',
  'Mini Quiche de Queijo do Reino','Mini Quiche de Gorgonzola com Damasco',
  'Mini Quiche de Bacalhau','Mini Quiche de Queijo',
  'Mini Quiche de Camarão Inteiro com Queijo',
  'Vol-au-vent de Camarão','Vol-au-vent de Gorgonzola com Damasco e Amêndoas Laminadas',
  'Tortinha de Doce de Leite Condensado'
);

update public.products set preparation_type='fried'
where name in (
  'Coxinha','Risoles de Carne','Pastelzinho de Festa',
  'Canudinho de Frango','Canudinho de Carne',
  'Bolinho de Queijo','Bolinho de Presunto e Queijo','Bolinho de Calabresa','Bolinho de Bacalhau'
);

update public.products set preparation_type='ready'
where name in ('Mini Burger','Mini Hot Dog');

update public.products set preparation_type='variants'
where name='Camarão Empanado 1 kg';

update public.product_variants pv
set preparation_type = case
  when lower(pv.name) like '%congel%' then 'frozen'
  when lower(pv.name) like '%frito%' then 'fried'
  else pv.preparation_type
end
from public.products p
where pv.product_id=p.id and p.name='Camarão Empanado 1 kg';
