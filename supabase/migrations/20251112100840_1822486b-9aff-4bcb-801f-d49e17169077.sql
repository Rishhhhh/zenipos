-- ============================================
-- Phase 2.4.1: Role Security Hardening
-- Add RLS policies using has_role() function
-- ============================================

-- 1. Drop existing permissive policies on critical tables
DROP POLICY IF EXISTS "Users can view orders" ON orders;
DROP POLICY IF EXISTS "Users can insert orders" ON orders;
DROP POLICY IF EXISTS "Users can update orders" ON orders;
DROP POLICY IF EXISTS "Users can view menu_items" ON menu_items;
DROP POLICY IF EXISTS "Users can update menu_items" ON menu_items;
DROP POLICY IF EXISTS "Users can view branches" ON branches;

-- 2. Create secure RLS policies using has_role() on orders table
CREATE POLICY "Owners can view all organization orders"
  ON orders FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'owner'));

CREATE POLICY "Managers can view all organization orders"
  ON orders FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'staff') 
    AND created_by = auth.uid()
  );

CREATE POLICY "Staff and managers can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'staff') 
    OR has_role(auth.uid(), 'manager')
    OR has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Managers and owners can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'manager')
    OR has_role(auth.uid(), 'owner')
  );

-- 3. Create secure RLS policies on menu_items table
CREATE POLICY "All authenticated users can view menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only managers and owners can modify menu items"
  ON menu_items FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'manager')
    OR has_role(auth.uid(), 'owner')
  );

-- 4. Create secure RLS policies on branches table
CREATE POLICY "All authenticated users can view branches"
  ON branches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only owners can modify branches"
  ON branches FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'owner'));

-- 5. Create secure RLS policies on employees table
CREATE POLICY "All authenticated users can view employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only managers and owners can modify employees"
  ON employees FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'manager')
    OR has_role(auth.uid(), 'owner')
  );

-- 6. Add audit logging for role checks
CREATE OR REPLACE FUNCTION log_role_access()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO audit_log (
      actor,
      action,
      entity,
      entity_id,
      diff
    ) VALUES (
      auth.uid(),
      'role_change',
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_employee_role_changes
  AFTER UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION log_role_access();

CREATE TRIGGER audit_user_role_changes
  AFTER UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION log_role_access();