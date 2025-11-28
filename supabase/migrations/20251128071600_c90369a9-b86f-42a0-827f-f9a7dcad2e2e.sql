-- Phase 1: Database Cleanup & Schema Fixes (Fixed Order)

-- First: Clear all open till sessions (must be before shifts due to FK)
UPDATE till_sessions
SET status = 'closed',
    closed_at = NOW()
WHERE status = 'open' AND closed_at IS NULL;

-- Second: Close all active shifts by setting clock_out_at
UPDATE shifts
SET clock_out_at = NOW()
WHERE status = 'active' AND clock_out_at IS NULL;

-- Third: Clear till_ledger for fresh start
TRUNCATE TABLE till_ledger CASCADE;

-- Add organization_id to till_sessions if not exists
ALTER TABLE till_sessions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to till_ledger if not exists  
ALTER TABLE till_ledger ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Phase 4: Create function to calculate expected till cash
CREATE OR REPLACE FUNCTION calculate_till_expected_cash(till_session_id_param UUID)
RETURNS NUMERIC AS $$
  SELECT 
    COALESCE(ts.opening_float, 0) + COALESCE(SUM(
      CASE 
        WHEN tl.transaction_type = 'sale' THEN tl.amount 
        WHEN tl.transaction_type = 'change_given' THEN tl.amount
        ELSE 0 
      END
    ), 0)
  FROM till_sessions ts
  LEFT JOIN till_ledger tl ON tl.till_session_id = ts.id
  WHERE ts.id = till_session_id_param
  GROUP BY ts.id, ts.opening_float;
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public;