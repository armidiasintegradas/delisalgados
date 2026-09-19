-- DELI SALGADOS — V3.5 FIX ORDER RPC TYPES
-- orders.fulfillment_type and desired_date are text columns with CHECK constraints,
-- so the transactional RPC must not cast to a nonexistent enum type.

create or replace function public.create_deli_order_v34(
  p_order jsonb,
  p_items jsonb,
  p_token_hash text,
  p_token_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_public_code text;
  v_item jsonb;
  v_result jsonb;
begin
  v_order_id := coalesce((p_order->>'id')::uuid, gen_random_uuid());
  v_public_code := public.next_order_public_code();

  insert into public.orders (
    id,
    public_code,
    customer_name,
    customer_phone,
    desired_date,
    fulfillment_type,
    delivery_address,
    customer_note,
    total,
    status,
    whatsapp_status,
    handoff_token_hash,
    handoff_token_expires_at,
    created_at,
    updated_at
  ) values (
    v_order_id,
    v_public_code,
    p_order->>'customer_name',
    p_order->>'customer_phone',
    p_order->>'desired_date',
    p_order->>'fulfillment_type',
    nullif(p_order->>'delivery_address',''),
    nullif(p_order->>'customer_note',''),
    (p_order->>'total')::numeric(10,2),
    'generated',
    'pending',
    p_token_hash,
    p_token_expires_at,
    now(),
    now()
  );

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (
      id,
      order_id,
      product_id,
      variant_id,
      product_name_snapshot,
      variant_name_snapshot,
      unit_label_snapshot,
      unit_price_snapshot,
      quantity,
      subtotal,
      note
    ) values (
      coalesce((v_item->>'id')::uuid, gen_random_uuid()),
      v_order_id,
      (v_item->>'product_id')::uuid,
      case
        when nullif(v_item->>'variant_id','') is not null
          then (v_item->>'variant_id')::uuid
        else null
      end,
      v_item->>'product_name_snapshot',
      nullif(v_item->>'variant_name_snapshot',''),
      v_item->>'unit_label_snapshot',
      (v_item->>'unit_price_snapshot')::numeric(10,2),
      (v_item->>'quantity')::integer,
      (v_item->>'subtotal')::numeric(10,2),
      nullif(v_item->>'note','')
    );
  end loop;

  select jsonb_build_object(
    'id', o.id,
    'public_code', o.public_code,
    'customer_name', o.customer_name,
    'customer_phone', o.customer_phone,
    'desired_date', o.desired_date,
    'fulfillment_type', o.fulfillment_type,
    'delivery_address', o.delivery_address,
    'customer_note', o.customer_note,
    'total', o.total,
    'status', o.status,
    'whatsapp_status', o.whatsapp_status,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'items', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'order_id', oi.order_id,
            'product_id', oi.product_id,
            'variant_id', oi.variant_id,
            'product_name_snapshot', oi.product_name_snapshot,
            'variant_name_snapshot', oi.variant_name_snapshot,
            'unit_label_snapshot', oi.unit_label_snapshot,
            'unit_price_snapshot', oi.unit_price_snapshot,
            'quantity', oi.quantity,
            'subtotal', oi.subtotal,
            'note', oi.note
          )
          order by oi.created_at, oi.id
        ),
        '[]'::jsonb
      )
      from public.order_items oi
      where oi.order_id = o.id
    )
  )
  into v_result
  from public.orders o
  where o.id = v_order_id;

  return v_result;
end;
$$;

revoke all on function public.create_deli_order_v34(jsonb, jsonb, text, timestamptz) from public;
revoke execute on function public.create_deli_order_v34(jsonb, jsonb, text, timestamptz) from anon;
revoke execute on function public.create_deli_order_v34(jsonb, jsonb, text, timestamptz) from authenticated;
grant execute on function public.create_deli_order_v34(jsonb, jsonb, text, timestamptz) to service_role;
