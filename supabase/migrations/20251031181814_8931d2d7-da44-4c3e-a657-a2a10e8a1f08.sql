-- Enhance shifts table for break tracking and performance
ALTER TABLE shifts
ADD COLUMN IF NOT EXISTS break_start_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS break_end_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS break_type TEXT DEFAULT 'unpaid', -- 'paid', 'unpaid'
ADD COLUMN IF NOT EXISTS break_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clock_in_location TEXT,
ADD COLUMN IF NOT EXISTS clock_in_photo_url TEXT,
ADD COLUMN IF NOT EXISTS clock_out_location TEXT,
ADD COLUMN IF NOT EXISTS clock_out_photo_url TEXT,
ADD COLUMN IF NOT EXISTS nfc_card_uid TEXT,
ADD COLUMN IF NOT EXISTS overtime_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ;

-- Create break_logs table for multiple breaks per shift
CREATE TABLE IF NOT EXISTS break_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) NOT NULL,
  break_type TEXT NOT NULL DEFAULT 'unpaid', -- 'paid', 'unpaid'
  start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  auto_ended BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_break_logs_shift ON break_logs(shift_id);
CREATE INDEX idx_break_logs_employee ON break_logs(employee_id);
CREATE INDEX idx_break_logs_active ON break_logs(employee_id) WHERE end_at IS NULL;

-- Create shift_schedules table
CREATE TABLE IF NOT EXISTS shift_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  branch_id UUID REFERENCES branches(id),
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  role TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES employees(id)
);

CREATE INDEX idx_shift_schedules_employee ON shift_schedules(employee_id);
CREATE INDEX idx_shift_schedules_date ON shift_schedules(scheduled_date);
CREATE INDEX idx_shift_schedules_branch ON shift_schedules(branch_id);

-- Create labor_budget table
CREATE TABLE IF NOT EXISTS labor_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  budget_date DATE NOT NULL,
  target_labor_percentage NUMERIC(5,2) NOT NULL, -- e.g., 25.00 for 25%
  target_labor_cost NUMERIC(10,2),
  actual_labor_cost NUMERIC(10,2) DEFAULT 0,
  actual_labor_percentage NUMERIC(5,2) DEFAULT 0,
  total_sales NUMERIC(10,2) DEFAULT 0,
  total_hours NUMERIC(8,2) DEFAULT 0,
  overtime_hours NUMERIC(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch_id, budget_date)
);

CREATE INDEX idx_labor_budget_branch ON labor_budget(branch_id);
CREATE INDEX idx_labor_budget_date ON labor_budget(budget_date);

-- Enable RLS
ALTER TABLE break_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_budget ENABLE ROW LEVEL SECURITY;

