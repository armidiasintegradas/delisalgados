-- DELI SALGADOS — V3.21 AUTHENTICATED CUSTOMER IDENTITY RECONCILIATION
-- An authenticated customer's Supabase user_id is the primary identity.
-- Legacy anonymous orders can make an email/phone "known", but must not be
-- treated as ownership conflicts. Only another registered profile or an
-- order already owned by a different authenticated user may block checkout.

create or replace function public.check_deli_customer_identity(
  p_email text,
  p_phone text,
  p_user_id uuid default null
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with input as (
    select
      lower(trim(coalesce(p_email, ''))) as email_norm,
      regexp_replace(coalesce(p_phone, ''), '\\D', '', 'g') as phone_norm
  ),
  profile_matches as (
    select cp.id as user_id
    from public.customer_profiles cp
    cross join input inp
    where
      (inp.email_norm <> '' and lower(trim(coalesce(cp.email, ''))) = inp.email_norm)
      or
      (inp.phone_norm <> '' and regexp_replace(coalesce(cp.whatsapp, ''), '\\D', '', 'g') = inp.phone_norm)
  ),
  order_matches as (
    select o.customer_user_id as user_id
    from public.orders o
    cross join input inp
    where
      (inp.email_norm <> '' and lower(trim(coalesce(o.customer_email, ''))) = inp.email_norm)
      or
      (inp.phone_norm <> '' and regexp_replace(coalesce(o.customer_phone, ''), '\\D', '', 'g') = inp.phone_norm)
  )
  select jsonb_build_object(
    'known',
      exists(select 1 from profile_matches)
      or exists(select 1 from order_matches),
    'conflict',
      case
        when p_user_id is null then false
        else
          exists(
            select 1
            from profile_matches pm
            where pm.user_id <> p_user_id
          )
          or exists(
            select 1
            from order_matches om
            where om.user_id is not null
              and om.user_id <> p_user_id
          )
      end
  );
$$;

revoke all on function public.check_deli_customer_identity(text,text,uuid) from public, anon, authenticated;
grant execute on function public.check_deli_customer_identity(text,text,uuid) to service_role;
