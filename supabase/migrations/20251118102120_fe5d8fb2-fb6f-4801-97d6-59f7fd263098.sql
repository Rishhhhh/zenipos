-- PHASE 4 COMPLETION: Create T6-T25 tables for acc X and verify helper functions

-- Insert 20 more tables (T6-T25) for acc X
INSERT INTO tables (label, seats, status, organization_id, branch_id) VALUES
  ('T6', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T7', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T8', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T9', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T10', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T11', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T12', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T13', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T14', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T15', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T16', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T17', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T18', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T19', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T20', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T21', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T22', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T23', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T24', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b'),
  ('T25', 4, 'available', 'e511db38-cd22-435b-9842-1790575704f1', '7af1c5d8-e253-4f4f-b858-65193b33105b');

-- Verify helper functions exist (create if not)
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT b.organization_id
  FROM employees e
  JOIN branches b ON b.id = e.branch_id
  WHERE e.auth_user_id = _user_id
    AND e.active = true
  LIMIT 1;
$function$;