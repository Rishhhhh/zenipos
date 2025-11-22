-- ============================================
-- PHASE 1: Clean up orphaned auth users
-- ============================================
-- First, clean up dependent records (pos_displays) that reference these users
-- Then delete the orphaned auth users themselves

-- Step 1: Delete pos_displays records for orphaned users
DELETE FROM pos_displays
WHERE linked_by_user_id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN organizations o ON o.owner_id = au.id
  LEFT JOIN employees e ON e.auth_user_id = au.id
  WHERE o.id IS NULL AND e.id IS NULL
  AND au.email IN (
    'ammashomecook.co@gmail.com',
    'finance@amin.gold',
    'likomes@gmail.com',
    'finaltest@example.com',
    'test456@example.com',
    'test@gmail.com',
    'cashier@test.pos',
    'manager@test.pos',
    'admin@test.pos'
  )
);

-- Step 2: Now delete the orphaned auth users
DELETE FROM auth.users 
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN organizations o ON o.owner_id = au.id
  LEFT JOIN employees e ON e.auth_user_id = au.id
  WHERE o.id IS NULL AND e.id IS NULL
  AND au.email IN (
    'ammashomecook.co@gmail.com',
    'finance@amin.gold',
    'likomes@gmail.com',
    'finaltest@example.com',
    'test456@example.com',
    'test@gmail.com',
    'cashier@test.pos',
    'manager@test.pos',
    'admin@test.pos'
  )
);

-- ============================================
-- PHASE 2: Add RLS policies to employees table
-- ============================================
-- The employees table currently has RLS enabled but the existing policies
-- are too restrictive or incomplete for proper organization isolation

-- Drop existing policies
DROP POLICY IF EXISTS "employees_select" ON employees;
DROP POLICY IF EXISTS "employees_write" ON employees;
DROP POLICY IF EXISTS "employees_select_own_org" ON employees;
DROP POLICY IF EXISTS "employees_insert_own_org" ON employees;
DROP POLICY IF EXISTS "employees_update_own_org" ON employees;
DROP POLICY IF EXISTS "employees_delete_own_org" ON employees;
DROP POLICY IF EXISTS "employees_service_role_all" ON employees;

-- Ensure RLS is enabled
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policy 1: Employees can view their own organization's employees
CREATE POLICY "employees_select_own_org" ON employees
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM employees 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy 2: Owners/managers can insert employees in their organization
CREATE POLICY "employees_insert_own_org" ON employees
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT e.organization_id FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.role IN ('owner', 'manager')
    )
  );

-- Policy 3: Owners/managers can update employees in their organization
CREATE POLICY "employees_update_own_org" ON employees
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT e.organization_id FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.role IN ('owner', 'manager')
    )
  );

-- Policy 4: Owners/managers can delete employees in their organization
CREATE POLICY "employees_delete_own_org" ON employees
  FOR DELETE
  USING (
    organization_id IN (
      SELECT e.organization_id FROM employees e
      WHERE e.auth_user_id = auth.uid()
      AND e.role IN ('owner', 'manager')
    )
  );

-- Policy 5: Service role bypass (for edge functions during registration)
CREATE POLICY "employees_service_role_all" ON employees
  FOR ALL
  USING (auth.role() = 'service_role');