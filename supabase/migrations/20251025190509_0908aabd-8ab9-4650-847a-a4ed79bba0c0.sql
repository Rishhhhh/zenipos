-- ============================================
-- 1. SUPPLIERS
-- ============================================

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suppliers_active ON suppliers(active);

-- RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view suppliers" ON suppliers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage suppliers" ON suppliers
  FOR ALL TO authenticated USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );

-- ============================================
-- 2. INVENTORY ITEMS (Ingredients/Raw Materials)
-- ============================================

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'g', 'l', 'ml', 'pcs', 'box', 'pack')),
  current_qty NUMERIC(10,3) DEFAULT 0 CHECK (current_qty >= 0),
  reorder_point NUMERIC(10,3) DEFAULT 0,
  reorder_qty NUMERIC(10,3) DEFAULT 0,
  cost_per_unit NUMERIC(10,2) DEFAULT 0,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  category TEXT,
  storage_location TEXT,
  expiry_alert_days INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_items_low_stock ON inventory_items(current_qty, reorder_point)
  WHERE current_qty <= reorder_point;
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);

-- RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view inventory" ON inventory_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage inventory" ON inventory_items
  FOR ALL TO authenticated USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );

-- ============================================
-- 3. RECIPES (Bill of Materials)
-- ============================================

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE NOT NULL,
  quantity_per_serving NUMERIC(10,3) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_item_id, inventory_item_id)
);

CREATE INDEX idx_recipes_menu_item ON recipes(menu_item_id);
CREATE INDEX idx_recipes_inventory_item ON recipes(inventory_item_id);

-- RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view recipes" ON recipes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can manage recipes" ON recipes
  FOR ALL TO authenticated USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );

-- ============================================
-- 4. STOCK MOVES (Audit Trail for All Inventory Changes)
-- ============================================

CREATE TYPE stock_move_type AS ENUM (
  'order_consumption',
  'purchase',
  'adjustment',
  'wastage',
  'transfer'
);

CREATE TABLE stock_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE NOT NULL,
  type stock_move_type NOT NULL,
  quantity NUMERIC(10,3) NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  reason TEXT,
  performed_by UUID REFERENCES auth.users(id),
  cost_impact NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_moves_item ON stock_moves(inventory_item_id, created_at DESC);
CREATE INDEX idx_stock_moves_type ON stock_moves(type);
CREATE INDEX idx_stock_moves_reference ON stock_moves(reference_id, reference_type);
CREATE INDEX idx_stock_moves_date ON stock_moves(created_at);

-- RLS
ALTER TABLE stock_moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view stock moves" ON stock_moves
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert stock moves" ON stock_moves
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- 5. WASTAGE LOGS (Detailed Loss Tracking)
-- ============================================

CREATE TABLE wastage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE NOT NULL,
  quantity NUMERIC(10,3) NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('expired', 'spoiled', 'damaged', 'lost', 'other')),
  notes TEXT,
  logged_by UUID REFERENCES auth.users(id),
  cost_impact NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wastage_logs_item ON wastage_logs(inventory_item_id);
CREATE INDEX idx_wastage_logs_date ON wastage_logs(created_at);
CREATE INDEX idx_wastage_logs_reason ON wastage_logs(reason);

