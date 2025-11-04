-- Fix auto_update_table_status trigger to remove 'voided' enum reference
-- This was causing "invalid input value for enum order_status: 'voided'" errors

-- Drop trigger first, then function
DROP TRIGGER IF EXISTS trigger_auto_update_table_status ON orders;
DROP TRIGGER IF EXISTS auto_update_table_status_trigger ON orders;
DROP FUNCTION IF EXISTS auto_update_table_status() CASCADE;

-- Recreate function without 'voided' reference
CREATE OR REPLACE FUNCTION public.auto_update_table_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- When order is created with table_id, mark table as occupied
  IF TG_OP = 'INSERT' AND NEW.table_id IS NOT NULL THEN
    UPDATE tables 
    SET status = 'occupied' 
    WHERE id = NEW.table_id;
  END IF;
  
  -- When order is completed/cancelled, check if table can be freed
  -- FIXED: Removed 'voided' from status check (not a valid enum value)
  IF TG_OP = 'UPDATE' AND NEW.status IN ('done', 'cancelled', 'completed') THEN
    -- Check if there are any other active orders for this table
    IF NOT EXISTS (
      SELECT 1 FROM orders 
      WHERE table_id = NEW.table_id 
      AND status NOT IN ('done', 'cancelled', 'completed')
      AND id != NEW.id
    ) THEN
      UPDATE tables 
      SET status = 'available' 
      WHERE id = NEW.table_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate trigger
CREATE TRIGGER auto_update_table_status_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_table_status();