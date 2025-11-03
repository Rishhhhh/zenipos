-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_tab_on_order ON orders;

-- Create trigger to auto-update open tab balance when orders change
CREATE OR REPLACE FUNCTION update_tab_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE open_tabs 
  SET 
    current_balance = (
      SELECT COALESCE(SUM(total), 0)
      FROM orders
      WHERE table_id = NEW.table_id 
        AND status NOT IN ('cancelled', 'paid')
        AND (open_tab_id = open_tabs.id OR open_tab_id IS NULL)
    ),
    updated_at = NOW()
  WHERE table_id = NEW.table_id AND status = 'open';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_tab_on_order
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW 
WHEN (NEW.table_id IS NOT NULL)
EXECUTE FUNCTION update_tab_balance();