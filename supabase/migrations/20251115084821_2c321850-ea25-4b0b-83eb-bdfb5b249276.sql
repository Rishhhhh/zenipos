-- Add 'ready' status to order_status enum (missing from previous migration)
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ready';

-- Add comment
COMMENT ON TYPE order_status IS 'Order status flow: kitchen_queue → preparing → ready → serving → dining → payment → completed';