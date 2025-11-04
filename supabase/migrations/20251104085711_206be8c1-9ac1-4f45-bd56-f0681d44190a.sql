-- Phase 1: Update RLS Policy for table status updates
DROP POLICY IF EXISTS "Staff can update table status" ON tables;
CREATE POLICY "Staff can update table status" ON tables
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Phase 2: Clean Up Stale Database Data
-- Fix t4: Has order but shows available
UPDATE tables 
SET status = 'occupied' 
WHERE label = 't4' AND current_order_id IS NOT NULL AND status = 'available';

-- Fix t5 and t99: No order but shows occupied
UPDATE tables 
SET status = 'available' 
WHERE label IN ('t5', 't99') AND current_order_id IS NULL AND status = 'occupied';

-- Fix any other tables with stale statuses
UPDATE tables 
SET status = 'occupied' 
WHERE current_order_id IS NOT NULL AND status = 'available';

UPDATE tables 
SET status = 'available' 
WHERE current_order_id IS NULL AND status = 'occupied';

-- Clean up orphaned delivered orders not on any table
UPDATE orders 
SET status = 'cancelled'
WHERE status = 'delivered' 
AND id NOT IN (
  SELECT current_order_id 
  FROM tables 
  WHERE current_order_id IS NOT NULL
)
AND created_at < NOW() - INTERVAL '2 hours';

-- Phase 3: Create Auto-Sync Trigger
CREATE OR REPLACE FUNCTION sync_table_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When order is assigned, mark table as occupied
  IF NEW.current_order_id IS NOT NULL AND OLD.current_order_id IS NULL THEN
    NEW.status := 'occupied';
  -- When order is cleared, mark table as available (unless manually reserved)
  ELSIF OLD.current_order_id IS NOT NULL AND NEW.current_order_id IS NULL THEN
    IF NEW.status != 'reserved' THEN
      NEW.status := 'available';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS sync_table_status_trigger ON tables;
CREATE TRIGGER sync_table_status_trigger
  BEFORE UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION sync_table_status();