-- RLS
ALTER TABLE wastage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can view wastage logs" ON wastage_logs
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );
CREATE POLICY "Managers can create wastage logs" ON wastage_logs
  FOR INSERT TO authenticated WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION decrement_inventory_on_order(order_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_record RECORD;
  recipe_record RECORD;
  qty_needed NUMERIC(10,3);
  cost NUMERIC(10,2);
BEGIN
  FOR item_record IN 
    SELECT oi.menu_item_id, oi.quantity, mi.name as menu_item_name
    FROM order_items oi
    JOIN menu_items mi ON mi.id = oi.menu_item_id
    WHERE oi.order_id = order_id_param
  LOOP
    FOR recipe_record IN
      SELECT r.inventory_item_id, r.quantity_per_serving, ii.name, ii.cost_per_unit
      FROM recipes r
      JOIN inventory_items ii ON ii.id = r.inventory_item_id
      WHERE r.menu_item_id = item_record.menu_item_id
    LOOP
      qty_needed := recipe_record.quantity_per_serving * item_record.quantity;
      cost := qty_needed * recipe_record.cost_per_unit;
      
      UPDATE inventory_items
      SET current_qty = GREATEST(0, current_qty - qty_needed),
          updated_at = NOW()
      WHERE id = recipe_record.inventory_item_id;
      
      INSERT INTO stock_moves (
        inventory_item_id,
        type,
        quantity,
        reference_id,
        reference_type,
        reason,
        cost_impact,
        created_at
      ) VALUES (
        recipe_record.inventory_item_id,
        'order_consumption',
        -qty_needed,
        order_id_param,
        'order',
        'Auto-deducted from order: ' || item_record.menu_item_name,
        cost,
        NOW()
      );
    END LOOP;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE (
  id UUID,
  name TEXT,
  sku TEXT,
  current_qty NUMERIC,
  reorder_point NUMERIC,
  unit TEXT,
  days_until_stockout INTEGER
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ii.id,
    ii.name,
    ii.sku,
    ii.current_qty,
    ii.reorder_point,
    ii.unit,
    CASE 
      WHEN ii.current_qty <= 0 THEN 0
      ELSE GREATEST(0, FLOOR(
        ii.current_qty / NULLIF(
          (SELECT ABS(SUM(quantity)) / 30.0 
           FROM stock_moves 
           WHERE inventory_item_id = ii.id 
             AND type = 'order_consumption'
             AND created_at >= NOW() - INTERVAL '30 days'),
          0
        )
      ))
    END::INTEGER as days_until_stockout
  FROM inventory_items ii
  WHERE ii.current_qty <= ii.reorder_point
  ORDER BY ii.current_qty / NULLIF(ii.reorder_point, 1) ASC;
$$;

-- ============================================
-- 7. SAMPLE DATA
-- ============================================

INSERT INTO suppliers (name, contact_person, phone, email) VALUES
  ('Fresh Farm Supplies', 'Ahmad Ibrahim', '+60123456789', 'ahmad@freshfarm.my'),
  ('Metro Wholesale', 'Siti Nurhaliza', '+60129876543', 'siti@metro.my'),
  ('Coastal Seafood', 'Tan Ah Kow', '+60167654321', 'tan@coastal.my');

INSERT INTO inventory_items (name, sku, unit, current_qty, reorder_point, reorder_qty, cost_per_unit, category, supplier_id) VALUES
  ('White Rice', 'RICE-001', 'kg', 50.0, 10.0, 50.0, 3.50, 'dry_goods', (SELECT id FROM suppliers WHERE name = 'Metro Wholesale' LIMIT 1)),
  ('Chicken Breast', 'CHKN-001', 'kg', 15.0, 5.0, 20.0, 12.00, 'meat', (SELECT id FROM suppliers WHERE name = 'Fresh Farm Supplies' LIMIT 1)),
  ('Eggs', 'EGG-001', 'pcs', 100, 30, 100, 0.50, 'dairy', (SELECT id FROM suppliers WHERE name = 'Fresh Farm Supplies' LIMIT 1)),
  ('Cooking Oil', 'OIL-001', 'l', 8.0, 2.0, 10.0, 8.00, 'dry_goods', (SELECT id FROM suppliers WHERE name = 'Metro Wholesale' LIMIT 1)),
  ('Onions', 'VEG-001', 'kg', 5.0, 3.0, 10.0, 4.00, 'vegetables', (SELECT id FROM suppliers WHERE name = 'Fresh Farm Supplies' LIMIT 1));

CREATE TRIGGER update_inventory_items_updated_at 
BEFORE UPDATE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at 
BEFORE UPDATE ON suppliers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();