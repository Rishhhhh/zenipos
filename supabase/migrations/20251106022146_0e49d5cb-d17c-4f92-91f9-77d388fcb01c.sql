-- Add cart data columns to customer_display_sessions
ALTER TABLE customer_display_sessions
  ADD COLUMN IF NOT EXISTS cart_items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_qr TEXT,
  ADD COLUMN IF NOT EXISTS change NUMERIC(10,2);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_display_sessions_pos_session 
  ON customer_display_sessions(pos_session_id);

CREATE INDEX IF NOT EXISTS idx_customer_display_sessions_last_activity 
  ON customer_display_sessions(last_activity DESC);

-- Add comment for documentation
COMMENT ON TABLE customer_display_sessions IS 
  'Stores real-time customer display state including cart, totals, and payment info';