-- Performance Indices for ZeniPOS V1
-- Optimizes common JOIN operations and query patterns

-- Add index for order_items -> orders JOIN
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
  ON order_items(order_id);

-- Add index for order_items -> menu_items JOIN
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id 
  ON order_items(menu_item_id);

-- Composite index for KDS queries (status + created_at)
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
  ON orders(status, created_at DESC) 
  WHERE status IN ('pending', 'preparing');

-- Table-specific queries (table_id + status)
CREATE INDEX IF NOT EXISTS idx_orders_table_status 
  ON orders(table_id, status) 
  WHERE table_id IS NOT NULL;

-- Index for audit_log queries (actor + created_at)
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_created 
  ON audit_log(actor, created_at DESC);

-- Comments for documentation
COMMENT ON INDEX idx_orders_status_created IS 
  'Optimizes KDS pending order queries with time-based sorting';
COMMENT ON INDEX idx_orders_table_status IS 
  'Speeds up table status checks and table-specific order filtering';