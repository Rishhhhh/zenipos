-- Phase 2: Restore auto_route_order_items trigger
-- This trigger automatically populates station_id and prep_time_actual on order_items

CREATE OR REPLACE FUNCTION public.auto_route_order_items()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Get station from menu item if not already set
  IF NEW.station_id IS NULL THEN
    SELECT mi.station_id, mi.prep_time_minutes
    INTO NEW.station_id, NEW.prep_time_actual
    FROM menu_items mi
    WHERE mi.id = NEW.menu_item_id;
    
    -- Convert prep time to seconds
    NEW.prep_time_actual := COALESCE(NEW.prep_time_actual, 10) * 60;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_route_order_items_trigger ON order_items;

-- Create trigger on order_items
CREATE TRIGGER auto_route_order_items_trigger
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION auto_route_order_items();

-- Phase 3: Fix status consistency - set default status for order_items
ALTER TABLE order_items 
  ALTER COLUMN status SET DEFAULT 'kitchen_queue';

-- Backfill existing order_items with correct station_id and prep_time
UPDATE order_items oi
SET 
  station_id = COALESCE(oi.station_id, mi.station_id),
  prep_time_actual = COALESCE(oi.prep_time_actual, mi.prep_time_minutes * 60)
FROM menu_items mi
WHERE oi.menu_item_id = mi.id
  AND (oi.station_id IS NULL OR oi.prep_time_actual IS NULL);

-- Backfill order_items status to match parent order status
UPDATE order_items oi
SET status = o.status
FROM orders o
WHERE oi.order_id = o.id
  AND oi.status = 'pending'
  AND o.status IN ('preparing', 'kitchen_queue');

-- Grant permissions for get_kds_orders RPC
ALTER FUNCTION public.get_kds_orders() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_kds_orders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kds_orders() TO anon;