-- Fix can_access_branch function to remove user_branches dependency
-- This resolves 500 errors by using employees table which is populated during signup

CREATE OR REPLACE FUNCTION can_access_branch(_user_id uuid, _branch_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Owner can access all branches in their organization
  SELECT EXISTS (
    SELECT 1 FROM branches b
    JOIN organizations o ON o.id = b.organization_id
    WHERE b.id = _branch_id AND o.owner_id = _user_id
  )
  OR
  -- Employee can access their assigned branch
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.auth_user_id = _user_id 
      AND e.branch_id = _branch_id
      AND e.active = true
  );
$$;