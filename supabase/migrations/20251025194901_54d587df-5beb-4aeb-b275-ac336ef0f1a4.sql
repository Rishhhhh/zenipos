-- ============================================
-- 1. SHIFTS TABLE (Clock In/Out Tracking)
-- ============================================

CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  clock_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out_at TIMESTAMPTZ,
  break_minutes INTEGER DEFAULT 0,
  notes TEXT,
  
  -- Summary fields (calculated on clock-out)
  total_hours NUMERIC(5,2),
  orders_processed INTEGER DEFAULT 0,
  total_sales NUMERIC(10,2) DEFAULT 0,
  voids_count INTEGER DEFAULT 0,
  refunds_count INTEGER DEFAULT 0,
  discounts_given NUMERIC(10,2) DEFAULT 0,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending_review')),
  closed_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shifts_employee ON shifts(employee_id, clock_in_at DESC);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_date ON shifts(clock_in_at);

-- RLS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees view own shifts" ON shifts
  FOR SELECT USING (
    user_id = auth.uid() OR
    employee_id IN (
      SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can clock in" ON shifts
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() OR
    employee_id IN (
      SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employees update own shifts" ON shifts
  FOR UPDATE USING (
    status = 'active' AND (
      user_id = auth.uid() OR
      employee_id IN (
        SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Managers manage all shifts" ON shifts
  FOR ALL TO authenticated USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );

-- ============================================
-- 2. EMPLOYEES TABLE UPDATES
-- ============================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pay_rate NUMERIC(10,2);

CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

CREATE TRIGGER update_employees_updated_at 
BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_active_shift(employee_id_param UUID)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM shifts
  WHERE employee_id = employee_id_param 
    AND status = 'active'
    AND clock_out_at IS NULL
  ORDER BY clock_in_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION close_shift(shift_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  shift_record RECORD;
  hours_worked NUMERIC;
  orders_count INTEGER;
  sales_total NUMERIC;
  void_count INTEGER;
  refund_count INTEGER;
  discount_total NUMERIC;
BEGIN
  SELECT * INTO shift_record FROM shifts WHERE id = shift_id_param;
  
  IF shift_record.clock_out_at IS NULL THEN
    RAISE EXCEPTION 'Shift has not been clocked out';
  END IF;
  
  hours_worked := EXTRACT(EPOCH FROM (shift_record.clock_out_at - shift_record.clock_in_at)) / 3600.0 
                  - (COALESCE(shift_record.break_minutes, 0) / 60.0);
  
  SELECT COUNT(*), COALESCE(SUM(total), 0)
  INTO orders_count, sales_total
  FROM orders
  WHERE created_by = shift_record.user_id
    AND created_at BETWEEN shift_record.clock_in_at AND shift_record.clock_out_at;
  
  SELECT COUNT(*)
  INTO void_count
  FROM audit_log
  WHERE actor = shift_record.user_id
    AND action = 'void_item'
    AND created_at BETWEEN shift_record.clock_in_at AND shift_record.clock_out_at;
  
  SELECT COALESCE(SUM(discount), 0)
  INTO discount_total
  FROM orders
  WHERE created_by = shift_record.user_id
    AND created_at BETWEEN shift_record.clock_in_at AND shift_record.clock_out_at;
  
  UPDATE shifts
  SET 
    total_hours = hours_worked,
    orders_processed = orders_count,
    total_sales = sales_total,
    voids_count = void_count,
    refunds_count = 0,
    discounts_given = discount_total,
    status = 'closed',
    updated_at = NOW()
  WHERE id = shift_id_param;
END;
$$;

CREATE OR REPLACE FUNCTION get_shift_summary(shift_id_param UUID)
RETURNS TABLE (
  employee_name TEXT,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  hours_worked NUMERIC,
  orders INTEGER,
  sales NUMERIC,
  voids INTEGER,
  refunds INTEGER,
  discounts NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    e.name as employee_name,
    s.clock_in_at as clock_in,
    s.clock_out_at as clock_out,
    s.total_hours as hours_worked,
    s.orders_processed as orders,
    s.total_sales as sales,
    s.voids_count as voids,
    s.refunds_count as refunds,
    s.discounts_given as discounts
  FROM shifts s
  JOIN employees e ON e.id = s.employee_id
  WHERE s.id = shift_id_param;
$$;