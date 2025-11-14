-- =====================================================
-- COMPLETE FIX: Resolve all branch-related errors
-- =====================================================

-- FIX 1: Create wrapper function for backward compatibility
CREATE OR REPLACE FUNCTION public.get_user_branch_ids(_user_id uuid)
RETURNS TABLE(branch_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT branch_id FROM public.get_accessible_branch_ids(_user_id);
$$;

COMMENT ON FUNCTION public.get_user_branch_ids IS 'Wrapper for get_accessible_branch_ids for backward compatibility';

-- =====================================================
-- FIX 2: Add branch_id to shifts table
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shifts' 
    AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE public.shifts 
    ADD COLUMN branch_id uuid;
    
    ALTER TABLE public.shifts
    ADD CONSTRAINT shifts_branch_id_fkey 
    FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_shifts_branch_id ON public.shifts(branch_id);
    
    UPDATE public.shifts s
    SET branch_id = e.branch_id
    FROM public.employees e
    WHERE s.employee_id = e.id
      AND s.branch_id IS NULL;
      
    COMMENT ON COLUMN public.shifts.branch_id IS 'Branch where the shift took place';
  END IF;
END $$;

-- =====================================================
-- FIX 3: Update ALL policies to use correct function
-- =====================================================

-- Update employee policies
DROP POLICY IF EXISTS "Users view employees in their branches" ON public.employees;
DROP POLICY IF EXISTS "Users view employees in accessible branches" ON public.employees;

CREATE POLICY "Users view employees in accessible branches"
ON public.employees
FOR SELECT
TO authenticated
USING (
  branch_id IN (SELECT branch_id FROM public.get_accessible_branch_ids(auth.uid()))
);

-- Update menu_items policies
DROP POLICY IF EXISTS "Users view menu items in their branches" ON public.menu_items;
DROP POLICY IF EXISTS "Users view menu items in accessible branches" ON public.menu_items;
DROP POLICY IF EXISTS "Managers manage menu items in their branches" ON public.menu_items;
DROP POLICY IF EXISTS "Managers manage menu items in accessible branches" ON public.menu_items;

CREATE POLICY "Users view menu items in accessible branches"
ON public.menu_items
FOR SELECT
TO authenticated
USING (branch_id IN (SELECT branch_id FROM public.get_accessible_branch_ids(auth.uid())));

CREATE POLICY "Managers manage menu items in accessible branches"
ON public.menu_items
FOR ALL
TO authenticated
USING (
  (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  AND branch_id IN (SELECT branch_id FROM public.get_accessible_branch_ids(auth.uid()))
);

-- Update customers policies
DROP POLICY IF EXISTS "Staff manage customers in their branches" ON public.customers;
DROP POLICY IF EXISTS "Users view customers in their branches" ON public.customers;
DROP POLICY IF EXISTS "Staff manage customers in accessible branches" ON public.customers;
DROP POLICY IF EXISTS "Users view customers in accessible branches" ON public.customers;

CREATE POLICY "Staff manage customers in accessible branches"
ON public.customers
FOR ALL
TO authenticated
USING (branch_id IN (SELECT branch_id FROM public.get_accessible_branch_ids(auth.uid())));

-- Update inventory policies
DROP POLICY IF EXISTS "Users view inventory in their branches" ON public.inventory_items;
DROP POLICY IF EXISTS "Managers manage inventory in their branches" ON public.inventory_items;
DROP POLICY IF EXISTS "Users view inventory in accessible branches" ON public.inventory_items;
DROP POLICY IF EXISTS "Managers manage inventory in accessible branches" ON public.inventory_items;

CREATE POLICY "Users view inventory in accessible branches"
ON public.inventory_items
FOR SELECT
TO authenticated
USING (branch_id IN (SELECT branch_id FROM public.get_accessible_branch_ids(auth.uid())));

CREATE POLICY "Managers manage inventory in accessible branches"
ON public.inventory_items
FOR ALL
TO authenticated
USING (
  (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  AND branch_id IN (SELECT branch_id FROM public.get_accessible_branch_ids(auth.uid()))
);

-- Update menu_categories policies
DROP POLICY IF EXISTS "Users view categories in their branches" ON public.menu_categories;
DROP POLICY IF EXISTS "Managers manage categories in their branches" ON public.menu_categories;
DROP POLICY IF EXISTS "Users view categories in accessible branches" ON public.menu_categories;
DROP POLICY IF EXISTS "Managers manage categories in accessible branches" ON public.menu_categories;

CREATE POLICY "Users view categories in accessible branches"
ON public.menu_categories
FOR SELECT
TO authenticated
USING (branch_id IN (SELECT branch_id FROM public.get_accessible_branch_ids(auth.uid())));

CREATE POLICY "Managers manage categories in accessible branches"
ON public.menu_categories
FOR ALL
TO authenticated
USING (
  (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  AND branch_id IN (SELECT branch_id FROM public.get_accessible_branch_ids(auth.uid()))
);

-- Update orders policies
DROP POLICY IF EXISTS "Users view orders in their branches" ON public.orders;
DROP POLICY IF EXISTS "Staff manage orders in their branches" ON public.orders;
DROP POLICY IF EXISTS "Users view orders in accessible branches" ON public.orders;
DROP POLICY IF EXISTS "Staff manage orders in accessible branches" ON public.orders;

CREATE POLICY "Users view orders in accessible branches"
ON public.orders
FOR SELECT
TO authenticated
USING (branch_id IN (SELECT branch_id FROM public.get_accessible_branch_ids(auth.uid())));

CREATE POLICY "Staff manage orders in accessible branches"
ON public.orders
FOR ALL
TO authenticated
USING (branch_id IN (SELECT branch_id FROM public.get_accessible_branch_ids(auth.uid())));