-- Core enums
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'done', 'cancelled');
CREATE TYPE order_type AS ENUM ('dine_in', 'takeaway', 'delivery');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'qr', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Menu categories
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES menu_categories(id),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE,
  track_inventory BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  table_id UUID,
  order_type order_type DEFAULT 'dine_in',
  status order_status DEFAULT 'pending',
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  customer_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_session ON orders(session_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  modifiers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  method payment_method NOT NULL,
  provider_ref TEXT,
  amount DECIMAL(10,2) NOT NULL,
  tip DECIMAL(10,2) DEFAULT 0,
  change_given DECIMAL(10,2) DEFAULT 0,
  status payment_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_order ON payments(order_id);

-- Stations (for KDS routing)
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'KDS',
  route_rules JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  station_id UUID REFERENCES stations(id),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  diff JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_log_entity ON audit_log(entity, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- RLS Policies (single-tenant friendly, prepared for multi-tenant)
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Phase 1: Allow all authenticated users (single-tenant assumption)
CREATE POLICY "Allow authenticated read menu_categories" ON menu_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated all menu_items" ON menu_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated all orders" ON orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated all order_items" ON order_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated all payments" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read stations" ON stations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read devices" ON devices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert audit_log" ON audit_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated select audit_log" ON audit_log FOR SELECT TO authenticated USING (true);

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER TABLE orders REPLICA IDENTITY FULL;

-- Seed data
INSERT INTO menu_categories (name, sort_order) VALUES
  ('Appetizers', 1),
  ('Mains', 2),
  ('Desserts', 3),
  ('Beverages', 4);

INSERT INTO menu_items (category_id, name, sku, price, cost, tax_rate) VALUES
  ((SELECT id FROM menu_categories WHERE name='Appetizers'), 'Spring Rolls', 'APP-001', 8.99, 3.50, 0.08),
  ((SELECT id FROM menu_categories WHERE name='Appetizers'), 'Soup of the Day', 'APP-002', 6.99, 2.00, 0.08),
  ((SELECT id FROM menu_categories WHERE name='Mains'), 'Pad Thai', 'MAIN-001', 14.99, 5.50, 0.08),
  ((SELECT id FROM menu_categories WHERE name='Mains'), 'Grilled Salmon', 'MAIN-002', 22.99, 9.00, 0.08),
  ((SELECT id FROM menu_categories WHERE name='Desserts'), 'Mango Sticky Rice', 'DES-001', 7.99, 2.50, 0.08),
  ((SELECT id FROM menu_categories WHERE name='Beverages'), 'Thai Iced Tea', 'BEV-001', 4.99, 1.00, 0.08);

INSERT INTO stations (name, type) VALUES
  ('Expo Station', 'KDS'),
  ('Line Station', 'KDS');