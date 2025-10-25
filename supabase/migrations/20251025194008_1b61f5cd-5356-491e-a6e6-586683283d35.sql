-- ============================================
-- PHASE 5: LOYALTY, CUSTOMERS & CRM
-- ============================================

-- ============================================
-- 1. CUSTOMERS TABLE
-- ============================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  name TEXT,
  loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),
  total_spent NUMERIC(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  first_visit TIMESTAMPTZ DEFAULT NOW(),
  last_visit TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_points ON customers(loyalty_points DESC);
CREATE INDEX idx_customers_spent ON customers(total_spent DESC);

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all customers" ON customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage customers" ON customers
  FOR ALL TO authenticated USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'cashier')
  );

-- ============================================
-- 2. LOYALTY LEDGER (Points Transaction Log)
-- ============================================

CREATE TYPE loyalty_transaction_type AS ENUM (
  'earned',
  'redeemed',
  'bonus',
  'expired',
  'adjusted'
);

CREATE TABLE loyalty_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  transaction_type loyalty_transaction_type NOT NULL,
  points_delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  order_id UUID REFERENCES orders(id),
  reason TEXT,
  performed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_ledger_customer ON loyalty_ledger(customer_id, created_at DESC);
CREATE INDEX idx_loyalty_ledger_order ON loyalty_ledger(order_id);
CREATE INDEX idx_loyalty_ledger_type ON loyalty_ledger(transaction_type);

-- RLS
ALTER TABLE loyalty_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view all transactions" ON loyalty_ledger
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff insert transactions" ON loyalty_ledger
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- 3. LOYALTY RULES (Configuration)
-- ============================================

CREATE TABLE loyalty_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT UNIQUE NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('earn_rate', 'redeem_rate', 'min_redeem', 'max_redeem_percent', 'expiry_days')),
  rule_value NUMERIC NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO loyalty_rules (rule_name, rule_type, rule_value) VALUES
  ('earn_rate', 'earn_rate', 10),
  ('redeem_rate', 'redeem_rate', 100),
  ('min_redeem_points', 'min_redeem', 1000),
  ('max_redeem_percent', 'max_redeem_percent', 50),
  ('points_expiry_days', 'expiry_days', 365);

-- RLS
ALTER TABLE loyalty_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view active rules" ON loyalty_rules
  FOR SELECT USING (active = true);

CREATE POLICY "Admins manage rules" ON loyalty_rules
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION calculate_points_earned(amount NUMERIC)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT FLOOR(amount * (SELECT rule_value FROM loyalty_rules WHERE rule_name = 'earn_rate' LIMIT 1))::INTEGER;
$$;

CREATE OR REPLACE FUNCTION calculate_discount_from_points(points INTEGER)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT (points / (SELECT rule_value FROM loyalty_rules WHERE rule_name = 'redeem_rate' LIMIT 1))::NUMERIC(10,2);
$$;

CREATE OR REPLACE FUNCTION get_customer_loyalty_stats(customer_id_param UUID)
RETURNS TABLE (
  total_points_earned INTEGER,
  total_points_redeemed INTEGER,
  current_balance INTEGER,
  total_spent NUMERIC,
  total_orders INTEGER,
  avg_order_value NUMERIC,
  days_since_last_visit INTEGER
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    COALESCE(SUM(CASE WHEN transaction_type = 'earned' THEN points_delta ELSE 0 END), 0)::INTEGER as total_points_earned,
    COALESCE(ABS(SUM(CASE WHEN transaction_type = 'redeemed' THEN points_delta ELSE 0 END)), 0)::INTEGER as total_points_redeemed,
    (SELECT loyalty_points FROM customers WHERE id = customer_id_param) as current_balance,
    (SELECT total_spent FROM customers WHERE id = customer_id_param) as total_spent,
    (SELECT total_orders FROM customers WHERE id = customer_id_param) as total_orders,
    (SELECT total_spent / NULLIF(total_orders, 0) FROM customers WHERE id = customer_id_param) as avg_order_value,
    (SELECT EXTRACT(DAY FROM NOW() - last_visit)::INTEGER FROM customers WHERE id = customer_id_param) as days_since_last_visit
  FROM loyalty_ledger
  WHERE customer_id = customer_id_param;
$$;

CREATE OR REPLACE FUNCTION get_top_loyal_customers(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  loyalty_points INTEGER,
  total_spent NUMERIC,
  total_orders INTEGER,
  redemption_rate NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    c.id,
    c.name,
    c.phone,
    c.loyalty_points,
    c.total_spent,
    c.total_orders,
    CASE 
      WHEN c.total_spent > 0 THEN 
        (SELECT COALESCE(ABS(SUM(points_delta)), 0) FROM loyalty_ledger WHERE customer_id = c.id AND transaction_type = 'redeemed') / 
        (c.total_spent * 10) * 100
      ELSE 0 
    END as redemption_rate
  FROM customers c
  WHERE c.total_orders > 0
  ORDER BY c.total_spent DESC
  LIMIT limit_count;
$$;

CREATE OR REPLACE FUNCTION credit_loyalty_points(
  customer_id_param UUID,
  points_param INTEGER,
  order_id_param UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance INTEGER;
  order_total NUMERIC;
BEGIN
  SELECT total INTO order_total FROM orders WHERE id = order_id_param;
  
  UPDATE customers
  SET loyalty_points = loyalty_points + points_param,
      total_spent = total_spent + order_total,
      total_orders = total_orders + 1,
      last_visit = NOW(),
      updated_at = NOW()
  WHERE id = customer_id_param
  RETURNING loyalty_points INTO new_balance;
  
  INSERT INTO loyalty_ledger (
    customer_id,
    transaction_type,
    points_delta,
    balance_after,
    order_id,
    reason
  ) VALUES (
    customer_id_param,
    'earned',
    points_param,
    new_balance,
    order_id_param,
    'Points earned from purchase'
  );
END;
$$;

-- Update triggers
CREATE TRIGGER update_customers_updated_at 
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_rules_updated_at 
BEFORE UPDATE ON loyalty_rules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. SAMPLE DATA
-- ============================================

INSERT INTO customers (phone, email, name, loyalty_points, total_spent, total_orders, last_visit) VALUES
  ('+60123456789', 'ahmad@example.com', 'Ahmad Ibrahim', 2500, 450.00, 15, NOW() - INTERVAL '2 days'),
  ('+60129876543', 'siti@example.com', 'Siti Nurhaliza', 5000, 1200.00, 35, NOW() - INTERVAL '1 day'),
  ('+60167654321', 'tan@example.com', 'Tan Ah Kow', 1500, 320.00, 10, NOW() - INTERVAL '7 days');