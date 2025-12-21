-- Add columns for enhanced customer display during table payment flow
ALTER TABLE customer_display_sessions 
ADD COLUMN IF NOT EXISTS order_items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id);