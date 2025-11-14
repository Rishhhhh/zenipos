-- Phase 2.2: Fix Organizations Table RLS Recursion
-- Remove circular dependency with branches table

-- Drop the problematic policy that creates circular dependency
DROP POLICY IF EXISTS "Users view organizations they have access to" ON public.organizations;

-- Create new owner-only policy (no branches table reference = no circular dependency)
CREATE POLICY "Owners view their organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());