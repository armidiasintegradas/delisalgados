-- DELI SALGADOS — V3.5 RESTRICT PUBLIC CODE SEQUENCE FUNCTION
-- Public codes are generated only inside the privileged transactional order RPC.

revoke all on function public.next_order_public_code() from public;
revoke execute on function public.next_order_public_code() from anon;
revoke execute on function public.next_order_public_code() from authenticated;
grant execute on function public.next_order_public_code() to service_role;
