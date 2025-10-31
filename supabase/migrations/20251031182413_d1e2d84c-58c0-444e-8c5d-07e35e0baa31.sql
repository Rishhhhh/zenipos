-- Create eighty_six_items table for out-of-stock management
CREATE TABLE IF NOT EXISTS eighty_six_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES branches(id),
  reason TEXT NOT NULL,
  estimated_return_at TIMESTAMPTZ,
  alternative_items JSONB DEFAULT '[]'::jsonb, -- Array of menu_item_ids to suggest
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES employees(id),
  active BOOLEAN DEFAULT true,
  auto_generated BOOLEAN DEFAULT false, -- true if auto-86'd from inventory
  notification_sent BOOLEAN DEFAULT false
);

CREATE INDEX idx_eighty_six_items_menu_item ON eighty_six_items(menu_item_id);
CREATE INDEX idx_eighty_six_items_branch ON eighty_six_items(branch_id);
CREATE INDEX idx_eighty_six_items_active ON eighty_six_items(active) WHERE active = true;
CREATE INDEX idx_eighty_six_items_created ON eighty_six_items(created_at DESC);

-- Enable RLS
ALTER TABLE eighty_six_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view active 86 items"
ON eighty_six_items FOR SELECT
USING (active = true);

CREATE POLICY "Managers can manage 86 items"
ON eighty_six_items FOR ALL
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

CREATE POLICY "Kitchen staff can view 86 items"
ON eighty_six_items FOR SELECT
USING (
  has_role(auth.uid(), 'kitchen') OR
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR
  has_role(auth.uid(), 'cashier')
);

-- Function to mark item as 86'd
CREATE OR REPLACE FUNCTION mark_item_eighty_six(
  menu_item_id_param UUID,
  reason_param TEXT,
  estimated_return_param TIMESTAMPTZ DEFAULT NULL,
  alternative_items_param JSONB DEFAULT '[]'::jsonb,
  branch_id_param UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id UUID;
  v_eighty_six_id UUID;
BEGIN
  -- Get employee_id from auth
  SELECT id INTO v_employee_id
  FROM employees
  WHERE auth_user_id = auth.uid();

  -- Deactivate any existing active 86 for this item
  UPDATE eighty_six_items
  SET active = false,
      resolved_at = NOW(),
      resolved_by = v_employee_id
  WHERE menu_item_id = menu_item_id_param
    AND active = true
    AND (branch_id_param IS NULL OR branch_id = branch_id_param);

  -- Create new 86 entry
  INSERT INTO eighty_six_items (
    menu_item_id,
    branch_id,
    reason,
    estimated_return_at,
    alternative_items,
    created_by
  ) VALUES (
    menu_item_id_param,
    branch_id_param,
    reason_param,
    estimated_return_param,
    alternative_items_param,
    v_employee_id
  )
  RETURNING id INTO v_eighty_six_id;

  -- Mark menu item as out of stock
  UPDATE menu_items
  SET in_stock = false
  WHERE id = menu_item_id_param;

  -- Log to audit
  INSERT INTO audit_log (
    actor,
    action,
    entity,
    entity_id,
    diff
  ) VALUES (
    auth.uid(),
    'item_eighty_sixed',
    'menu_items',
    menu_item_id_param,
    jsonb_build_object('reason', reason_param)
  );

  RETURN v_eighty_six_id;
END;
$$;

-- Function to restore 86'd item
CREATE OR REPLACE FUNCTION restore_eighty_six_item(
  eighty_six_id_param UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id UUID;
  v_menu_item_id UUID;
BEGIN
  -- Get employee_id from auth
  SELECT id INTO v_employee_id
  FROM employees
  WHERE auth_user_id = auth.uid();

  -- Get menu_item_id before deactivating
  SELECT menu_item_id INTO v_menu_item_id
  FROM eighty_six_items
  WHERE id = eighty_six_id_param;

  -- Deactivate 86 entry
  UPDATE eighty_six_items
  SET active = false,
      resolved_at = NOW(),
      resolved_by = v_employee_id
  WHERE id = eighty_six_id_param;

  -- Mark menu item as back in stock
  UPDATE menu_items
  SET in_stock = true
  WHERE id = v_menu_item_id;

  -- Log to audit
  INSERT INTO audit_log (
    actor,
    action,
    entity,
    entity_id,
    diff
  ) VALUES (
    auth.uid(),
    'item_restored',
    'menu_items',
    v_menu_item_id,
    jsonb_build_object('eighty_six_id', eighty_six_id_param)
  );
END;
$$;

-- Function to get active 86 items
CREATE OR REPLACE FUNCTION get_active_eighty_six_items(
  branch_id_param UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  menu_item_id UUID,
  menu_item_name TEXT,
  menu_item_category TEXT,
  reason TEXT,
  estimated_return_at TIMESTAMPTZ,
  alternative_items JSONB,
  created_by_name TEXT,
  created_at TIMESTAMPTZ,
  auto_generated BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ei.id,
    ei.menu_item_id,
    mi.name as menu_item_name,
    mc.name as menu_item_category,
    ei.reason,
    ei.estimated_return_at,
    ei.alternative_items,
    e.name as created_by_name,
    ei.created_at,
    ei.auto_generated
  FROM eighty_six_items ei
  JOIN menu_items mi ON mi.id = ei.menu_item_id
  LEFT JOIN menu_categories mc ON mc.id = mi.category_id
  LEFT JOIN employees e ON e.id = ei.created_by
  WHERE ei.active = true
    AND (branch_id_param IS NULL OR ei.branch_id = branch_id_param)
  ORDER BY ei.created_at DESC;
$$;

-- Trigger to auto-86 items when inventory hits zero
CREATE OR REPLACE FUNCTION auto_eighty_six_on_inventory_zero()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_menu_item_id UUID;
  v_already_eighty_sixed BOOLEAN;
BEGIN
  -- Only trigger if current_qty reaches 0
  IF NEW.current_qty <= 0 AND OLD.current_qty > 0 THEN
    -- Find menu items that use this inventory item
    FOR v_menu_item_id IN
      SELECT DISTINCT r.menu_item_id
      FROM recipes r
      WHERE r.inventory_item_id = NEW.id
    LOOP
      -- Check if already 86'd
      SELECT EXISTS(
        SELECT 1 FROM eighty_six_items
        WHERE menu_item_id = v_menu_item_id
          AND active = true
      ) INTO v_already_eighty_sixed;

      IF NOT v_already_eighty_sixed THEN
        -- Auto-86 the menu item
        INSERT INTO eighty_six_items (
          menu_item_id,
          reason,
          auto_generated,
          created_at
        ) VALUES (
          v_menu_item_id,
          'Auto-86: Inventory out of stock - ' || NEW.name,
          true,
          NOW()
        );

        -- Mark menu item as out of stock
        UPDATE menu_items
        SET in_stock = false
        WHERE id = v_menu_item_id;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_eighty_six
AFTER UPDATE ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION auto_eighty_six_on_inventory_zero();

-- Enable Realtime for 86 list
ALTER PUBLICATION supabase_realtime ADD TABLE eighty_six_items;

-- Set replica identity for realtime updates
ALTER TABLE eighty_six_items REPLICA IDENTITY FULL;