-- PHASE 1: Database Isolation & Cleanup (Corrected)

-- ============================================================================
-- STEP 1: Data Cleanup & Population
-- ============================================================================

-- 1a. Assign branch_id to orphaned promotions (get first available branch)
UPDATE promotions 
SET branch_id = (
  SELECT id FROM branches 
  WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
  LIMIT 1
)
WHERE branch_id IS NULL;

-- 1b. Add branch_id to suppliers if not exists (nullable first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1c. Populate suppliers with branch_id
UPDATE suppliers
SET branch_id = (
  SELECT id FROM branches 
  WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
  LIMIT 1
)
WHERE branch_id IS NULL;

-- 1d. Delete orphaned records if any remain
DELETE FROM promotions WHERE branch_id IS NULL;
DELETE FROM suppliers WHERE branch_id IS NULL;

-- ============================================================================
-- STEP 2: Apply NOT NULL Constraints
-- ============================================================================

-- 2a. Make promotions.branch_id NOT NULL
ALTER TABLE promotions ALTER COLUMN branch_id SET NOT NULL;

-- 2b. Make suppliers.branch_id NOT NULL
ALTER TABLE suppliers ALTER COLUMN branch_id SET NOT NULL;

-- 2c. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotions_branch_id ON promotions(branch_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_branch_id ON suppliers(branch_id);

-- ============================================================================
-- STEP 3: Update RLS Policies for Promotions
-- ============================================================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;
DROP POLICY IF EXISTS "Authenticated users can manage promotions" ON promotions;
DROP POLICY IF EXISTS "Allow public read promotions" ON promotions;
DROP POLICY IF EXISTS "Managers can manage promotions" ON promotions;

-- Create strict branch-isolated policies
CREATE POLICY "Users view promotions in their branches" ON promotions
FOR SELECT USING (
  branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
);

CREATE POLICY "Managers manage promotions in their branches" ON promotions
FOR ALL USING (
  (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  AND branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
);

-- ============================================================================
-- STEP 4: Update RLS Policies for Suppliers
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON suppliers;
DROP POLICY IF EXISTS "Managers can manage suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow public read suppliers" ON suppliers;

-- Create strict branch-isolated policies
CREATE POLICY "Users view suppliers in their branches" ON suppliers
FOR SELECT USING (
  branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
);

CREATE POLICY "Managers manage suppliers in their branches" ON suppliers
FOR ALL USING (
  (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  AND branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
);

-- ============================================================================
-- STEP 5: Create Purchase Orders System
-- ============================================================================

-- 5a. Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'submitted', 'approved', 'receiving', 'received', 'cancelled')),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  expected_delivery TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES employees(id),
  received_at TIMESTAMP WITH TIME ZONE,
  received_by UUID REFERENCES employees(id),
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(branch_id, order_number)
);

-- 5b. Create indexes for purchase_orders
CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch_id ON purchase_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at ON purchase_orders(created_at DESC);

-- 5c. Enable RLS for purchase_orders
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view purchase orders in their branches" ON purchase_orders
FOR SELECT USING (
  branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
);

CREATE POLICY "Managers manage purchase orders in their branches" ON purchase_orders
FOR ALL USING (
  (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  AND branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
);

-- 5d. Create purchase_order_items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
  total_cost NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  received_quantity NUMERIC(10,3) DEFAULT 0 CHECK (received_quantity >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5e. Create indexes for purchase_order_items
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_inventory_item_id ON purchase_order_items(inventory_item_id);

-- 5f. Enable RLS for purchase_order_items
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view PO items for accessible POs" ON purchase_order_items
FOR SELECT USING (
  purchase_order_id IN (
    SELECT id FROM purchase_orders 
    WHERE branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
  )
);

CREATE POLICY "Managers manage PO items for accessible POs" ON purchase_order_items
FOR ALL USING (
  (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'manager'))
  AND purchase_order_id IN (
    SELECT id FROM purchase_orders 
    WHERE branch_id IN (SELECT branch_id FROM get_user_branch_ids(auth.uid()))
  )
);

-- 5g. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at 
BEFORE UPDATE ON purchase_orders 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 6: PO Number Generator Function
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_po_number(branch_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  branch_code TEXT;
BEGIN
  -- Get branch code (first 3 chars of branch name, uppercase)
  SELECT UPPER(LEFT(name, 3)) INTO branch_code 
  FROM branches 
  WHERE id = branch_id_param;
  
  -- Get next sequential number for this branch
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '\d+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM purchase_orders
  WHERE branch_id = branch_id_param;
  
  -- Return formatted PO number: PO-BRN-00001
  RETURN 'PO-' || COALESCE(branch_code, 'XXX') || '-' || LPAD(next_number::TEXT, 5, '0');
END;
$$;

-- ============================================================================
-- STEP 7: Station System Cleanup
-- ============================================================================

-- 7a. Remove station_id from menu_items
ALTER TABLE menu_items DROP COLUMN IF EXISTS station_id;

-- 7b. Drop station tables (cascade will handle foreign keys)
DROP TABLE IF EXISTS station_routing_rules CASCADE;
DROP TABLE IF EXISTS stations CASCADE;