-- Create approval_requests table
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID REFERENCES employees(id),
  action_type TEXT NOT NULL,
  action_context JSONB,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES employees(id),
  approval_pin_verified BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX idx_approval_requests_status ON approval_requests(status, created_at DESC);
CREATE INDEX idx_approval_requests_requested_by ON approval_requests(requested_by);

-- Enable RLS
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

-- Managers can view all approval requests
CREATE POLICY "Managers view all approvals"
ON approval_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Staff can view their own requests
CREATE POLICY "Staff view own requests"
ON approval_requests
FOR SELECT
USING (
  requested_by IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  )
);

-- Staff can create approval requests
CREATE POLICY "Staff create requests"
ON approval_requests
FOR INSERT
WITH CHECK (
  requested_by IN (
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
  )
);

-- Managers can update approval requests
CREATE POLICY "Managers update approvals"
ON approval_requests
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Add PIN rotation tracking to employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pin_last_changed TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pin_rotation_days INTEGER DEFAULT 90;

-- Function to verify manager PIN and approve request
CREATE OR REPLACE FUNCTION approve_request_with_pin(
  request_id_param UUID,
  pin_param VARCHAR(6)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  employee_record RECORD;
  request_record RECORD;
BEGIN
  -- Get the current user's employee record
  SELECT * INTO employee_record
  FROM employees
  WHERE auth_user_id = auth.uid()
    AND active = true
    AND role IN ('manager', 'admin');
  
  IF employee_record.id IS NULL THEN
    RAISE EXCEPTION 'User is not a manager or admin';
  END IF;
  
  -- Verify PIN
  IF employee_record.pin != pin_param THEN
    RAISE EXCEPTION 'Invalid PIN';
  END IF;
  
  -- Get the approval request
  SELECT * INTO request_record
  FROM approval_requests
  WHERE id = request_id_param
    AND status = 'pending';
  
  IF request_record.id IS NULL THEN
    RAISE EXCEPTION 'Approval request not found or already processed';
  END IF;
  
  -- Check if expired
  IF request_record.expires_at < NOW() THEN
    UPDATE approval_requests
    SET status = 'expired'
    WHERE id = request_id_param;
    
    RAISE EXCEPTION 'Approval request has expired';
  END IF;
  
  -- Update the request
  UPDATE approval_requests
  SET 
    status = 'approved',
    approved_by = employee_record.id,
    approval_pin_verified = true,
    approved_at = NOW()
  WHERE id = request_id_param;
  
  RETURN true;
END;
$$;

-- Function to reject request
CREATE OR REPLACE FUNCTION reject_approval_request(
  request_id_param UUID,
  pin_param VARCHAR(6)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  employee_record RECORD;
BEGIN
  -- Get the current user's employee record
  SELECT * INTO employee_record
  FROM employees
  WHERE auth_user_id = auth.uid()
    AND active = true
    AND role IN ('manager', 'admin');
  
  IF employee_record.id IS NULL THEN
    RAISE EXCEPTION 'User is not a manager or admin';
  END IF;
  
  -- Verify PIN
  IF employee_record.pin != pin_param THEN
    RAISE EXCEPTION 'Invalid PIN';
  END IF;
  
  -- Update the request
  UPDATE approval_requests
  SET 
    status = 'rejected',
    approved_by = employee_record.id,
    approval_pin_verified = true,
    approved_at = NOW()
  WHERE id = request_id_param
    AND status = 'pending';
  
  RETURN true;
END;
$$;

-- Enable realtime for approval requests
ALTER PUBLICATION supabase_realtime ADD TABLE approval_requests;