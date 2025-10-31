-- Enhance payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tip_type TEXT; -- 'percentage', 'amount', 'none'
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gratuity_percentage NUMERIC(5,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS card_last_4 TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS card_brand TEXT; -- 'Visa', 'Mastercard', 'Amex'
ALTER TABLE payments ADD COLUMN IF NOT EXISTS approval_code TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS terminal_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS signature_data TEXT; -- Base64 signature
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_device TEXT; -- 'emv', 'nfc', 'apple_pay', 'google_pay'

-- Create payment_splits table
CREATE TABLE IF NOT EXISTS payment_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  split_number INTEGER NOT NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  items JSONB DEFAULT '[]'::jsonb, -- which items in this split
  seat_numbers INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  split_type TEXT DEFAULT 'custom', -- 'even', 'by_seat', 'by_item', 'custom'
  guest_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  CONSTRAINT unique_order_split UNIQUE(order_id, split_number)
);

-- Create open_tabs table
CREATE TABLE IF NOT EXISTS open_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES tables(id),
  order_id UUID REFERENCES orders(id),
  customer_name TEXT,
  pre_auth_amount NUMERIC(10,2),
  pre_auth_ref TEXT,
  card_last_4 TEXT,
  card_brand TEXT,
  current_balance NUMERIC(10,2) DEFAULT 0,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  opened_by UUID REFERENCES employees(id),
  status TEXT DEFAULT 'open', -- 'open', 'closed', 'transferred'
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES employees(id),
  transfer_notes TEXT
);

-- Enable RLS
ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_tabs ENABLE ROW LEVEL SECURITY;

-- Payment splits policies
CREATE POLICY "Staff can view payment splits"
ON payment_splits
FOR SELECT
USING (true);

CREATE POLICY "Staff can create payment splits"
ON payment_splits
FOR INSERT
WITH CHECK (
  created_by IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  )
);

-- Open tabs policies
CREATE POLICY "Staff can view open tabs"
ON open_tabs
FOR SELECT
USING (true);

CREATE POLICY "Staff can create open tabs"
ON open_tabs
FOR INSERT
WITH CHECK (
  opened_by IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Staff can update open tabs"
ON open_tabs
FOR UPDATE
USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_splits_order ON payment_splits(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_payment ON payment_splits(payment_id);
CREATE INDEX IF NOT EXISTS idx_open_tabs_table ON open_tabs(table_id);
CREATE INDEX IF NOT EXISTS idx_open_tabs_status ON open_tabs(status);
CREATE INDEX IF NOT EXISTS idx_open_tabs_order ON open_tabs(order_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE payment_splits;
ALTER PUBLICATION supabase_realtime ADD TABLE open_tabs;

-- Function to calculate tip pooling
CREATE OR REPLACE FUNCTION get_tip_report(
  start_date_param TIMESTAMPTZ,
  end_date_param TIMESTAMPTZ
)
RETURNS TABLE(
  employee_id UUID,
  employee_name TEXT,
  total_tips NUMERIC,
  cash_tips NUMERIC,
  card_tips NUMERIC,
  tip_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.id as employee_id,
    e.name as employee_name,
    COALESCE(SUM(p.tip_amount), 0) as total_tips,
    COALESCE(SUM(CASE WHEN p.method = 'cash' THEN p.tip_amount ELSE 0 END), 0) as cash_tips,
    COALESCE(SUM(CASE WHEN p.method != 'cash' THEN p.tip_amount ELSE 0 END), 0) as card_tips,
    COUNT(CASE WHEN p.tip_amount > 0 THEN 1 END) as tip_count
  FROM employees e
  LEFT JOIN orders o ON o.created_by = e.auth_user_id
  LEFT JOIN payments p ON p.order_id = o.id
  WHERE p.created_at >= start_date_param
    AND p.created_at <= end_date_param
    AND p.status = 'completed'
  GROUP BY e.id, e.name
  ORDER BY total_tips DESC;
$$;

-- Function to close expired tabs
CREATE OR REPLACE FUNCTION close_expired_tabs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  closed_count INTEGER := 0;
BEGIN
  -- Close tabs open for more than 8 hours
  UPDATE open_tabs
  SET 
    status = 'closed',
    closed_at = NOW()
  WHERE status = 'open'
    AND opened_at < NOW() - INTERVAL '8 hours'
  RETURNING 1 INTO closed_count;
  
  RETURN COALESCE(closed_count, 0);
END;
$$;