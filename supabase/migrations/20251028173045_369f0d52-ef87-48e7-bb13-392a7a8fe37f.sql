-- Add 'completed' and 'paid' status values to order_status enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'paid';