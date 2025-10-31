-- Add trigger to update open_tabs current_balance when orders are added
CREATE OR REPLACE FUNCTION update_tab_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE open_tabs 
  SET current_balance = (
    SELECT COALESCE(SUM(total), 0)
    FROM orders
    WHERE table_id = NEW.table_id 
      AND status != 'cancelled'
      AND (open_tab_id = open_tabs.id OR open_tab_id IS NULL)
  )
  WHERE table_id = NEW.table_id AND status = 'open';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tab_on_order
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW 
WHEN (NEW.status != 'cancelled')
EXECUTE FUNCTION update_tab_balance();

-- Add columns to payments table for enhanced card payment support
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tip_type TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gratuity_percentage NUMERIC(5,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS card_last_4 TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS card_brand TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS approval_code TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS terminal_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS signature_data TEXT;

-- Create approval escalation rules table
CREATE TABLE IF NOT EXISTS approval_escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  timeout_minutes INTEGER DEFAULT 30,
  escalate_to_role app_role,
  notify_channels TEXT[] DEFAULT ARRAY['app', 'push'],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create approval rules table for multi-level approvals
CREATE TABLE IF NOT EXISTS approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  min_approver_role app_role NOT NULL,
  amount_threshold NUMERIC(10,2),
  requires_two_approvals BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default approval rules (using valid app_role enum values: cashier, manager, admin)
INSERT INTO approval_rules (action_type, min_approver_role, amount_threshold, requires_two_approvals) VALUES
  ('void_item', 'manager', 50, false),
  ('void_item', 'manager', 200, false),
  ('void_item', 'admin', 500, true),
  ('refund', 'manager', NULL, false),
  ('discount', 'manager', 50, false),
  ('discount', 'admin', 200, false),
  ('close_shift', 'manager', NULL, false)
ON CONFLICT DO NOTHING;

-- Add PIN rotation tracking
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pin_rotation_days INTEGER DEFAULT 90;

-- Enable RLS on new tables
ALTER TABLE approval_escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for approval rules
CREATE POLICY "Allow public read approval_rules" ON approval_rules FOR SELECT USING (true);
CREATE POLICY "Admins manage approval_rules" ON approval_rules FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Allow public read escalation_rules" ON approval_escalation_rules FOR SELECT USING (true);
CREATE POLICY "Admins manage escalation_rules" ON approval_escalation_rules FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin'
  ));