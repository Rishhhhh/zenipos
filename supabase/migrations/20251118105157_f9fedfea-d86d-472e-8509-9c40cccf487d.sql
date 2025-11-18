
-- Fix get_accessible_branch_ids to return TABLE format for backward compatibility
DROP FUNCTION IF EXISTS public.get_accessible_branch_ids(uuid);

CREATE FUNCTION public.get_accessible_branch_ids(_user_id uuid)
RETURNS TABLE(branch_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT unnest(branch_ids) as branch_id 
  FROM get_user_org_and_branches(_user_id);
$function$;

COMMENT ON FUNCTION public.get_accessible_branch_ids IS 
  'Returns table of branch IDs the user has access to. Owners get all branches in their org. Returns TABLE format for compatibility with existing code.';
