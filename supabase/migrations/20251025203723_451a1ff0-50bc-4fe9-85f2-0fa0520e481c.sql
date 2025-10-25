-- ============================================
-- PHASE 9: MULTI-BRANCH CLOUD ANALYTICS
-- ============================================

-- 1. ORGANIZATIONS (Restaurant Chains / Groups)
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Settings
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'MYR',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  
  -- Subscription/Plan info
  plan_type TEXT DEFAULT 'starter' CHECK (plan_type IN ('starter', 'professional', 'enterprise')),
  max_branches INTEGER DEFAULT 1,
  
  -- Metadata
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_owner ON organizations(owner_id);

-- 2. BRANCHES (Locations)
-- ============================================
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Branch details
  name TEXT NOT NULL,
  code TEXT, -- e.g., "KL01", "JB02"
  address TEXT,
  phone TEXT,
  email TEXT,
  
  -- Manager
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Status
  active BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'Asia/Kuala_Lumpur',
  
  -- Business hours (JSONB for flexibility)
  business_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "22:00"},
    "tuesday": {"open": "09:00", "close": "22:00"},
    "wednesday": {"open": "09:00", "close": "22:00"},
    "thursday": {"open": "09:00", "close": "22:00"},
    "friday": {"open": "09:00", "close": "22:00"},
    "saturday": {"open": "09:00", "close": "22:00"},
    "sunday": {"open": "09:00", "close": "22:00"}
  }'::jsonb,
  
  -- Custom settings per branch
  settings JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, code)
);

CREATE INDEX idx_branches_org ON branches(organization_id);
CREATE INDEX idx_branches_active ON branches(active);

-- 3. USER_BRANCHES (Access Control)
-- ============================================
CREATE TABLE user_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  
  -- Can view analytics even when not actively working
  can_view_analytics BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, branch_id, role)
);

CREATE INDEX idx_user_branches_user ON user_branches(user_id);
CREATE INDEX idx_user_branches_branch ON user_branches(branch_id);

-- 4. PUSH_SUBSCRIPTIONS (Web Push Notifications)
-- ============================================
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Push subscription data (from browser)
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  
  -- Device info
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  user_agent TEXT,
  
  -- Preferences
  enabled BOOLEAN DEFAULT true,
  notification_types JSONB DEFAULT '["low_stock", "offline_device", "sales_milestone", "order_alert"]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subs_user ON push_subscriptions(user_id);
CREATE INDEX idx_push_subs_enabled ON push_subscriptions(enabled);

