-- Phase 1: Database Cleanup and Fixes

-- 1. Fix orphaned shifts: Set status = 'closed' for shifts with clock_out_at but status = 'active'
UPDATE public.shifts 
SET status = 'closed' 
WHERE clock_out_at IS NOT NULL 
  AND status = 'active';

-- 2. Drop existing function first to change return type
DROP FUNCTION IF EXISTS public.get_shift_summary(uuid);

-- 3. Create get_shift_summary RPC with proper return type
CREATE OR REPLACE FUNCTION public.get_shift_summary(shift_id_param uuid)
RETURNS TABLE (
  clock_in timestamp with time zone,
  clock_out timestamp with time zone,
  orders bigint,
  sales numeric,
  cash_sales numeric,
  qr_sales numeric,
  tips numeric,
  employee_name text,
  till_opening numeric,
  till_expected numeric,
  till_actual numeric,
  till_variance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.clock_in_at as clock_in,
    s.clock_out_at as clock_out,
    COALESCE(COUNT(DISTINCT o.id), 0)::BIGINT as orders,
    COALESCE(SUM(o.total), 0)::NUMERIC as sales,
    COALESCE(SUM(CASE WHEN p.method = 'cash' THEN p.amount ELSE 0 END), 0)::NUMERIC as cash_sales,
    COALESCE(SUM(CASE WHEN p.method = 'qr' THEN p.amount ELSE 0 END), 0)::NUMERIC as qr_sales,
    COALESCE(SUM(p.tip_amount), 0)::NUMERIC as tips,
    e.name as employee_name,
    COALESCE(ts.opening_float, 0)::NUMERIC as till_opening,
    COALESCE(ts.expected_cash, 0)::NUMERIC as till_expected,
    COALESCE(ts.actual_cash, 0)::NUMERIC as till_actual,
    COALESCE(ts.variance, 0)::NUMERIC as till_variance
  FROM shifts s
  LEFT JOIN employees e ON e.id = s.employee_id
  LEFT JOIN till_sessions ts ON ts.shift_id = s.id
  LEFT JOIN orders o ON o.created_at BETWEEN s.clock_in_at AND COALESCE(s.clock_out_at, NOW())
    AND o.branch_id = s.branch_id
    AND o.status IN ('completed', 'paid')
  LEFT JOIN payments p ON p.order_id = o.id AND p.status = 'completed'
  WHERE s.id = shift_id_param
  GROUP BY s.id, s.clock_in_at, s.clock_out_at, e.name, ts.opening_float, ts.expected_cash, ts.actual_cash, ts.variance;
END;
$$;

-- 4. Create or replace close_shift RPC with proper status update
CREATE OR REPLACE FUNCTION public.close_shift(shift_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id uuid;
BEGIN
  -- Get employee_id from shift
  SELECT employee_id INTO v_employee_id
  FROM shifts
  WHERE id = shift_id_param;

  IF v_employee_id IS NULL THEN
    RAISE EXCEPTION 'Shift not found';
  END IF;

  -- Update shift status to closed
  UPDATE shifts
  SET status = 'closed',
      updated_at = NOW()
  WHERE id = shift_id_param;

  -- Auto-close any open till sessions for this shift
  UPDATE till_sessions
  SET status = 'closed',
      closed_at = NOW()
  WHERE shift_id = shift_id_param
    AND status = 'open';

  -- Log to audit
  INSERT INTO audit_log (actor, action, entity, entity_id, diff)
  VALUES (
    auth.uid(),
    'shift_closed',
    'shifts',
    shift_id_param,
    jsonb_build_object('closed_at', NOW())
  );
END;
$$;

-- 5. Drop and recreate get_active_shift with updated return type
DROP FUNCTION IF EXISTS public.get_active_shift(uuid);

CREATE OR REPLACE FUNCTION public.get_active_shift(employee_id_param uuid)
RETURNS TABLE (
  shift_id uuid,
  clock_in_at timestamp with time zone,
  branch_id uuid,
  status text,
  till_session_id uuid,
  till_expected_cash numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as shift_id,
    s.clock_in_at,
    s.branch_id,
    s.status::text,
    ts.id as till_session_id,
    ts.expected_cash as till_expected_cash
  FROM shifts s
  LEFT JOIN till_sessions ts ON ts.shift_id = s.id AND ts.status = 'open'
  WHERE s.employee_id = employee_id_param
    AND s.status = 'active'
    AND s.clock_out_at IS NULL
  ORDER BY s.clock_in_at DESC
  LIMIT 1;
END;
$$;

-- 6. Add index for faster till_ledger queries
CREATE INDEX IF NOT EXISTS idx_till_ledger_session_created 
ON public.till_ledger(till_session_id, created_at);

-- 7. Add index for faster shift lookups
CREATE INDEX IF NOT EXISTS idx_shifts_employee_status 
ON public.shifts(employee_id, status, clock_out_at);