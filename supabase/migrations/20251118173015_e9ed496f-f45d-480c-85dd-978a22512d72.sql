-- Phase 4: KDS Debug RPCs for Admin Panel

-- RPC: Get item counts by station (including NULL)
CREATE OR REPLACE FUNCTION public.get_items_by_station_debug()
RETURNS TABLE (
  station_id uuid,
  station_name text,
  item_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    oi.station_id,
    s.name as station_name,
    COUNT(*) as item_count
  FROM order_items oi
  LEFT JOIN stations s ON s.id = oi.station_id
  WHERE oi.created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY oi.station_id, s.name
  ORDER BY item_count DESC;
$$;

-- RPC: Get item counts by status
CREATE OR REPLACE FUNCTION public.get_items_by_status_debug()
RETURNS TABLE (
  status text,
  item_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(status, 'null') as status,
    COUNT(*) as item_count
  FROM order_items
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY status
  ORDER BY item_count DESC;
$$;

-- RPC: Check if trigger exists and is enabled
CREATE OR REPLACE FUNCTION public.check_kds_trigger_exists()
RETURNS TABLE (
  trigger_name text,
  enabled boolean,
  event text,
  function_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tgname::text as trigger_name,
    tgenabled = 'O' as enabled,
    CASE tgtype::int & 66
      WHEN 2 THEN 'BEFORE'
      WHEN 64 THEN 'INSTEAD OF'
      ELSE 'AFTER'
    END as event,
    p.proname::text as function_name
  FROM pg_trigger t
  JOIN pg_proc p ON t.tgfoid = p.oid
  WHERE t.tgname = 'auto_route_order_items_trigger'
    AND t.tgrelid = 'order_items'::regclass;
$$;

-- Grant permissions to authenticated users (managers/admins)
GRANT EXECUTE ON FUNCTION public.get_items_by_station_debug() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_items_by_status_debug() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_kds_trigger_exists() TO authenticated;