-- 5. BRANCH_STATS (Daily Aggregates for Fast Queries)
-- ============================================
CREATE TABLE branch_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  stat_date DATE NOT NULL,
  
  -- Sales metrics
  total_revenue NUMERIC(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  avg_ticket NUMERIC(10,2) DEFAULT 0,
  
  -- Operational metrics
  total_items_sold INTEGER DEFAULT 0,
  voids_count INTEGER DEFAULT 0,
  refunds_count INTEGER DEFAULT 0,
  discounts_given NUMERIC(10,2) DEFAULT 0,
  
  -- Employee metrics
  shifts_worked INTEGER DEFAULT 0,
  total_labor_hours NUMERIC(10,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(branch_id, stat_date)
);

CREATE INDEX idx_branch_stats_branch_date ON branch_stats(branch_id, stat_date DESC);

-- ============================================
-- ADD branch_id TO EXISTING TABLES
-- ============================================

-- Add branch_id columns (nullable initially for migration)
ALTER TABLE menu_categories ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE menu_items ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE orders ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE employees ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE inventory_items ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE promotions ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE devices ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE stations ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_menu_categories_branch ON menu_categories(branch_id);
CREATE INDEX idx_menu_items_branch ON menu_items(branch_id);
CREATE INDEX idx_orders_branch ON orders(branch_id, created_at DESC);
CREATE INDEX idx_customers_branch ON customers(branch_id);
CREATE INDEX idx_employees_branch ON employees(branch_id);
CREATE INDEX idx_inventory_branch ON inventory_items(branch_id);
CREATE INDEX idx_promotions_branch ON promotions(branch_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user can access branch
CREATE OR REPLACE FUNCTION can_access_branch(_user_id UUID, _branch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Owner can access all branches in their organization
  SELECT EXISTS (
    SELECT 1 FROM branches b
    JOIN organizations o ON o.id = b.organization_id
    WHERE b.id = _branch_id AND o.owner_id = _user_id
  )
  OR
  -- User has direct branch access
  EXISTS (
    SELECT 1 FROM user_branches
    WHERE user_id = _user_id AND branch_id = _branch_id
  )
$$;

-- Get user's accessible branch IDs
CREATE OR REPLACE FUNCTION get_user_branch_ids(_user_id UUID)
RETURNS TABLE(branch_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- If owner, return all branches in their organizations
  SELECT b.id
  FROM branches b
  JOIN organizations o ON o.id = b.organization_id
  WHERE o.owner_id = _user_id
  
  UNION
  
  -- User's directly assigned branches
  SELECT ub.branch_id
  FROM user_branches ub
  WHERE ub.user_id = _user_id
$$;

-- Aggregate daily stats for a branch
CREATE OR REPLACE FUNCTION aggregate_branch_stats(
  _branch_id UUID,
  _stat_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revenue NUMERIC;
  v_order_count INTEGER;
  v_avg_ticket NUMERIC;
  v_items_sold INTEGER;
  v_discounts NUMERIC;
  v_shifts INTEGER;
  v_labor_hours NUMERIC;
BEGIN
  -- Calculate metrics
  SELECT 
    COALESCE(SUM(total), 0),
    COUNT(*),
    COALESCE(AVG(total), 0)
  INTO v_revenue, v_order_count, v_avg_ticket
  FROM orders
  WHERE branch_id = _branch_id
    AND DATE(created_at) = _stat_date;

  SELECT COALESCE(SUM(quantity), 0)
  INTO v_items_sold
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.branch_id = _branch_id
    AND DATE(o.created_at) = _stat_date;

  SELECT 
    COALESCE(SUM(discount), 0)
  INTO v_discounts
  FROM orders
  WHERE branch_id = _branch_id
    AND DATE(created_at) = _stat_date;

  SELECT 
    COUNT(*),
    COALESCE(SUM(total_hours), 0)
  INTO v_shifts, v_labor_hours
  FROM shifts s
  JOIN employees e ON e.id = s.employee_id
  WHERE e.branch_id = _branch_id
    AND DATE(s.clock_in_at) = _stat_date;

  -- Upsert stats
  INSERT INTO branch_stats (
    branch_id,
    stat_date,
    total_revenue,
    total_orders,
    avg_ticket,
    total_items_sold,
    discounts_given,
    shifts_worked,
    total_labor_hours,
    updated_at
  ) VALUES (
    _branch_id,
    _stat_date,
    v_revenue,
    v_order_count,
    v_avg_ticket,
    v_items_sold,
    v_discounts,
    v_shifts,
    v_labor_hours,
    NOW()
  )
  ON CONFLICT (branch_id, stat_date)
  DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_orders = EXCLUDED.total_orders,
    avg_ticket = EXCLUDED.avg_ticket,
    total_items_sold = EXCLUDED.total_items_sold,
    discounts_given = EXCLUDED.discounts_given,
    shifts_worked = EXCLUDED.shifts_worked,
    total_labor_hours = EXCLUDED.total_labor_hours,
    updated_at = NOW();
END;
$$;

-- ============================================
-- RLS POLICIES (Multi-Branch)
-- ============================================

-- Organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their organizations" ON organizations
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Users view organizations they have access to" ON organizations
  FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT b.organization_id
      FROM branches b
      JOIN user_branches ub ON ub.branch_id = b.id
      WHERE ub.user_id = auth.uid()
    )
  );

-- Branches
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage branches in their organization" ON branches
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Managers view assigned branches" ON branches
  FOR SELECT USING (can_access_branch(auth.uid(), id));

-- User Branches
ALTER TABLE user_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own branch assignments" ON user_branches
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Owners and admins manage branch assignments" ON user_branches
  FOR ALL USING (
    -- Organization owner
    branch_id IN (
      SELECT b.id FROM branches b
      JOIN organizations o ON o.id = b.organization_id
      WHERE o.owner_id = auth.uid()
    )
    OR
    -- Admin role
    has_role(auth.uid(), 'admin')
  );

-- Push Subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- Branch Stats
ALTER TABLE branch_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view stats for accessible branches" ON branch_stats
  FOR SELECT USING (
    branch_id IN (SELECT * FROM get_user_branch_ids(auth.uid()))
  );

CREATE POLICY "System inserts stats" ON branch_stats
  FOR INSERT WITH CHECK (true);

-- ============================================
-- UPDATE EXISTING RLS POLICIES
-- ============================================

-- Menu Items: Branch-filtered
DROP POLICY IF EXISTS "Users view menu items in their branches" ON menu_items;
DROP POLICY IF EXISTS "Managers modify menu items in their branches" ON menu_items;

CREATE POLICY "Users view menu items in their branches" ON menu_items
  FOR SELECT USING (
    branch_id IS NULL OR 
    branch_id IN (SELECT * FROM get_user_branch_ids(auth.uid()))
  );

CREATE POLICY "Managers modify menu items in their branches" ON menu_items
  FOR ALL USING (
    branch_id IS NULL OR
    (branch_id IN (SELECT * FROM get_user_branch_ids(auth.uid()))
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')))
  );

-- Orders: Branch-filtered
DROP POLICY IF EXISTS "Users view orders in their branches" ON orders;
DROP POLICY IF EXISTS "Staff create orders in their branches" ON orders;
DROP POLICY IF EXISTS "Staff update orders in their branches" ON orders;

CREATE POLICY "Users view orders in their branches" ON orders
  FOR SELECT USING (
    branch_id IS NULL OR
    branch_id IN (SELECT * FROM get_user_branch_ids(auth.uid()))
  );

CREATE POLICY "Staff create orders in their branches" ON orders
  FOR INSERT WITH CHECK (
    branch_id IS NULL OR
    branch_id IN (SELECT * FROM get_user_branch_ids(auth.uid()))
  );

CREATE POLICY "Staff update orders in their branches" ON orders
  FOR UPDATE USING (
    branch_id IS NULL OR
    branch_id IN (SELECT * FROM get_user_branch_ids(auth.uid()))
  );

-- Order Items: Inherit from orders
DROP POLICY IF EXISTS "Users view order items in their branches" ON order_items;
DROP POLICY IF EXISTS "Staff modify order items in their branches" ON order_items;

CREATE POLICY "Users view order items in their branches" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE branch_id IS NULL OR branch_id IN (SELECT * FROM get_user_branch_ids(auth.uid()))
    )
  );

CREATE POLICY "Staff modify order items in their branches" ON order_items
  FOR ALL USING (
    order_id IN (
      SELECT id FROM orders
      WHERE branch_id IS NULL OR branch_id IN (SELECT * FROM get_user_branch_ids(auth.uid()))
    )
  );

-- Customers: Branch-scoped
DROP POLICY IF EXISTS "Users view customers in their branches" ON customers;
DROP POLICY IF EXISTS "Staff manage customers in their branches" ON customers;

CREATE POLICY "Users view customers in their branches" ON customers
  FOR SELECT USING (
    branch_id IS NULL OR
    branch_id IN (SELECT * FROM get_user_branch_ids(auth.uid()))
  );

CREATE POLICY "Staff manage customers in their branches" ON customers
  FOR ALL USING (
    branch_id IS NULL OR
    branch_id IN (SELECT * FROM get_user_branch_ids(auth.uid()))
  );

-- Employees: Branch-scoped
DROP POLICY IF EXISTS "Users view employees in their branches" ON employees;

CREATE POLICY "Users view employees in their branches" ON employees
  FOR SELECT USING (
    branch_id IS NULL OR
    branch_id IN (SELECT * FROM get_user_branch_ids(auth.uid()))
  );

-- Inventory: Branch-scoped
DROP POLICY IF EXISTS "Users view inventory in their branches" ON inventory_items;

CREATE POLICY "Users view inventory in their branches" ON inventory_items
  FOR SELECT USING (
    branch_id IS NULL OR
    branch_id IN (SELECT * FROM get_user_branch_ids(auth.uid()))
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();