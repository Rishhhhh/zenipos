-- Malaysian POS System: E-Invoice, Hardware, Till Management

-- E-Invoice documents table (LHDN MyInvois)
CREATE TABLE einvoice_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Invoice', 'Credit Note', 'Debit Note', 'Refund', 'Self-Billed Invoice')),
  invoice_number TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitting', 'validated', 'rejected', 'cancelled', 'queued')),
  uuid TEXT,
  long_id TEXT,
  uin TEXT,
  qr_url TEXT,
  error_json JSONB,
  buyer_tin TEXT,
  mode TEXT NOT NULL DEFAULT 'b2c' CHECK (mode IN ('b2b', 'b2c')),
  submitted_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_einvoice_order ON einvoice_docs(order_id);
CREATE INDEX idx_einvoice_status ON einvoice_docs(status);
CREATE INDEX idx_einvoice_uuid ON einvoice_docs(uuid);
CREATE INDEX idx_einvoice_mode ON einvoice_docs(mode, created_at);

-- B2C Consolidation buckets
CREATE TABLE b2c_consolidation_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL,
  branch_id UUID REFERENCES branches(id),
  outlet_name TEXT NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_amount NUMERIC(10,2) DEFAULT 0,
  total_tax NUMERIC(10,2) DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  uuid TEXT,
  qr_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'validated', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, branch_id)
);

CREATE INDEX idx_consolidation_month ON b2c_consolidation_buckets(month, status);

-- Hardware devices
CREATE TABLE hardware_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  device_type TEXT NOT NULL CHECK (device_type IN ('coin_acceptor', 'bill_validator', 'hopper', 'drawer')),
  protocol TEXT NOT NULL CHECK (protocol IN ('mdb', 'cctalk', 'serial')),
  serial_port TEXT,
  device_address INTEGER,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error', 'jam', 'low')),
  last_seen TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hardware hoppers
CREATE TABLE hardware_hoppers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES hardware_devices(id) ON DELETE CASCADE,
  denomination NUMERIC(10,2) NOT NULL,
  capacity INTEGER NOT NULL,
  current_level INTEGER DEFAULT 0,
  low_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hopper_device ON hardware_hoppers(device_id);

-- Till sessions
CREATE TABLE till_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  shift_id UUID REFERENCES shifts(id),
  branch_id UUID REFERENCES branches(id),
  opening_float NUMERIC(10,2) NOT NULL DEFAULT 0,
  closing_float NUMERIC(10,2),
  expected_cash NUMERIC(10,2),
  actual_cash NUMERIC(10,2),
  variance NUMERIC(10,2),
  variance_reason TEXT,
  blind_close_photo TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'reconciled')),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_till_session_employee ON till_sessions(employee_id, status);
CREATE INDEX idx_till_session_shift ON till_sessions(shift_id);

-- Till ledger
CREATE TABLE till_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  till_session_id UUID REFERENCES till_sessions(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'change_given', 'payout', 'float_adjustment', 'hopper_refill', 'hopper_payout')),
  amount NUMERIC(10,2) NOT NULL,
  order_id UUID REFERENCES orders(id),
  payment_id UUID REFERENCES payments(id),
  denomination_breakdown JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ledger_session ON till_ledger(till_session_id, created_at);
CREATE INDEX idx_ledger_type ON till_ledger(transaction_type);

-- Cash float events
CREATE TABLE cash_float_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  till_session_id UUID REFERENCES till_sessions(id) ON DELETE CASCADE,
  hopper_id UUID REFERENCES hardware_hoppers(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('inserted', 'dispensed', 'refilled', 'jam', 'low_level', 'error')),
  denomination NUMERIC(10,2),
  quantity INTEGER,
  running_balance INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_float_event_session ON cash_float_events(till_session_id, created_at);

-- Add SST tax configuration to menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sst_rate NUMERIC(5,4) DEFAULT 0.06;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sst_exempted BOOLEAN DEFAULT false;

-- Update system_config for MyInvois
INSERT INTO system_config (key, value, description)
VALUES 
  ('myinvois', '{"enabled": false, "environment": "preprod", "client_id": "", "client_secret": "", "supplier_tin": "", "auto_b2c_consolidation": true, "consolidation_day": 7}'::jsonb, 'LHDN MyInvois e-Invoice configuration'),
  ('hardware', '{"enabled": false, "protocol": "mdb", "coin_denominations": [0.05, 0.10, 0.20, 0.50], "bill_denominations": [1, 5, 10, 20, 50, 100]}'::jsonb, 'Cash hardware configuration'),
  ('till_management', '{"variance_threshold": 5.00, "require_photo_proof": true, "auto_reconcile": false}'::jsonb, 'Till management settings')
ON CONFLICT (key) DO NOTHING;

-- RLS Policies
ALTER TABLE einvoice_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2c_consolidation_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_hoppers ENABLE ROW LEVEL SECURITY;
ALTER TABLE till_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE till_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_float_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view einvoices" ON einvoice_docs FOR SELECT USING (true);
CREATE POLICY "System creates einvoices" ON einvoice_docs FOR INSERT WITH CHECK (true);
CREATE POLICY "System updates einvoices" ON einvoice_docs FOR UPDATE USING (true);

CREATE POLICY "Managers view consolidation" ON b2c_consolidation_buckets FOR SELECT 
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
CREATE POLICY "System manages consolidation" ON b2c_consolidation_buckets FOR ALL USING (true);

CREATE POLICY "Staff view hardware" ON hardware_devices FOR SELECT USING (true);
CREATE POLICY "Admins manage hardware" ON hardware_devices FOR ALL 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff view hoppers" ON hardware_hoppers FOR SELECT USING (true);
CREATE POLICY "System updates hoppers" ON hardware_hoppers FOR UPDATE USING (true);

CREATE POLICY "Employee views own till sessions" ON till_sessions FOR SELECT 
  USING (employee_id IN (
    SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Employee creates till sessions" ON till_sessions FOR INSERT 
  WITH CHECK (employee_id IN (
    SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Employee updates own till sessions" ON till_sessions FOR UPDATE 
  USING (employee_id IN (
    SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "View till ledger with session access" ON till_ledger FOR SELECT 
  USING (till_session_id IN (
    SELECT id FROM till_sessions WHERE 
      employee_id IN (SELECT employee_id FROM user_roles WHERE user_id = auth.uid())
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'manager')
  ));

CREATE POLICY "System inserts till ledger" ON till_ledger FOR INSERT WITH CHECK (true);

CREATE POLICY "View cash float events with session access" ON cash_float_events FOR SELECT 
  USING (till_session_id IN (
    SELECT id FROM till_sessions WHERE 
      employee_id IN (SELECT employee_id FROM user_roles WHERE user_id = auth.uid())
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'manager')
  ));

CREATE POLICY "System inserts cash float events" ON cash_float_events FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_einvoice_updated_at BEFORE UPDATE ON einvoice_docs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consolidation_updated_at BEFORE UPDATE ON b2c_consolidation_buckets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hardware_device_updated_at BEFORE UPDATE ON hardware_devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hopper_updated_at BEFORE UPDATE ON hardware_hoppers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_till_session_updated_at BEFORE UPDATE ON till_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();