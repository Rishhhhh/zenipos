-- Complete Phase 2: Fix Branches Table RLS (missed in original Phase 2)
-- Remove circular dependency with employees table

-- Drop existing problematic policies
DROP POLICY IF EXISTS "branches_select" ON public.branches;
DROP POLICY IF EXISTS "Managers view assigned branch" ON public.branches;
DROP POLICY IF EXISTS "branches_write_owner" ON public.branches;

-- CREATE: SELECT policy using Phase 2 pattern (direct checks, no recursion)
CREATE POLICY "branches_select"
ON public.branches
FOR SELECT
TO authenticated
USING (
  -- Pattern 1: Owner can see all branches in their organization (direct organization check)
  EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = branches.organization_id 
    AND o.owner_id = auth.uid()
  )
  -- Pattern 2: Manager can see their assigned branch (direct column check, no table join)
  OR branches.manager_id = auth.uid()
);

-- CREATE: WRITE policy using Phase 2 pattern (only owners can modify)
CREATE POLICY "branches_write"
ON public.branches
FOR ALL
TO authenticated
USING (
  -- Only organization owners can create/update/delete branches
  EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = branches.organization_id 
    AND o.owner_id = auth.uid()
  )
)
WITH CHECK (
  -- Same check for INSERT/UPDATE
  EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = branches.organization_id 
    AND o.owner_id = auth.uid()
  )
);