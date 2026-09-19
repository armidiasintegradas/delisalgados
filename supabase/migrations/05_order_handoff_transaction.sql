-- ====================================================================
-- DELI SALGADOS MIGRATION 05: ORDER HANDOFF & TRANSACTIONAL RPC
-- ====================================================================

-- 1. Add handoff security token columns to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS handoff_token_hash TEXT,
ADD COLUMN IF NOT EXISTS handoff_token_expires_at TIMESTAMPTZ;

-- 2. Ensure public_code uniqueness and composite index for secure lookup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_public_code_key'
  ) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_public_code_key UNIQUE (public_code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_handoff_lookup 
ON public.orders (public_code, handoff_token_hash);

-- 3. Atomic Transactional RPC for Order Creation
-- This function receives pre-calculated, server-validated order and item JSONB payloads,
-- atomically consumes the next sequence code, creates the order and all items,
-- and returns the full created order with its items in a single PostgreSQL transaction.
CREATE OR REPLACE FUNCTION public.create_deli_order_v34(
  p_order JSONB,
  p_items JSONB,
  p_token_hash TEXT,
  p_token_expires_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_public_code TEXT;
  v_item JSONB;
  v_result JSONB;
BEGIN
  -- Generate order UUID
  v_order_id := COALESCE((p_order->>'id')::UUID, gen_random_uuid());
  
  -- Monotonically and concurrently consume next public code from sequence
  v_public_code := next_order_public_code();

  -- Insert order record
  INSERT INTO public.orders (
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
  ) VALUES (
    v_order_id,
    v_public_code,
    p_order->>'customer_name',
    p_order->>'customer_phone',
    (p_order->>'desired_date')::DATE,
    (p_order->>'fulfillment_type')::fulfillment_type,
    p_order->>'delivery_address',
    p_order->>'customer_note',
    (p_order->>'total')::DECIMAL(10, 2),
    'generated',
    'pending',
    p_token_hash,
    p_token_expires_at,
    NOW(),
    NOW()
  );

  -- Insert each order item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
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
    ) VALUES (
      COALESCE((v_item->>'id')::UUID, gen_random_uuid()),
      v_order_id,
      (v_item->>'product_id')::UUID,
      CASE WHEN v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' != '' 
           THEN (v_item->>'variant_id')::UUID 
           ELSE NULL 
      END,
      v_item->>'product_name_snapshot',
      v_item->>'variant_name_snapshot',
      v_item->>'unit_label_snapshot',
      (v_item->>'unit_price_snapshot')::DECIMAL(10, 2),
      (v_item->>'quantity')::INTEGER,
      (v_item->>'subtotal')::DECIMAL(10, 2),
      v_item->>'note'
    );
  END LOOP;

  -- Build and return JSON representation of the complete order
  SELECT jsonb_build_object(
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
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
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
      )), '[]'::jsonb)
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    )
  ) INTO v_result
  FROM public.orders o
  WHERE o.id = v_order_id;

  RETURN v_result;
END;
$$;

-- 4. Grant execution permissions to authenticated & service_role
GRANT EXECUTE ON FUNCTION public.create_deli_order_v34(JSONB, JSONB, TEXT, TIMESTAMPTZ) TO service_role;
