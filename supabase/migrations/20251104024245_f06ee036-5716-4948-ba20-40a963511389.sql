-- Fix auto_route_order_items trigger to remove timestamp type mismatch
-- fire_time (TIMESTAMPTZ) should NOT be set from course_sequence (INTEGER)

CREATE OR REPLACE FUNCTION public.auto_route_order_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- fire_time should be set by KDS logic when firing items, not here
  -- Leave it NULL on insert
  
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION auto_route_order_items IS 'Auto-assigns station and prep time from menu item. fire_time is managed by KDS separately.';