-- Create order_modifications table
CREATE TABLE IF NOT EXISTS order_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  modification_type TEXT NOT NULL, -- 'add', 'remove', 'modify', 'void', 'recall'
  previous_value JSONB,
  new_value JSONB,
  reason TEXT,
  modified_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  approval_required BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  wastage_logged BOOLEAN DEFAULT false,
  wastage_cost NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_modifications_order ON order_modifications(order_id);
CREATE INDEX idx_order_modifications_item ON order_modifications(order_item_id);
CREATE INDEX idx_order_modifications_type ON order_modifications(modification_type);
CREATE INDEX idx_order_modifications_created ON order_modifications(created_at DESC);

-- Add recall status to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS recall_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recall_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS recall_requested_by UUID REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS recall_approved BOOLEAN DEFAULT false;

-- Add modification tracking to order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS modified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS modification_notes TEXT;

-- Enable RLS
ALTER TABLE order_modifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view modifications"
ON order_modifications FOR SELECT
USING (
  has_role(auth.uid(), 'cashier') OR
  has_role(auth.uid(), 'kitchen') OR
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

CREATE POLICY "Staff can create modifications"
ON order_modifications FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'cashier') OR
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

CREATE POLICY "Managers can approve modifications"
ON order_modifications FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

-- Function to recall order (before preparation started)
CREATE OR REPLACE FUNCTION recall_order(
  order_id_param UUID,
  reason_param TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id UUID;
  v_order_status TEXT;
  v_items_started INTEGER;
  v_result JSONB;
BEGIN
  -- Get employee_id from auth
  SELECT id INTO v_employee_id
  FROM employees
  WHERE auth_user_id = auth.uid();

  -- Check order status
  SELECT status INTO v_order_status
  FROM orders
  WHERE id = order_id_param;

  IF v_order_status NOT IN ('pending', 'preparing') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order cannot be recalled in current status: ' || v_order_status
    );
  END IF;

  -- Check if any items have started preparation
  SELECT COUNT(*) INTO v_items_started
  FROM kds_item_status
  WHERE order_item_id IN (
    SELECT id FROM order_items WHERE order_id = order_id_param
  )
  AND status IN ('preparing', 'completed');

  IF v_items_started > 0 THEN
    -- Requires manager approval
    UPDATE orders
    SET recall_requested = true,
        recall_requested_at = NOW(),
        recall_requested_by = v_employee_id
    WHERE id = order_id_param;

    INSERT INTO order_modifications (
      order_id,
      modification_type,
      reason,
      modified_by,
      approval_required,
      approval_status
    ) VALUES (
      order_id_param,
      'recall',
      reason_param || ' (Items already started - requires approval)',
      v_employee_id,
      true,
      'pending'
    );

    RETURN jsonb_build_object(
      'success', true,
      'requires_approval', true,
      'message', 'Recall request sent to manager'
    );
  ELSE
    -- Can recall immediately
    UPDATE orders
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = order_id_param;

    -- Remove from KDS queue
    DELETE FROM kds_item_status
    WHERE order_item_id IN (
      SELECT id FROM order_items WHERE order_id = order_id_param
    );

    -- Log modification
    INSERT INTO order_modifications (
      order_id,
      modification_type,
      reason,
      modified_by,
      approval_required,
      approval_status
    ) VALUES (
      order_id_param,
      'recall',
      reason_param,
      v_employee_id,
      false,
      'approved'
    );

    -- Audit log
    INSERT INTO audit_log (
      actor,
      action,
      entity,
      entity_id,
      diff
    ) VALUES (
      auth.uid(),
      'recall_order',
      'orders',
      order_id_param,
      jsonb_build_object('reason', reason_param)
    );

    RETURN jsonb_build_object(
      'success', true,
      'requires_approval', false,
      'message', 'Order recalled successfully'
    );
  END IF;
END;
$$;