-- RLS Policies for break_logs
CREATE POLICY "Employees view own breaks"
ON break_logs FOR SELECT
USING (employee_id IN (
  SELECT id FROM employees WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Managers view all breaks"
ON break_logs FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

CREATE POLICY "Employees manage own breaks"
ON break_logs FOR ALL
USING (employee_id IN (
  SELECT id FROM employees WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Managers manage all breaks"
ON break_logs FOR ALL
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

-- RLS Policies for shift_schedules
CREATE POLICY "Employees view own schedules"
ON shift_schedules FOR SELECT
USING (employee_id IN (
  SELECT id FROM employees WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Managers view all schedules"
ON shift_schedules FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

CREATE POLICY "Managers manage schedules"
ON shift_schedules FOR ALL
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

-- RLS Policies for labor_budget
CREATE POLICY "Managers view labor budget"
ON labor_budget FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

CREATE POLICY "Managers manage labor budget"
ON labor_budget FOR ALL
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

-- Function to calculate real-time labor cost
CREATE OR REPLACE FUNCTION calculate_labor_metrics(
  branch_id_param UUID,
  date_param DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_labor_cost NUMERIC,
  total_hours NUMERIC,
  overtime_hours NUMERIC,
  labor_percentage NUMERIC,
  active_employees INTEGER,
  total_sales NUMERIC
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_sales NUMERIC;
BEGIN
  -- Get total sales for the date
  SELECT COALESCE(SUM(total), 0) INTO v_total_sales
  FROM orders
  WHERE DATE(created_at) = date_param
    AND (branch_id_param IS NULL OR branch_id = branch_id_param)
    AND status IN ('completed', 'paid');

  RETURN QUERY
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN s.clock_out_at IS NOT NULL THEN
          -- Completed shift
          EXTRACT(EPOCH FROM (s.clock_out_at - s.clock_in_at)) / 3600.0 
          - (COALESCE(s.break_minutes, 0) / 60.0)
        ELSE
          -- Active shift
          EXTRACT(EPOCH FROM (NOW() - s.clock_in_at)) / 3600.0
          - (COALESCE(s.break_minutes, 0) / 60.0)
      END * COALESCE(e.pay_rate, 0)
    ), 0)::NUMERIC(10,2) as total_labor_cost,
    
    COALESCE(SUM(
      CASE 
        WHEN s.clock_out_at IS NOT NULL THEN
          EXTRACT(EPOCH FROM (s.clock_out_at - s.clock_in_at)) / 3600.0 
          - (COALESCE(s.break_minutes, 0) / 60.0)
        ELSE
          EXTRACT(EPOCH FROM (NOW() - s.clock_in_at)) / 3600.0
          - (COALESCE(s.break_minutes, 0) / 60.0)
      END
    ), 0)::NUMERIC(8,2) as total_hours,
    
    COALESCE(SUM(COALESCE(s.overtime_minutes, 0) / 60.0), 0)::NUMERIC(8,2) as overtime_hours,
    
    CASE 
      WHEN v_total_sales > 0 THEN
        (COALESCE(SUM(
          CASE 
            WHEN s.clock_out_at IS NOT NULL THEN
              EXTRACT(EPOCH FROM (s.clock_out_at - s.clock_in_at)) / 3600.0 
              - (COALESCE(s.break_minutes, 0) / 60.0)
            ELSE
              EXTRACT(EPOCH FROM (NOW() - s.clock_in_at)) / 3600.0
              - (COALESCE(s.break_minutes, 0) / 60.0)
          END * COALESCE(e.pay_rate, 0)
        ), 0) / v_total_sales * 100)
      ELSE 0
    END::NUMERIC(5,2) as labor_percentage,
    
    COUNT(DISTINCT CASE WHEN s.clock_out_at IS NULL THEN s.employee_id END)::INTEGER as active_employees,
    
    v_total_sales::NUMERIC(10,2) as total_sales
  FROM shifts s
  JOIN employees e ON e.id = s.employee_id
  WHERE DATE(s.clock_in_at) = date_param
    AND (branch_id_param IS NULL OR e.branch_id = branch_id_param);
END;
$$;

-- Function to start break
CREATE OR REPLACE FUNCTION start_break(
  shift_id_param UUID,
  break_type_param TEXT DEFAULT 'unpaid'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id UUID;
  v_break_id UUID;
  v_active_break UUID;
BEGIN
  -- Get employee_id from shift
  SELECT employee_id INTO v_employee_id
  FROM shifts
  WHERE id = shift_id_param;

  IF v_employee_id IS NULL THEN
    RAISE EXCEPTION 'Shift not found';
  END IF;

  -- Check for active break
  SELECT id INTO v_active_break
  FROM break_logs
  WHERE employee_id = v_employee_id
    AND end_at IS NULL
  LIMIT 1;

  IF v_active_break IS NOT NULL THEN
    RAISE EXCEPTION 'Employee already has an active break';
  END IF;

  -- Create break log
  INSERT INTO break_logs (shift_id, employee_id, break_type)
  VALUES (shift_id_param, v_employee_id, break_type_param)
  RETURNING id INTO v_break_id;

  RETURN v_break_id;
END;
$$;

-- Function to end break
CREATE OR REPLACE FUNCTION end_break(break_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duration_minutes INTEGER;
  v_shift_id UUID;
BEGIN
  -- Update break log
  UPDATE break_logs
  SET 
    end_at = NOW(),
    duration_minutes = EXTRACT(EPOCH FROM (NOW() - start_at)) / 60
  WHERE id = break_id_param
  RETURNING duration_minutes, shift_id INTO v_duration_minutes, v_shift_id;

  -- Update shift total break minutes
  UPDATE shifts
  SET break_minutes = COALESCE(break_minutes, 0) + v_duration_minutes
  WHERE id = v_shift_id;
END;
$$;

-- Function to get active break
CREATE OR REPLACE FUNCTION get_active_break(employee_id_param UUID)
RETURNS TABLE(
  break_id UUID,
  shift_id UUID,
  break_type TEXT,
  start_at TIMESTAMPTZ,
  duration_minutes INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id as break_id,
    shift_id,
    break_type,
    start_at,
    EXTRACT(EPOCH FROM (NOW() - start_at)) / 60 as duration_minutes
  FROM break_logs
  WHERE employee_id = employee_id_param
    AND end_at IS NULL
  LIMIT 1;
$$;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE break_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE labor_budget;