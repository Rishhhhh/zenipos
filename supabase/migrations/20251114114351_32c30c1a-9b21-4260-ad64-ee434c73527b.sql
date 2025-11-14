-- Update get_user_branches to include organization ownership fallback
CREATE OR REPLACE FUNCTION public.get_user_branches(_user_id uuid)
RETURNS TABLE(branch_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Get branches through employee records
  SELECT DISTINCT b.id as branch_id
  FROM employees e
  JOIN branches b ON b.id = e.branch_id
  WHERE e.auth_user_id = _user_id
    AND e.active = true
    AND b.active = true
  
  UNION
  
  -- Get branches through organization ownership (FALLBACK for owners)
  SELECT b.id as branch_id
  FROM branches b
  JOIN organizations o ON o.id = b.organization_id
  WHERE o.owner_id = _user_id
    AND b.active = true;
$function$;