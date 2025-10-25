-- Promotion types enum
CREATE TYPE promotion_type AS ENUM (
  'BUY_X_GET_Y',
  'PERCENT_OFF',
  'TIME_RANGE_DISCOUNT',
  'HAPPY_HOUR'
);

-- Promotions table
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type promotion_type NOT NULL,
  active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  priority INTEGER DEFAULT 0,
  stackable BOOLEAN DEFAULT false,
  rules JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotion usage tracking
CREATE TABLE promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount NUMERIC NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add promotion tracking to orders
ALTER TABLE orders ADD COLUMN applied_promotions JSONB DEFAULT '[]';

-- Indexes for performance
CREATE INDEX idx_promotions_active ON promotions(active, start_date, end_date);
CREATE INDEX idx_promotions_type ON promotions(type) WHERE active = true;
CREATE INDEX idx_promotion_usage_order ON promotion_usage(order_id);

-- RLS policies
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active promotions" ON promotions
  FOR SELECT USING (active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));

CREATE POLICY "Authenticated users can manage promotions" ON promotions
  FOR ALL TO authenticated USING (true);

ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view usage" ON promotion_usage
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert usage" ON promotion_usage
  FOR INSERT TO authenticated WITH CHECK (true);

-- Update trigger for promotions
CREATE TRIGGER update_promotions_updated_at 
BEFORE UPDATE ON promotions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample promotions
INSERT INTO promotions (name, description, type, rules, active, priority) VALUES
  ('Happy Hour', '20% off all orders 9 PM - 11 PM', 'HAPPY_HOUR', 
   '{"start_time": "21:00", "end_time": "23:00", "discount_percent": 20}'::jsonb, true, 10),
  ('Buy 2 Get 1 Free', 'Buy 2 items, get cheapest free', 'BUY_X_GET_Y',
   '{"buy_quantity": 2, "get_quantity": 1, "discount_type": "cheapest_free"}'::jsonb, true, 5),
  ('Weekend Special', '15% off on weekends', 'TIME_RANGE_DISCOUNT',
   '{"days": [0, 6], "discount_percent": 15}'::jsonb, true, 3);