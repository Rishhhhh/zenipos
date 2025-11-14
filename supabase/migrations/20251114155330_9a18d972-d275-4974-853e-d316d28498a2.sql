-- Phase 2: Fix RLS Policies for All Branch-Scoped Tables
-- Remove all helper function dependencies, use direct JOINs

-- ==========================================
-- 1. MENU_CATEGORIES
-- ==========================================
DROP POLICY IF EXISTS "menu_categories_select" ON public.menu_categories;
DROP POLICY IF EXISTS "menu_categories_write" ON public.menu_categories;
DROP POLICY IF EXISTS "Users view menu categories in accessible branches" ON public.menu_categories;
DROP POLICY IF EXISTS "Managers manage menu categories" ON public.menu_categories;

CREATE POLICY "menu_categories_select"
ON public.menu_categories FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.employees e WHERE e.auth_user_id = auth.uid() AND e.branch_id = menu_categories.branch_id)
  OR EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
             WHERE o.owner_id = auth.uid() AND b.id = menu_categories.branch_id)
);

CREATE POLICY "menu_categories_write"
ON public.menu_categories FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
          WHERE o.owner_id = auth.uid() AND b.id = menu_categories.branch_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
          WHERE o.owner_id = auth.uid() AND b.id = menu_categories.branch_id)
);

-- ==========================================
-- 2. MENU_ITEMS
-- ==========================================
DROP POLICY IF EXISTS "menu_items_select" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_write" ON public.menu_items;
DROP POLICY IF EXISTS "Users view menu items in accessible branches" ON public.menu_items;
DROP POLICY IF EXISTS "Managers manage menu items in accessible branches" ON public.menu_items;

CREATE POLICY "menu_items_select"
ON public.menu_items FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.employees e WHERE e.auth_user_id = auth.uid() AND e.branch_id = menu_items.branch_id)
  OR EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
             WHERE o.owner_id = auth.uid() AND b.id = menu_items.branch_id)
);

CREATE POLICY "menu_items_write"
ON public.menu_items FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
          WHERE o.owner_id = auth.uid() AND b.id = menu_items.branch_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
          WHERE o.owner_id = auth.uid() AND b.id = menu_items.branch_id)
);

-- ==========================================
-- 3. INVENTORY_ITEMS
-- ==========================================
DROP POLICY IF EXISTS "Authenticated users can view inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Managers manage inventory in accessible branches" ON public.inventory_items;
DROP POLICY IF EXISTS "Users view inventory in accessible branches" ON public.inventory_items;

CREATE POLICY "inventory_items_select"
ON public.inventory_items FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.employees e WHERE e.auth_user_id = auth.uid() AND e.branch_id = inventory_items.branch_id)
  OR EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
             WHERE o.owner_id = auth.uid() AND b.id = inventory_items.branch_id)
);

CREATE POLICY "inventory_items_write"
ON public.inventory_items FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
          WHERE o.owner_id = auth.uid() AND b.id = inventory_items.branch_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
          WHERE o.owner_id = auth.uid() AND b.id = inventory_items.branch_id)
);

-- ==========================================
-- 4. CUSTOMERS
-- ==========================================
DROP POLICY IF EXISTS "Staff can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Staff can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Staff manage customers in accessible branches" ON public.customers;

CREATE POLICY "customers_select"
ON public.customers FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.employees e WHERE e.auth_user_id = auth.uid() AND e.branch_id = customers.branch_id)
  OR EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
             WHERE o.owner_id = auth.uid() AND b.id = customers.branch_id)
);

CREATE POLICY "customers_write"
ON public.customers FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.employees e WHERE e.auth_user_id = auth.uid() AND e.branch_id = customers.branch_id)
  OR EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
          WHERE o.owner_id = auth.uid() AND b.id = customers.branch_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.employees e WHERE e.auth_user_id = auth.uid() AND e.branch_id = customers.branch_id)
  OR EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
          WHERE o.owner_id = auth.uid() AND b.id = customers.branch_id)
);

-- ==========================================
-- 5. EMPLOYEES
-- ==========================================
DROP POLICY IF EXISTS "Admins and managers can manage employees" ON public.employees;
DROP POLICY IF EXISTS "All authenticated users can view employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated can view active employees" ON public.employees;
DROP POLICY IF EXISTS "Only managers and owners can modify employees" ON public.employees;
DROP POLICY IF EXISTS "Users view employees in accessible branches" ON public.employees;

CREATE POLICY "employees_select"
ON public.employees FOR SELECT TO authenticated
USING (
  auth.uid() = employees.auth_user_id
  OR EXISTS (SELECT 1 FROM public.employees e WHERE e.auth_user_id = auth.uid() AND e.branch_id = employees.branch_id)
  OR EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
             WHERE o.owner_id = auth.uid() AND b.id = employees.branch_id)
);

CREATE POLICY "employees_write"
ON public.employees FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
          WHERE o.owner_id = auth.uid() AND b.id = employees.branch_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
          WHERE o.owner_id = auth.uid() AND b.id = employees.branch_id)
);

-- ==========================================
-- 6. DEVICES
-- ==========================================
DROP POLICY IF EXISTS "Managers manage devices in accessible branches" ON public.devices;
DROP POLICY IF EXISTS "Users view devices in accessible branches" ON public.devices;

CREATE POLICY "devices_select"
ON public.devices FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.employees e WHERE e.auth_user_id = auth.uid() AND e.branch_id = devices.branch_id)
  OR EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
             WHERE o.owner_id = auth.uid() AND b.id = devices.branch_id)
);

CREATE POLICY "devices_write"
ON public.devices FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
          WHERE o.owner_id = auth.uid() AND b.id = devices.branch_id)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.organizations o JOIN public.branches b ON b.organization_id = o.id 
          WHERE o.owner_id = auth.uid() AND b.id = devices.branch_id)
);