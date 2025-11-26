-- Add branch_id column to till_ledger table
ALTER TABLE till_ledger ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_till_ledger_branch_id ON till_ledger(branch_id);

-- Backfill existing records to derive branch_id from till_session
UPDATE till_ledger tl
SET branch_id = ts.branch_id
FROM till_sessions ts
WHERE tl.till_session_id = ts.id
AND tl.branch_id IS NULL;