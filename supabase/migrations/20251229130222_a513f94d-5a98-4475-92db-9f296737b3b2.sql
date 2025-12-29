-- Clean up duplicate active shifts (keep only the most recent one per employee)
WITH ranked AS (
  SELECT id, employee_id, clock_in_at,
         ROW_NUMBER() OVER (PARTITION BY employee_id ORDER BY clock_in_at DESC) as rn
  FROM shifts
  WHERE status = 'active' AND clock_out_at IS NULL
)
UPDATE shifts SET status = 'closed', clock_out_at = NOW()
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Add unique partial index to prevent future duplicate active shifts
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_shift_per_employee 
ON shifts (employee_id) 
WHERE status = 'active' AND clock_out_at IS NULL;