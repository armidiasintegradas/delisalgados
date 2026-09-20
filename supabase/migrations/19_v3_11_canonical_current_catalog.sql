-- DELI SALGADOS — V3.11 CANONICAL CURRENT CATALOG
-- Current products and prices supplied by Deli on 2026-09-19.
-- Rule: hide every product not present in this canonical list.

begin;

update public.products
set is_visible = false,
    updated_at = now();

with canonical(slug, price) as (
  values
    ('coxinha-frango', 1.70::numeric),
    ('risole-carne', 1.80::numeric),
    ('bolinho-queijo', 2.00::numeric),
    ('bolinho-presunto-queijo', 2.30::numeric),
    ('bolinho-calabresa', 1.80::numeric),
    ('bolinho-bacalhau', 5.10::numeric),
    ('pastel-festa', 2.30::numeric),
    ('empada-frango', 3.90::numeric),
    ('empada-camarao', 4.90::numeric),
    ('empada-bacalhau', 4.90::numeric),
    ('tortinha-doce-leite', 3.50::numeric),
    ('canudinho-frango', 3.70::numeric),
    ('canudinho-carne', 3.95::numeric),
    ('mini-burguer', 5.00::numeric),
    ('mini-hot-dog', 3.95::numeric),
    ('trouxinha-frango-queijo', 6.00::numeric),
    ('trouxinha-bacalhau', 6.90::numeric),
    ('quiche-alho-poro', 3.95::numeric),
    ('quiche-frango', 4.00::numeric),
    ('quiche-romeu-julieta', 4.00::numeric),
    ('quiche-nordestino', 4.50::numeric),
    ('quiche-tomate-seco-queijo-manjericao', 5.00::numeric),
    ('quiche-queijo-reino', 5.50::numeric),
    ('quiche-gorgonzola-damasco', 5.50::numeric),
    ('quiche-bacalhau', 5.00::numeric),
    ('quiche-queijo', 4.00::numeric),
    ('quiche-camarao-inteiro-queijo', 5.00::numeric),
    ('trouxinha-frango-cream-cheese', 6.00::numeric),
    ('pastel-frango-cream-cheese', 6.00::numeric),
    ('pastel-camarao-cream-cheese', 7.00::numeric),
    ('folhado-ameixa-bacon', 5.90::numeric),
    ('mini-croissant-queijo-presunto', 3.50::numeric),
    ('trouxinha-gorgonzola-damasco-cream-cheese-amendoa', 8.00::numeric),
    ('flor-massa-folhada-salaminho', 7.50::numeric),
    ('vol-au-vent-camarao-cream-cheese', 8.00::numeric),
    ('vol-au-vent-gorgonzola-cream-cheese-damasco', 8.90::numeric),
    ('barquete-presunto-parma-cream-cheese', 8.90::numeric),
    ('barquete-gorgonzola-damasco-amendoas', 8.90::numeric),
    ('canape-salaminho', 6.00::numeric),
    ('canape-frango', 4.60::numeric)
)
update public.products p
set base_price = c.price,
    minimum_quantity = 25,
    availability = 'available',
    is_visible = true,
    updated_at = now()
from canonical c
where p.slug = c.slug;

update public.products
set availability = 'available',
    is_visible = true,
    updated_at = now()
where slug in ('camarao-empanado-1kg','torta-frango','torta-bacalhau');

update public.product_variants
set price = case
      when product_id = 'b14a58de-3a4e-4345-a4e4-c246151fc2b0'::uuid and lower(name) like '%congel%' then 175.00
      when product_id = 'b14a58de-3a4e-4345-a4e4-c246151fc2b0'::uuid and lower(name) like '%frito%' then 195.00
      when product_id = 'c2ecc440-64e9-44de-a011-800eb3f90d0c'::uuid then 170.00
      when product_id = '67312f27-6137-4a8e-936f-eb67f890ebd6'::uuid then 230.00
      else price
    end,
    unit_label = case
      when product_id in (
        'c2ecc440-64e9-44de-a011-800eb3f90d0c'::uuid,
        '67312f27-6137-4a8e-936f-eb67f890ebd6'::uuid
      ) then '1,5 kg'
      else unit_label
    end,
    minimum_quantity = 1,
    is_active = true,
    updated_at = now()
where product_id in (
  'b14a58de-3a4e-4345-a4e4-c246151fc2b0'::uuid,
  'c2ecc440-64e9-44de-a011-800eb3f90d0c'::uuid,
  '67312f27-6137-4a8e-936f-eb67f890ebd6'::uuid
);

commit;
