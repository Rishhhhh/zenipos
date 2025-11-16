-- Add ready_at timestamp column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;

-- Add index for auto-progression queries on ready orders
CREATE INDEX IF NOT EXISTS idx_orders_ready_at ON orders(ready_at) WHERE status = 'ready';

-- Add comment for documentation
COMMENT ON COLUMN orders.ready_at IS 'Timestamp when order was marked ready by kitchen (all items completed)';