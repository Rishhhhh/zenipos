-- Phase 1.1: Add organization_id and branch_id to suppliers table
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

-- Backfill organization_id from related inventory_items
UPDATE suppliers s
SET organization_id = (
  SELECT DISTINCT ii.organization_id 
  FROM inventory_items ii 
  WHERE ii.supplier_id = s.id 
  LIMIT 1
)
WHERE organization_id IS NULL;

-- Set organization_id as NOT NULL after backfill
ALTER TABLE suppliers ALTER COLUMN organization_id SET NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_organization_id ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_branch_id ON suppliers(branch_id);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist
DROP POLICY IF EXISTS suppliers_select ON suppliers;
DROP POLICY IF EXISTS suppliers_insert ON suppliers;
DROP POLICY IF EXISTS suppliers_update ON suppliers;
DROP POLICY IF EXISTS suppliers_delete ON suppliers;

-- CREATE RLS Policies
-- SELECT: Users can view suppliers for their organization
CREATE POLICY suppliers_select ON suppliers FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM employees 
    WHERE auth_user_id = auth.uid()
  )
);

-- INSERT: Users can create suppliers for their organization
CREATE POLICY suppliers_insert ON suppliers FOR INSERT 
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM employees 
    WHERE auth_user_id = auth.uid()
  )
);

-- UPDATE: Owner/Manager roles only
CREATE POLICY suppliers_update ON suppliers FOR UPDATE 
USING (
  (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  AND organization_id IN (
    SELECT organization_id 
    FROM employees 
    WHERE auth_user_id = auth.uid()
  )
);

-- DELETE: Owner/Manager roles only
CREATE POLICY suppliers_delete ON suppliers FOR DELETE 
USING (
  (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  AND organization_id IN (
    SELECT organization_id 
    FROM employees 
    WHERE auth_user_id = auth.uid()
  )
);