-- Create SECURITY DEFINER function to bypass RLS for KDS queries
-- This ensures KDS can see all orders regardless of user role
DROP FUNCTION IF EXISTS public.get_kds_orders();

CREATE FUNCTION public.get_kds_orders()
RETURNS TABLE(
  id uuid,
  session_id text,
  order_type text,
  status text,
  total numeric,
  created_at timestamptz,
  recall_requested boolean,
  table_id uuid,
  table_label text,
  organization_id uuid,
  branch_id uuid,
  order_items jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.session_id,
    o.order_type,
    o.status,
    o.total,
    o.created_at,
    o.recall_requested,
    o.table_id,
    t.label as table_label,
    o.organization_id,
    o.branch_id,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'notes', oi.notes,
          'menu_items', jsonb_build_object(
            'name', mi.name,
            'sku', mi.sku
          )
        )
      )
      FROM order_items oi
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = o.id
    ) as order_items
  FROM orders o
  LEFT JOIN tables t ON o.table_id = t.id
  WHERE o.status IN ('kitchen_queue', 'pending', 'preparing')
  ORDER BY o.created_at ASC;
END;
$function$;

COMMENT ON FUNCTION public.get_kds_orders IS 
  'Returns all orders in kitchen queue/pending/preparing status with related data. Uses SECURITY DEFINER to bypass RLS for KDS access.';
