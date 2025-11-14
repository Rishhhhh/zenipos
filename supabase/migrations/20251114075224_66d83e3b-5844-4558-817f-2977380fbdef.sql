-- Phase 2 & 3: Fix RLS Policies and Add NOT NULL Constraints

-- ============================================================
-- STEP 1: Drop overly permissive policies on menu_items
-- ============================================================
DROP POLICY IF EXISTS "All authenticated users can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Allow authenticated all menu_items" ON menu_items;

-- ============================================================
-- STEP 2: Recreate strict RLS policies WITHOUT NULL loopholes
-- ============================================================

-- Menu Items: Strict branch-based access
DROP POLICY IF EXISTS "Users view menu items in their branches" ON menu_items;
CREATE POLICY "Users view menu items in their branches" ON menu_items
  FOR SELECT USING (
    branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "Managers manage menu items in their branches" ON menu_items;
CREATE POLICY "Managers manage menu items in their branches" ON menu_items
  FOR ALL USING (
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
    AND branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
  );

-- Customers: Strict branch-based access
DROP POLICY IF EXISTS "Staff manage customers in their branches" ON customers;
CREATE POLICY "Staff manage customers in their branches" ON customers
  FOR ALL USING (
    branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "Users view customers in their branches" ON customers;
CREATE POLICY "Users view customers in their branches" ON customers
  FOR SELECT USING (
    branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
  );

-- Inventory Items: Strict branch-based access
DROP POLICY IF EXISTS "Users view inventory in their branches" ON inventory_items;
CREATE POLICY "Users view inventory in their branches" ON inventory_items
  FOR SELECT USING (
    branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "Managers can manage inventory" ON inventory_items;
CREATE POLICY "Managers manage inventory in their branches" ON inventory_items
  FOR ALL USING (
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
    AND branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
  );

-- Menu Categories: Add strict branch-based policy
DROP POLICY IF EXISTS "Users view categories in their branches" ON menu_categories;
CREATE POLICY "Users view categories in their branches" ON menu_categories
  FOR SELECT USING (
    branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "Managers manage categories in their branches" ON menu_categories;
CREATE POLICY "Managers manage categories in their branches" ON menu_categories
  FOR ALL USING (
    (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
    AND branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
  );

-- Employees: Strict branch-based access (remove NULL loophole)
DROP POLICY IF EXISTS "Users view employees in their branches" ON employees;
CREATE POLICY "Users view employees in their branches" ON employees
  FOR SELECT USING (
    branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
  );

-- Orders: Ensure strict branch isolation
DROP POLICY IF EXISTS "Users view orders in their branches" ON orders;
CREATE POLICY "Users view orders in their branches" ON orders
  FOR SELECT USING (
    branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "Staff manage orders in their branches" ON orders;
CREATE POLICY "Staff manage orders in their branches" ON orders
  FOR ALL USING (
    branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
  );

-- ============================================================
-- STEP 3: Add NOT NULL constraints to enforce branch_id
-- ============================================================

-- Add NOT NULL constraint to menu_items
ALTER TABLE menu_items ALTER COLUMN branch_id SET NOT NULL;

-- Add NOT NULL constraint to menu_categories  
ALTER TABLE menu_categories ALTER COLUMN branch_id SET NOT NULL;

-- Add NOT NULL constraint to inventory_items (allow NULL temporarily for system-wide items if needed)
-- We'll make it NOT NULL to enforce strict isolation
ALTER TABLE inventory_items ALTER COLUMN branch_id SET NOT NULL;

-- Add NOT NULL to customers (customers should always belong to a branch)
ALTER TABLE customers ALTER COLUMN branch_id SET NOT NULL;

-- Add NOT NULL to orders
ALTER TABLE orders ALTER COLUMN branch_id SET NOT NULL;

-- ============================================================
-- STEP 4: Add default branch_id for insert operations
-- ============================================================

-- Create helper function to get user's default branch
CREATE OR REPLACE FUNCTION get_user_default_branch(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id 
  FROM employees 
  WHERE auth_user_id = _user_id 
    AND active = true 
  LIMIT 1;
$$;