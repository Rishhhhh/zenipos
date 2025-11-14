-- Phase 5: Employee Management Database Cleanup

-- Step 1: Clean up orphaned user_roles entries
DELETE FROM user_roles 
WHERE employee_id IS NULL;

-- Step 2: Add foreign key constraint with CASCADE to prevent future orphans
ALTER TABLE user_roles
DROP CONSTRAINT IF EXISTS user_roles_employee_id_fkey,
ADD CONSTRAINT user_roles_employee_id_fkey
  FOREIGN KEY (employee_id)
  REFERENCES employees(id)
  ON DELETE CASCADE;

-- Step 3: Add performance index for phone lookups
CREATE INDEX IF NOT EXISTS idx_employees_phone 
ON employees(phone) 
WHERE phone IS NOT NULL;

-- Step 4: Add organization-scoped uniqueness for email (per branch)
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email_branch_unique
ON employees (email, branch_id)
WHERE email IS NOT NULL;

-- Step 5: Add organization-scoped uniqueness for phone (per branch)
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_phone_branch_unique
ON employees (phone, branch_id)
WHERE phone IS NOT NULL;

-- Step 6: Add policy for managers to view roles in their branches
-- First drop if exists
DROP POLICY IF EXISTS "Managers view roles in their branches" ON user_roles;

-- Then create
CREATE POLICY "Managers view roles in their branches"
ON user_roles
FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT id FROM employees
    WHERE branch_id IN (
      SELECT branch_id FROM get_user_branch_ids(auth.uid())
    )
  )
  OR has_role(auth.uid(), 'owner')
);