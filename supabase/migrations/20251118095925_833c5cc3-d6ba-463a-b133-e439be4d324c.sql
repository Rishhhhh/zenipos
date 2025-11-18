-- PHASE 4 COMPLETION: Update RPC Functions Only

-- Update create_order_with_items RPC Function
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_session_id uuid,
  p_table_id uuid,
  p_order_type order_type,
  p_nfc_card_id uuid,
  p_branch_id uuid,
  p_subtotal numeric,
  p_tax numeric,
  p_discount numeric,
  p_total numeric,
  p_applied_promotions jsonb,
  p_created_by uuid,
  p_metadata jsonb,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_organization_id uuid;
BEGIN
  SELECT organization_id INTO v_organization_id
  FROM branches WHERE id = p_branch_id AND active = true;
  
  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Invalid branch_id: %', p_branch_id;
  END IF;

  INSERT INTO orders (session_id, table_id, order_type, nfc_card_id, organization_id, branch_id, status, subtotal, tax, discount, total, applied_promotions, created_by, metadata)
  VALUES (p_session_id, p_table_id, p_order_type, p_nfc_card_id, v_organization_id, p_branch_id, 'kitchen_queue'::order_status, p_subtotal, p_tax, p_discount, p_total, p_applied_promotions, p_created_by, p_metadata)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, notes, modifiers, organization_id)
    VALUES (v_order_id, (v_item->>'menu_item_id')::uuid, (v_item->>'quantity')::integer, (v_item->>'unit_price')::numeric, v_item->>'notes', COALESCE(v_item->'modifiers', '[]'::jsonb), v_organization_id);
  END LOOP;

  INSERT INTO audit_log (actor, action, entity, entity_id, diff)
  VALUES (p_created_by, 'create_order', 'orders', v_order_id, jsonb_build_object('items', jsonb_array_length(p_items), 'total', p_total, 'organization_id', v_organization_id));

  RETURN jsonb_build_object('order_id', v_order_id, 'status', 'kitchen_queue');
END;
$function$;

-- Update get_sales_by_hour
CREATE OR REPLACE FUNCTION public.get_sales_by_hour(start_date timestamptz, end_date timestamptz, _organization_id uuid DEFAULT NULL, _branch_id uuid DEFAULT NULL)
RETURNS TABLE(hour integer, total_sales numeric, order_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT EXTRACT(HOUR FROM created_at)::INT as hour, COALESCE(SUM(total), 0) as total_sales, COUNT(*)::BIGINT as order_count
  FROM orders WHERE created_at >= start_date AND created_at <= end_date AND status IN ('completed', 'paid')
  AND (_organization_id IS NULL OR organization_id = _organization_id) AND (_branch_id IS NULL OR branch_id = _branch_id)
  GROUP BY EXTRACT(HOUR FROM created_at) ORDER BY hour;
$function$;

-- Update get_top_selling_items
CREATE OR REPLACE FUNCTION public.get_top_selling_items(start_date timestamptz, end_date timestamptz, _organization_id uuid DEFAULT NULL, _branch_id uuid DEFAULT NULL, item_limit integer DEFAULT 10)
RETURNS TABLE(item_name text, quantity_sold bigint, total_revenue numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT mi.name, SUM(oi.quantity)::BIGINT, SUM(oi.quantity * oi.unit_price)
  FROM order_items oi JOIN menu_items mi ON mi.id = oi.menu_item_id JOIN orders o ON o.id = oi.order_id
  WHERE o.created_at >= start_date AND o.created_at <= end_date AND o.status IN ('completed', 'paid')
  AND (_organization_id IS NULL OR oi.organization_id = _organization_id) AND (_branch_id IS NULL OR o.branch_id = _branch_id)
  GROUP BY mi.name ORDER BY SUM(oi.quantity) DESC LIMIT item_limit;
$function$;

-- Update calculate_cogs
CREATE OR REPLACE FUNCTION public.calculate_cogs(start_date timestamptz, end_date timestamptz, _organization_id uuid DEFAULT NULL, _branch_id uuid DEFAULT NULL)
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT COALESCE(SUM(oi.quantity * COALESCE(mi.cost, 0)), 0)
  FROM order_items oi JOIN menu_items mi ON mi.id = oi.menu_item_id JOIN orders o ON o.id = oi.order_id
  WHERE o.created_at >= start_date AND o.created_at <= end_date AND o.status IN ('completed', 'paid')
  AND (_organization_id IS NULL OR oi.organization_id = _organization_id) AND (_branch_id IS NULL OR o.branch_id = _branch_id);
$function$;