-- Phase 1b: Add timestamp columns and performance indexes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS serving_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dining_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_initiated_at TIMESTAMPTZ;

-- Add performance indexes for the new flow
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
  ON orders(status, created_at DESC)
  WHERE status NOT IN ('cancelled', 'completed');

CREATE INDEX IF NOT EXISTS idx_orders_kitchen_queue 
  ON orders(created_at)
  WHERE status = 'kitchen_queue';

CREATE INDEX IF NOT EXISTS idx_orders_serving_at 
  ON orders(serving_at)
  WHERE status = 'serving';

CREATE INDEX IF NOT EXISTS idx_orders_dining_at 
  ON orders(dining_at)
  WHERE status = 'dining';

CREATE INDEX IF NOT EXISTS idx_orders_payment_initiated 
  ON orders(payment_initiated_at)
  WHERE status = 'payment';

-- Add helpful comments
COMMENT ON COLUMN orders.serving_at IS 'Timestamp when order status changed to serving';
COMMENT ON COLUMN orders.dining_at IS 'Timestamp when order status changed to dining';
COMMENT ON COLUMN orders.payment_initiated_at IS 'Timestamp when payment modal was opened';