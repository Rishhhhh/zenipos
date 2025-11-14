
-- =====================================================
-- FIX: Simplify branch RLS and remove auto-creation
-- =====================================================

-- Drop the complex policies
DROP POLICY IF EXISTS "Users view accessible branches" ON public.branches;
DROP POLICY IF EXISTS "Owners manage all organization branches" ON public.branches;

-- Create simple, working policies
-- 1. Owners can see and manage their organization's branches
CREATE POLICY "Owners view and manage org branches"
ON public.branches
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT id FROM organizations WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT id FROM organizations WHERE owner_id = auth.uid()
  )
);

-- 2. Managers can see branches they're assigned to
CREATE POLICY "Managers view assigned branch"
ON public.branches
FOR SELECT
TO authenticated
USING (
  manager_id = auth.uid()
);

-- 3. Employees can view their branch
CREATE POLICY "Employees view their branch"
ON public.branches
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT branch_id FROM employees WHERE auth_user_id = auth.uid()
  )
);
