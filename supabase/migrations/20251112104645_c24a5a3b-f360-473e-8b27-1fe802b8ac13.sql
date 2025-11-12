-- =====================================================
-- Sub-Phase 3.2: Helper Functions for RLS
-- Creates organization-scoped helper functions for multi-tenant isolation
-- =====================================================

-- =====================================================
-- 1. CREATE SUPPORTING INDEXES FOR PERFORMANCE (<5ms)
-- =====================================================

-- Fast employee lookups by auth_user_id and active status
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id_active 
ON employees(auth_user_id, active);

-- Fast employee-to-branch joins (partial index for active employees only)
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id_branch_id 
ON employees(auth_user_id, branch_id) 
WHERE active = true;

-- Fast branch lookups by organization and active status
CREATE INDEX IF NOT EXISTS idx_branches_organization_id_active 
ON branches(organization_id, active);

-- Fast branch-to-organization joins
CREATE INDEX IF NOT EXISTS idx_branches_id_organization_id 
ON branches(id, organization_id);

-- =====================================================
-- 2. CREATE get_user_organization FUNCTION
-- Purpose: Return the organization_id for a given user
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.organization_id
  FROM employees e
  JOIN branches b ON b.id = e.branch_id
  WHERE e.auth_user_id = _user_id
    AND e.active = true
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_user_organization IS 'Returns the organization_id for a given user based on their employee record. Uses SECURITY DEFINER to bypass RLS.';

-- =====================================================
-- 3. CREATE get_user_branches FUNCTION
-- Purpose: Return all branch_ids within the user's organization
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_branches(_user_id uuid)
RETURNS TABLE(branch_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Get all branches in the user's organization
  WITH user_org AS (
    SELECT b.organization_id
    FROM employees e
    JOIN branches b ON b.id = e.branch_id
    WHERE e.auth_user_id = _user_id
      AND e.active = true
    LIMIT 1
  )
  SELECT id AS branch_id
  FROM branches
  WHERE organization_id = (SELECT organization_id FROM user_org)
    AND active = true;
$$;

COMMENT ON FUNCTION public.get_user_branches IS 'Returns all branch_ids within the user''s organization. Allows users to see data across their organization''s branches. Uses SECURITY DEFINER to bypass RLS.';

-- =====================================================
-- 4. CREATE can_access_organization FUNCTION
-- Purpose: Check if a user belongs to a specific organization
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_access_organization(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM employees e
    JOIN branches b ON b.id = e.branch_id
    WHERE e.auth_user_id = _user_id
      AND b.organization_id = _org_id
      AND e.active = true
  );
$$;

COMMENT ON FUNCTION public.can_access_organization IS 'Returns true if user belongs to the specified organization. Fast boolean check for RLS policies. Uses SECURITY DEFINER to bypass RLS.';

-- =====================================================
-- 5. UPDATE EXISTING get_user_branch_ids FUNCTION
-- Purpose: Fix broken logic and use new get_user_branches
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_branch_ids(_user_id uuid)
RETURNS TABLE(branch_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Return all branches in the user's organization
  SELECT branch_id FROM get_user_branches(_user_id);
$$;

COMMENT ON FUNCTION public.get_user_branch_ids IS 'Legacy function updated to use get_user_branches. Returns all branch_ids in user''s organization.';