-- Fix infinite recursion in employees RLS policies
-- Drop all existing problematic policies
DROP POLICY IF EXISTS "employees_select_own_org" ON employees;
DROP POLICY IF EXISTS "employees_insert_own_org" ON employees;
DROP POLICY IF EXISTS "employees_update_own_org" ON employees;
DROP POLICY IF EXISTS "employees_delete_own_org" ON employees;
DROP POLICY IF EXISTS "employees_service_role_all" ON employees;

-- Create fixed policies using security definer functions
-- Policy 1: View employees in own organization
CREATE POLICY "employees_select_own_org" ON employees
  FOR SELECT
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );

-- Policy 2: Owners/Managers can insert employees
CREATE POLICY "employees_insert_own_org" ON employees
  FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id(auth.uid())
    AND (
      has_role(auth.uid(), 'owner'::app_role) 
      OR has_role(auth.uid(), 'manager'::app_role)
    )
  );

-- Policy 3: Owners/Managers can update employees
CREATE POLICY "employees_update_own_org" ON employees
  FOR UPDATE
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND (
      has_role(auth.uid(), 'owner'::app_role) 
      OR has_role(auth.uid(), 'manager'::app_role)
    )
  );

-- Policy 4: Owners/Managers can delete employees
CREATE POLICY "employees_delete_own_org" ON employees
  FOR DELETE
  USING (
    organization_id = get_user_organization_id(auth.uid())
    AND (
      has_role(auth.uid(), 'owner'::app_role) 
      OR has_role(auth.uid(), 'manager'::app_role)
    )
  );

-- Policy 5: Service role bypass
CREATE POLICY "employees_service_role_all" ON employees
  FOR ALL
  USING (auth.role() = 'service_role');