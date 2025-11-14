-- Phase 1: Fix Branches RLS - Remove Infinite Recursion
-- Drop ALL existing policies on branches (clean slate)
DROP POLICY IF EXISTS "Users view accessible branches" ON public.branches;
DROP POLICY IF EXISTS "Owners manage organization branches" ON public.branches;
DROP POLICY IF EXISTS "Managers view assigned branches" ON public.branches;
DROP POLICY IF EXISTS "Employees view their branch" ON public.branches;
DROP POLICY IF EXISTS "Owners manage all organization branches" ON public.branches;
DROP POLICY IF EXISTS "Owners view and manage org branches" ON public.branches;
DROP POLICY IF EXISTS "branches_select" ON public.branches;
DROP POLICY IF EXISTS "branches_write_owner" ON public.branches;

-- Create new NON-RECURSIVE policies
-- No SELECT ... FROM branches inside branches policies = no recursion
CREATE POLICY "branches_select"
ON public.branches
FOR SELECT
TO authenticated
USING (
  -- Owners of the organization
  organization_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
  -- OR managers assigned to this branch
  OR manager_id = auth.uid()
  -- OR employees assigned to this branch
  OR EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.auth_user_id = auth.uid() AND e.branch_id = branches.id
  )
);

CREATE POLICY "branches_write_owner"
ON public.branches
FOR ALL
TO authenticated
USING (
  organization_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
)
WITH CHECK (
  organization_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
);