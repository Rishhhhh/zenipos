-- Phase 2.4: Fix Employees Table RLS Recursion
-- Create security definer function to break circular dependency

-- Drop existing problematic policy
DROP POLICY IF EXISTS "employees_select" ON public.employees;

-- Create security definer function to check employee status without RLS
CREATE OR REPLACE FUNCTION public.is_employee_in_branch(_user_id UUID, _branch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE auth_user_id = _user_id
    AND branch_id = _branch_id
    AND active = true
  );
$$;

-- Create new employees_select policy using the security definer function
CREATE POLICY "employees_select"
ON public.employees
FOR SELECT
TO authenticated
USING (
  -- User viewing their own employee record
  auth.uid() = auth_user_id
  -- OR user is an employee in the same branch (using security definer function)
  OR public.is_employee_in_branch(auth.uid(), employees.branch_id)
  -- OR user is the organization owner
  OR EXISTS (
    SELECT 1
    FROM organizations o
    JOIN branches b ON b.organization_id = o.id
    WHERE o.owner_id = auth.uid()
    AND b.id = employees.branch_id
  )
);