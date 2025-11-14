-- Fix infinite recursion in branches table RLS policies

-- Drop all existing policies on branches
DROP POLICY IF EXISTS "All authenticated users can view branches" ON public.branches;
DROP POLICY IF EXISTS "Managers view assigned branches" ON public.branches;
DROP POLICY IF EXISTS "Only owners can modify branches" ON public.branches;
DROP POLICY IF EXISTS "Owners manage branches in their organization" ON public.branches;

-- Create a security definer function to check branch access without recursion
CREATE OR REPLACE FUNCTION public.get_user_branches(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Return branches the user has access to via user_roles
  SELECT DISTINCT br.id
  FROM branches br
  WHERE br.organization_id IN (
    SELECT org.id
    FROM organizations org
    WHERE org.owner_id = _user_id
  )
  OR br.manager_id = _user_id
  OR EXISTS (
    SELECT 1
    FROM employees emp
    WHERE emp.auth_user_id = _user_id
    AND emp.branch_id = br.id
  );
$$;

-- Simple policy: authenticated users can view branches they have access to
CREATE POLICY "Users view accessible branches"
ON public.branches
FOR SELECT
TO authenticated
USING (
  id IN (SELECT public.get_user_branches(auth.uid()))
);

-- Owners can do everything with branches in their organization
CREATE POLICY "Owners manage their organization branches"
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