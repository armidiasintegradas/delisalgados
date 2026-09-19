# Deli Salgados — Supabase Activation Report V3.5

Date: 2026-09-19

## Project

- Supabase project: `delisalgados`
- Project ref: `nmkcytrnlmlbinmvktwn`
- Region: `us-west-2`
- Status: `ACTIVE_HEALTHY`
- API URL: `https://nmkcytrnlmlbinmvktwn.supabase.co`

## Canonical data

- Active categories: 11
- Products total: 43
- Products available/visible: 43
- Active variants: 4
- Orders after QA cleanup: 0
- Auth users: 0
- Admin profiles: 0

## V3.4 handoff/database features verified

- `orders.handoff_token_hash`: present
- `orders.handoff_token_expires_at`: present
- `orders.whatsapp_opened_at`: present
- `public.next_order_public_code()`: present
- `public.create_deli_order_v34(...)`: present
- Transactional order RPC tested with real PostgreSQL writes
- Sequence generated distinct codes `DL-0002` and `DL-0003` during QA
- QA orders and items removed after verification

## Critical defect found and fixed

The V3.4 RPC attempted to cast `fulfillment_type` to a PostgreSQL enum type named `fulfillment_type`, but the canonical schema defines `orders.fulfillment_type` as `text` with a CHECK constraint.

This caused real order creation to fail with:

`type "fulfillment_type" does not exist`

Fixed in migration:

`08_v3_5_fix_order_rpc_types.sql`

The transactional RPC was then re-tested successfully against the live Supabase project.

## Security hardening applied

Migrations applied directly to the live project:

- `v3_5_rls_function_hardening`
- `v3_5_private_admin_helper`
- `v3_5_fix_order_rpc_types`
- `v3_5_restrict_order_code_function`

Results:

- Supabase security advisor: 0 findings
- Admin RLS helper moved to non-exposed `private` schema
- Transactional order RPC executable only by `service_role`
- Public code sequence function executable only by `service_role`
- Public catalog SELECT policies restricted to `anon`
- Admin mutation policies restricted to `authenticated` + private admin check
- Missing RLS policy added for catalog snapshots
- Missing FK-supporting indexes added

## Current settings

- Business: Deli Salgados
- Instagram: `https://www.instagram.com/deli.salgados`
- WhatsApp: NOT CONFIGURED
- Address: blank
- Pickup information: blank
- Delivery information: blank

## Remaining production activation blockers

1. Configure Vercel production environment:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` or compatible publishable key
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL=https://delisalgados.vercel.app`
   - ensure `DELI_ALLOW_LOCAL_DB` is absent or `false`

2. Create at least one real Supabase Auth user.

3. Insert corresponding `admin_profiles` row with role `administrator`.

4. Configure the official Deli Salgados WhatsApp number in `settings.general.whatsapp_number`.

5. Run the final production E2E:
   catalog -> cart -> checkout -> Supabase -> DL code -> handoff -> refresh -> WhatsApp -> Admin.

## Status

`BLOCKED — VERCEL ENV + ADMIN USER + OFFICIAL WHATSAPP REQUIRED`