-- Function to approve recall
CREATE OR REPLACE FUNCTION approve_recall(
  order_id_param UUID,
  modification_id_param UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id UUID;
  v_order_total NUMERIC;
  v_wastage_cost NUMERIC := 0;
BEGIN
  -- Get manager employee_id
  SELECT id INTO v_employee_id
  FROM employees
  WHERE auth_user_id = auth.uid()
    AND role IN ('manager', 'admin');

  IF v_employee_id IS NULL THEN
    RAISE EXCEPTION 'Only managers can approve recalls';
  END IF;

  -- Calculate wastage cost (items that were started)
  SELECT COALESCE(SUM(oi.unit_price * oi.quantity), 0)
  INTO v_wastage_cost
  FROM order_items oi
  WHERE oi.order_id = order_id_param
    AND EXISTS (
      SELECT 1 FROM kds_item_status kis
      WHERE kis.order_item_id = oi.id
        AND kis.status IN ('preparing', 'completed')
    );

  -- Cancel the order
  UPDATE orders
  SET status = 'cancelled',
      recall_approved = true,
      updated_at = NOW()
  WHERE id = order_id_param;

  -- Update modification record
  UPDATE order_modifications
  SET approval_status = 'approved',
      approved_by = v_employee_id,
      wastage_logged = true,
      wastage_cost = v_wastage_cost
  WHERE id = modification_id_param;

  -- Log wastage if any
  IF v_wastage_cost > 0 THEN
    INSERT INTO audit_log (
      actor,
      action,
      entity,
      entity_id,
      diff
    ) VALUES (
      auth.uid(),
      'order_wastage',
      'orders',
      order_id_param,
      jsonb_build_object('wastage_cost', v_wastage_cost, 'type', 'recall')
    );
  END IF;

  -- Remove from KDS
  DELETE FROM kds_item_status
  WHERE order_item_id IN (
    SELECT id FROM order_items WHERE order_id = order_id_param
  );
END;
$$;

-- Function to add items to existing order
CREATE OR REPLACE FUNCTION add_items_to_order(
  order_id_param UUID,
  new_items JSONB -- Array of {menu_item_id, quantity, notes, modifiers}
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id UUID;
  v_item JSONB;
  v_menu_item RECORD;
  v_new_item_id UUID;
BEGIN
  -- Get employee_id
  SELECT id INTO v_employee_id
  FROM employees
  WHERE auth_user_id = auth.uid();

  -- Loop through new items
  FOR v_item IN SELECT * FROM jsonb_array_elements(new_items)
  LOOP
    -- Get menu item details
    SELECT * INTO v_menu_item
    FROM menu_items
    WHERE id = (v_item->>'menu_item_id')::UUID;

    -- Insert new order item
    INSERT INTO order_items (
      order_id,
      menu_item_id,
      quantity,
      unit_price,
      notes,
      modifiers,
      modified
    ) VALUES (
      order_id_param,
      (v_item->>'menu_item_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      v_menu_item.price,
      v_item->>'notes',
      COALESCE(v_item->'modifiers', '[]'::jsonb),
      true
    )
    RETURNING id INTO v_new_item_id;

    -- Log modification
    INSERT INTO order_modifications (
      order_id,
      order_item_id,
      modification_type,
      new_value,
      modified_by
    ) VALUES (
      order_id_param,
      v_new_item_id,
      'add',
      v_item,
      v_employee_id
    );
  END LOOP;

  -- Update order total
  UPDATE orders
  SET 
    subtotal = (SELECT SUM(unit_price * quantity) FROM order_items WHERE order_id = order_id_param),
    total = (SELECT SUM(unit_price * quantity) FROM order_items WHERE order_id = order_id_param),
    updated_at = NOW()
  WHERE id = order_id_param;
END;
$$;

-- Function to void order item
CREATE OR REPLACE FUNCTION void_order_item(
  order_item_id_param UUID,
  reason_param TEXT,
  requires_approval_param BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id UUID;
  v_order_id UUID;
  v_item_record RECORD;
  v_modification_id UUID;
  v_wastage_cost NUMERIC := 0;
  v_item_started BOOLEAN;
BEGIN
  -- Get employee_id
  SELECT id INTO v_employee_id
  FROM employees
  WHERE auth_user_id = auth.uid();

  -- Get item details
  SELECT oi.*, o.id as order_id
  INTO v_item_record
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.id = order_item_id_param;

  v_order_id := v_item_record.order_id;

  -- Check if item has been started in kitchen
  SELECT EXISTS(
    SELECT 1 FROM kds_item_status
    WHERE order_item_id = order_item_id_param
      AND status IN ('preparing', 'completed')
  ) INTO v_item_started;

  -- Calculate wastage if started
  IF v_item_started THEN
    v_wastage_cost := v_item_record.unit_price * v_item_record.quantity;
  END IF;

  -- Create modification record
  INSERT INTO order_modifications (
    order_id,
    order_item_id,
    modification_type,
    previous_value,
    reason,
    modified_by,
    approval_required,
    approval_status,
    wastage_cost,
    wastage_logged
  ) VALUES (
    v_order_id,
    order_item_id_param,
    'void',
    to_jsonb(v_item_record),
    reason_param,
    v_employee_id,
    requires_approval_param OR v_item_started,
    CASE WHEN requires_approval_param OR v_item_started THEN 'pending' ELSE 'approved' END,
    v_wastage_cost,
    v_item_started
  )
  RETURNING id INTO v_modification_id;

  -- If no approval required, void immediately
  IF NOT (requires_approval_param OR v_item_started) THEN
    DELETE FROM order_items WHERE id = order_item_id_param;
    
    -- Update order total
    UPDATE orders
    SET 
      subtotal = (SELECT COALESCE(SUM(unit_price * quantity), 0) FROM order_items WHERE order_id = v_order_id),
      total = (SELECT COALESCE(SUM(unit_price * quantity), 0) FROM order_items WHERE order_id = v_order_id),
      updated_at = NOW()
    WHERE id = v_order_id;
  END IF;

  RETURN v_modification_id;
END;
$$;

-- Enable Realtime for modifications
ALTER PUBLICATION supabase_realtime ADD TABLE order_modifications;
ALTER TABLE order_modifications REPLICA IDENTITY FULL;