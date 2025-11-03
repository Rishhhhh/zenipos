-- Week 1 Quick Wins: Table System & E-Invoice Schema Updates

-- Add NFC card tracking to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS nfc_card_id uuid,
ADD COLUMN IF NOT EXISTS einvoice_enabled boolean DEFAULT false;

-- Add foreign key constraint for NFC cards
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_nfc_card 
FOREIGN KEY (nfc_card_id) 
REFERENCES nfc_cards(id) 
ON DELETE SET NULL;

-- Create function to auto-update table status
CREATE OR REPLACE FUNCTION auto_update_table_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When order is created with table_id, mark table as occupied
  IF TG_OP = 'INSERT' AND NEW.table_id IS NOT NULL THEN
    UPDATE tables 
    SET status = 'occupied' 
    WHERE id = NEW.table_id;
  END IF;
  
  -- When order is completed/cancelled, check if table can be freed
  IF TG_OP = 'UPDATE' AND NEW.status IN ('done', 'cancelled', 'voided') THEN
    -- Check if there are any other active orders for this table
    IF NOT EXISTS (
      SELECT 1 FROM orders 
      WHERE table_id = NEW.table_id 
      AND status NOT IN ('done', 'cancelled', 'voided')
      AND id != NEW.id
    ) THEN
      UPDATE tables 
      SET status = 'available' 
      WHERE id = NEW.table_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_update_table_status ON orders;

-- Create trigger for automatic table status updates
CREATE TRIGGER trigger_auto_update_table_status
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION auto_update_table_status();