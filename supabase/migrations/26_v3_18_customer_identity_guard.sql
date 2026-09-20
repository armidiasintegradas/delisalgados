-- DELI SALGADOS — V3.18 CUSTOMER IDENTITY GUARD
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
  identities as (
    select
      cp.id as user_id,
      lower(trim(cp.email)) as email_norm,
      regexp_replace(cp.whatsapp, '\\D', '', 'g') as phone_norm
    from public.customer_profiles cp

    union all

    select
      o.customer_user_id as user_id,
      lower(trim(coalesce(o.customer_email, ''))) as email_norm,
      regexp_replace(coalesce(o.customer_phone, ''), '\\D', '', 'g') as phone_norm
    from public.orders o
  ),
  matches as (
    select i.*, inp.email_norm as requested_email, inp.phone_norm as requested_phone
    from identities i
    cross join input inp
    where
      (inp.email_norm <> '' and i.email_norm = inp.email_norm)
      or
      (inp.phone_norm <> '' and i.phone_norm = inp.phone_norm)
  )
  select jsonb_build_object(
    'known', exists(select 1 from matches),
    'conflict',
      case
        when p_user_id is null then false
        else exists(
          select 1
          from matches m
          where
            (m.user_id is not null and m.user_id <> p_user_id)
            or (
              m.requested_phone <> ''
              and m.phone_norm = m.requested_phone
              and m.email_norm <> ''
              and m.requested_email <> ''
              and m.email_norm <> m.requested_email
            )
        )
      end
  );
$$;

revoke all on function public.check_deli_customer_identity(text,text,uuid) from public, anon, authenticated;
grant execute on function public.check_deli_customer_identity(text,text,uuid) to service_role;
