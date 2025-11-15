-- Phase 1a: Add new order status enum values only
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'kitchen_queue';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'serving';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'dining';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment';