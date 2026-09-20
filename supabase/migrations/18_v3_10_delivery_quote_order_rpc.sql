-- DELI SALGADOS — V3.10 DELIVERY QUOTE ORDER RPC

create or replace function public.create_deli_order_v34(
  p_order jsonb,
  p_items jsonb,
  p_token_hash text,
  p_token_expires_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_order_id uuid;
  v_public_code text;
  v_item jsonb;
  v_result jsonb;
  v_payment_plan text;
  v_total numeric(10,2);
  v_due_now numeric(10,2);
  v_balance numeric(10,2);
begin
  v_order_id := coalesce((p_order->>'id')::uuid, gen_random_uuid());
  v_public_code := public.next_order_public_code();
  v_payment_plan := coalesce(nullif(p_order->>'payment_plan',''), 'deposit_50');

  if v_payment_plan not in ('deposit_50','full') then
    raise exception 'Plano de pagamento inválido';
  end if;

  v_total := (p_order->>'total')::numeric(10,2);
  v_due_now := case
    when v_payment_plan = 'full' then v_total
    else round((v_total * 0.50)::numeric,2)
  end;
  v_balance := v_total - v_due_now;

  insert into public.orders (
    id, public_code, customer_name, customer_phone, customer_email,
    customer_user_id, desired_date, fulfillment_type, delivery_address,
    customer_reference_point, customer_note, total, status, whatsapp_status,
    handoff_token_hash, handoff_token_expires_at,
    payment_plan, payment_method, payment_status, deposit_percentage,
    amount_due_now, amount_paid, balance_due,
    delivery_provider, delivery_quote_amount, delivery_quote_currency,
    delivery_quote_id, delivery_quote_expires_at, delivery_eta_minutes,
    created_at, updated_at
  ) values (
    v_order_id, v_public_code, p_order->>'customer_name', p_order->>'customer_phone',
    nullif(lower(p_order->>'customer_email'),''),
    case when nullif(p_order->>'customer_user_id','') is not null
      then (p_order->>'customer_user_id')::uuid else null end,
    p_order->>'desired_date', p_order->>'fulfillment_type',
    nullif(p_order->>'delivery_address',''),
    nullif(p_order->>'customer_reference_point',''),
    nullif(p_order->>'customer_note',''),
    v_total, 'generated', 'pending',
    p_token_hash, p_token_expires_at,
    v_payment_plan, 'pix', 'pending',
    case when v_payment_plan='full' then 100 else 50 end,
    v_due_now, 0, v_balance,
    nullif(p_order->>'delivery_provider',''),
    case when nullif(p_order->>'delivery_quote_amount','') is not null
      then (p_order->>'delivery_quote_amount')::numeric(10,2) else null end,
    nullif(p_order->>'delivery_quote_currency',''),
    nullif(p_order->>'delivery_quote_id',''),
    case when nullif(p_order->>'delivery_quote_expires_at','') is not null
      then (p_order->>'delivery_quote_expires_at')::timestamptz else null end,
    case when nullif(p_order->>'delivery_eta_minutes','') is not null
      then (p_order->>'delivery_eta_minutes')::integer else null end,
    now(), now()
  );

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (
      id, order_id, product_id, variant_id, product_name_snapshot,
      variant_name_snapshot, unit_label_snapshot, unit_price_snapshot,
      quantity, subtotal, note
    ) values (
      coalesce((v_item->>'id')::uuid, gen_random_uuid()), v_order_id,
      (v_item->>'product_id')::uuid,
      case when nullif(v_item->>'variant_id','') is not null
        then (v_item->>'variant_id')::uuid else null end,
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
    'customer_email', o.customer_email,
    'customer_user_id', o.customer_user_id,
    'desired_date', o.desired_date,
    'fulfillment_type', o.fulfillment_type,
    'delivery_address', o.delivery_address,
    'customer_reference_point', o.customer_reference_point,
    'customer_note', o.customer_note,
    'total', o.total,
    'status', o.status,
    'whatsapp_status', o.whatsapp_status,
    'payment_plan', o.payment_plan,
    'payment_method', o.payment_method,
    'payment_status', o.payment_status,
    'deposit_percentage', o.deposit_percentage,
    'amount_due_now', o.amount_due_now,
    'amount_paid', o.amount_paid,
    'balance_due', o.balance_due,
    'delivery_provider', o.delivery_provider,
    'delivery_quote_amount', o.delivery_quote_amount,
    'delivery_quote_currency', o.delivery_quote_currency,
    'delivery_quote_id', o.delivery_quote_id,
    'delivery_quote_expires_at', o.delivery_quote_expires_at,
    'delivery_eta_minutes', o.delivery_eta_minutes,
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
$function$;

revoke all on function public.create_deli_order_v34(jsonb,jsonb,text,timestamptz)
from public, anon, authenticated;

grant execute on function public.create_deli_order_v34(jsonb,jsonb,text,timestamptz)
to service_role;
