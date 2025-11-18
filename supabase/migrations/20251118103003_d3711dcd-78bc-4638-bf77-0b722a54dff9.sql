-- PHASE 5 PART 1: Enhanced RLS Security Functions (With CASCADE)
-- Two-tier security model: organization isolation + branch filtering

-- Drop existing functions with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS public.user_can_access_record(uuid, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_org_and_branches(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_accessible_branch_ids(uuid) CASCADE;

-- 1. Master security function for two-tier validation
CREATE FUNCTION public.user_can_access_record(
  _user_id uuid,
  _record_organization_id uuid,
  _record_branch_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  WITH user_context AS (
    SELECT 
      e.id as employee_id,
      e.role,
      b.organization_id,
      b.id as branch_id
    FROM employees e
    JOIN branches b ON b.id = e.branch_id
    WHERE e.auth_user_id = _user_id
      AND e.active = true
  )
  SELECT 
    CASE
      -- First check: Organization-level isolation (CRITICAL)
      WHEN NOT EXISTS (
        SELECT 1 FROM user_context 
        WHERE organization_id = _record_organization_id
      ) THEN false
      
      -- Second check: Branch-level filtering
      -- Org owners can access all branches in their org
      WHEN EXISTS (
        SELECT 1 FROM user_context 
        WHERE role = 'owner' AND organization_id = _record_organization_id
      ) THEN true
      
      -- Other roles: must have access to the specific branch
      WHEN EXISTS (
        SELECT 1 FROM user_context 
        WHERE branch_id = _record_branch_id
      ) THEN true
      
      ELSE false
    END;
$function$;

-- 2. Performance optimization: Get user's org and branches in one query
CREATE FUNCTION public.get_user_org_and_branches(_user_id uuid)
RETURNS TABLE(
  organization_id uuid,
  branch_ids uuid[],
  is_owner boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    b.organization_id,
    CASE 
      -- Owners get all branches in their org
      WHEN e.role = 'owner' THEN (
        SELECT array_agg(br.id) 
        FROM branches br 
        WHERE br.organization_id = b.organization_id
      )
      -- Others get only their assigned branches
      ELSE array_agg(e.branch_id)
    END as branch_ids,
    e.role = 'owner' as is_owner
  FROM employees e
  JOIN branches b ON b.id = e.branch_id
  WHERE e.auth_user_id = _user_id
    AND e.active = true
  GROUP BY b.organization_id, e.role
  LIMIT 1;
$function$;

-- 3. Simplified helper for common use case
CREATE FUNCTION public.get_accessible_branch_ids(_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT branch_ids FROM get_user_org_and_branches(_user_id);
$function$;

-- Add helpful comments
COMMENT ON FUNCTION public.user_can_access_record IS 
  'Two-tier security check: validates organization-level isolation first, then branch-level access. Returns true if user can access the record.';

COMMENT ON FUNCTION public.get_user_org_and_branches IS 
  'Performance-optimized function that returns user organization and accessible branches in one query. Owners get all branches in their org.';

COMMENT ON FUNCTION public.get_accessible_branch_ids IS 
  'Returns array of branch IDs the user has access to. Owners get all branches in their org.';