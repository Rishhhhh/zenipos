-- Add open_tab_id column to orders table
-- This links orders to open tabs for tab tracking functionality

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS open_tab_id uuid REFERENCES open_tabs(id) ON DELETE SET NULL;

-- Add index for performance on tab balance calculations
CREATE INDEX IF NOT EXISTS idx_orders_open_tab_id ON orders(open_tab_id);

COMMENT ON COLUMN orders.open_tab_id IS 'Links order to an open tab for tab tracking';