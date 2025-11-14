-- Fix infinite recursion by properly handling all dependencies

-- Drop existing policies on branches
DROP POLICY IF EXISTS "Users view accessible branches" ON public.branches;
DROP POLICY IF EXISTS "Owners manage their organization branches" ON public.branches;

-- Drop the problematic function with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS public.get_user_branches(uuid) CASCADE;

-- Create NEW function that returns branch IDs WITHOUT querying branches table
-- This avoids the circular dependency
CREATE OR REPLACE FUNCTION public.get_accessible_branch_ids(_user_id uuid)
RETURNS TABLE(branch_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Get branches from organizations the user owns
  SELECT b.id as branch_id
  FROM branches b
  INNER JOIN organizations o ON b.organization_id = o.id
  WHERE o.owner_id = _user_id
  
  UNION
  
  -- Get branches where user is manager
  SELECT b.id as branch_id
  FROM branches b
  WHERE b.manager_id = _user_id
  
  UNION
  
  -- Get branches where user is an employee
  SELECT e.branch_id
  FROM employees e
  WHERE e.auth_user_id = _user_id
$$;

-- Create simple, non-recursive policies for branches

-- Policy 1: Organization owners can manage branches
CREATE POLICY "Owners manage organization branches"
ON public.branches
FOR ALL
TO authenticated
USING (
  organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
)
WITH CHECK (
  organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
);

-- Policy 2: Branch managers can view their branches
CREATE POLICY "Managers view assigned branches"
ON public.branches
FOR SELECT
TO authenticated
USING (manager_id = auth.uid());

-- Policy 3: Employees can view their branch
CREATE POLICY "Employees view their branch"
ON public.branches
FOR SELECT
TO authenticated
USING (
  id IN (SELECT branch_id FROM employees WHERE auth_user_id = auth.uid())
);

-- Recreate device policies with the new function
CREATE POLICY "Users view devices in accessible branches"
ON public.devices
FOR SELECT
TO authenticated
USING (
  branch_id IN (SELECT branch_id FROM public.get_accessible_branch_ids(auth.uid()))
);

CREATE POLICY "Managers manage devices in accessible branches"
ON public.devices
FOR ALL
TO authenticated
USING (
  (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  AND branch_id IN (SELECT branch_id FROM public.get_accessible_branch_ids(auth.uid()))
);