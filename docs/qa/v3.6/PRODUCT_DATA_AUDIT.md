# Deli Salgados — Product Data & Image Audit V3.6

Date: 2026-09-19

## Database state

- Categories: 11
- Products: 43
- Product variants: 4
- Products with image_url: 0
- Product image bucket: `product-images` (public read, server-only write through admin API)

## Preparation metadata

Structured preparation fields were added:

- `products.preparation_type`
- `product_variants.preparation_type`

Allowed product values:

- `fried` -> Frito
- `baked` -> Assado / Forno
- `frozen` -> Congelado
- `ready` -> Pronto / Montado
- `variants` -> Varia conforme a opção

Current classification:

- Assado: 31 products
- Frito: 9 products
- Pronto / Montado: 2 products
- Varia conforme a opção: 1 product

Variant-specific preparation:

- Camarão Empanado 1 kg / Congelado -> `frozen`
- Camarão Empanado 1 kg / Frito -> `fried`

## Admin improvements

- Product editor now loads only live database data (no fake fallback product).
- Product form persists preparation metadata.
- Variant preparation can be edited independently.
- Product image URL is persisted.
- Authenticated upload endpoint added at `/api/admin/products/image`.
- JPG, PNG and WebP supported, max 5 MB.
- Uploaded files are stored in Supabase Storage bucket `product-images`.
- Fake thumbnails in Admin Products removed.
- Fake variant sales mix / conversion claims removed.
- Missing image displays a neutral Deli placeholder.

## Public catalog

Preparation is now visible as structured labels:

- FRITO
- ASSADO
- CONGELADO
- PRONTO

For a product whose preparation varies by variant, the card derives the visible labels from active variants.

## Remaining content work

1. Upload real product photography for the 43 products.
2. Review the initial preparation classification with Deli, especially products whose original menu did not explicitly print the preparation method.
3. Add approved descriptions only where Deli supplies or approves the copy.
4. Review units for 1.5 kg torta variants for display consistency.

## Data integrity rule

No AI-generated or invented ingredient descriptions, preparation claims or product photography are to be inserted automatically.
