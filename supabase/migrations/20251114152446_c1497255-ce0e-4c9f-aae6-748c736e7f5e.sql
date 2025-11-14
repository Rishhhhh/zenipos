-- =====================================================
-- FINAL FIX: Break infinite recursion in branches table
-- =====================================================

-- Drop ALL existing policies on branches that cause recursion
DROP POLICY IF EXISTS "Employees view their branch" ON public.branches;
DROP POLICY IF EXISTS "Managers view assigned branches" ON public.branches;
DROP POLICY IF EXISTS "Owners manage organization branches" ON public.branches;
DROP POLICY IF EXISTS "Users view branches in accessible branches" ON public.branches;
DROP POLICY IF EXISTS "Managers manage branches in accessible branches" ON public.branches;

-- Create NEW non-recursive policies using SECURITY DEFINER function
CREATE POLICY "Users view accessible branches"
ON public.branches
FOR SELECT
TO authenticated
USING (
  id IN (SELECT branch_id FROM public.get_accessible_branch_ids(auth.uid()))
);

CREATE POLICY "Owners manage all organization branches"
ON public.branches
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  )
);

-- =====================================================
-- FIX: Remove invalid user_id foreign key from shifts
-- =====================================================

-- Drop the problematic foreign key constraint
ALTER TABLE public.shifts 
DROP CONSTRAINT IF EXISTS shifts_user_id_fkey;

-- user_id can just be a UUID field without foreign key to auth.users
-- (since we can't reference auth.users table directly)
COMMENT ON COLUMN public.shifts.user_id IS 'Auth user ID (not a foreign key)';