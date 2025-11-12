-- Create super_admin_impersonations table
CREATE TABLE super_admin_impersonations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  actions_performed JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_impersonations_super_admin ON super_admin_impersonations(super_admin_user_id);
CREATE INDEX idx_impersonations_org ON super_admin_impersonations(organization_id);
CREATE INDEX idx_impersonations_active ON super_admin_impersonations(ended_at) WHERE ended_at IS NULL;

-- RLS policies for super_admin_impersonations
ALTER TABLE super_admin_impersonations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all impersonations"
ON super_admin_impersonations FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can create impersonations"
ON super_admin_impersonations FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can end impersonations"
ON super_admin_impersonations FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- Update organizations table RLS policies
CREATE POLICY "Super admins can view all organizations"
ON organizations FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update organization status"
ON organizations FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Helper function: Check if user is currently impersonating
CREATE OR REPLACE FUNCTION is_impersonating(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM super_admin_impersonations
  WHERE super_admin_user_id = _user_id
    AND ended_at IS NULL
  ORDER BY started_at DESC
  LIMIT 1;
$$;

-- Helper function: Get super admin analytics
CREATE OR REPLACE FUNCTION get_super_admin_analytics()
RETURNS TABLE (
  total_organizations BIGINT,
  active_organizations BIGINT,
  total_orders_today BIGINT,
  total_revenue_today NUMERIC,
  active_impersonations BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH org_stats AS (
    SELECT
      o.id as org_id,
      o.is_active,
      COUNT(DISTINCT ord.id) FILTER (WHERE ord.created_at >= CURRENT_DATE) as orders_today,
      COALESCE(SUM(ord.total) FILTER (WHERE ord.created_at >= CURRENT_DATE), 0) as revenue_today
    FROM organizations o
    LEFT JOIN branches b ON b.organization_id = o.id
    LEFT JOIN orders ord ON ord.branch_id = b.id
    GROUP BY o.id, o.is_active
  )
  SELECT
    COUNT(DISTINCT org_id) as total_organizations,
    COUNT(DISTINCT org_id) FILTER (WHERE is_active = true) as active_organizations,
    SUM(orders_today)::BIGINT as total_orders_today,
    SUM(revenue_today) as total_revenue_today,
    (SELECT COUNT(*) FROM super_admin_impersonations WHERE ended_at IS NULL)::BIGINT as active_impersonations
  FROM org_stats;
$$;