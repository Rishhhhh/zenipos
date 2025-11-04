-- Phase 1: Database Schema Updates for Order Flow
-- Add new order statuses: delivered and paid
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'delivered';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'paid';

-- Add timestamp tracking to orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_by UUID REFERENCES employees(id);

-- Add current order tracking to tables
ALTER TABLE tables 
  ADD COLUMN IF NOT EXISTS current_order_id UUID REFERENCES orders(id),
  ADD COLUMN IF NOT EXISTS seated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivered_by ON orders(delivered_by);
CREATE INDEX IF NOT EXISTS idx_tables_current_order_id ON tables(current_order_id);
CREATE INDEX IF NOT EXISTS idx_tables_last_order_at ON tables(last_order_at);

-- Add comment for documentation
COMMENT ON COLUMN orders.delivered_at IS 'When food was delivered to customer (KDS bumped)';
COMMENT ON COLUMN orders.paid_at IS 'When customer completed payment';
COMMENT ON COLUMN orders.delivered_by IS 'Employee who delivered/bumped the order';
COMMENT ON COLUMN tables.current_order_id IS 'Active order for this table (unpaid)';
COMMENT ON COLUMN tables.seated_at IS 'When customers were seated at this table';
COMMENT ON COLUMN tables.last_order_at IS 'Last order timestamp for analytics';