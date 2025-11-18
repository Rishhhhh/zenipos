-- Phase 4.1: Add organization_id to Tier 1 Critical Tables
-- This migration adds organization_id column to all critical transactional tables
-- and backfills data from the branches relationship

-- =============================================
-- 1. ORDERS TABLE
-- =============================================
ALTER TABLE orders ADD COLUMN organization_id UUID;

UPDATE orders o
SET organization_id = b.organization_id
FROM branches b
WHERE o.branch_id = b.id;

ALTER TABLE orders ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_orders_org_branch_created 
ON orders(organization_id, branch_id, created_at DESC);

CREATE INDEX idx_orders_org_status 
ON orders(organization_id, status, created_at DESC);

CREATE INDEX idx_orders_org_created 
ON orders(organization_id, created_at DESC);

-- =============================================
-- 2. ORDER_ITEMS TABLE
-- =============================================
ALTER TABLE order_items ADD COLUMN organization_id UUID;

UPDATE order_items oi
SET organization_id = o.organization_id
FROM orders o
WHERE oi.order_id = o.id;

ALTER TABLE order_items ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_order_items_org_menu_item 
ON order_items(organization_id, menu_item_id);

CREATE INDEX idx_order_items_org_order 
ON order_items(organization_id, order_id);

-- =============================================
-- 3. PAYMENTS TABLE
-- =============================================
ALTER TABLE payments ADD COLUMN organization_id UUID;

UPDATE payments p
SET organization_id = o.organization_id
FROM orders o
WHERE p.order_id = o.id;

ALTER TABLE payments ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE payments 
ADD CONSTRAINT fk_payments_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_payments_org_created 
ON payments(organization_id, created_at DESC);

CREATE INDEX idx_payments_org_method 
ON payments(organization_id, method, status);

-- =============================================
-- 4. MENU_ITEMS TABLE
-- =============================================
ALTER TABLE menu_items ADD COLUMN organization_id UUID;

UPDATE menu_items mi
SET organization_id = b.organization_id
FROM branches b
WHERE mi.branch_id = b.id;

ALTER TABLE menu_items ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE menu_items 
ADD CONSTRAINT fk_menu_items_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_menu_items_org_branch 
ON menu_items(organization_id, branch_id);

CREATE INDEX idx_menu_items_org_category 
ON menu_items(organization_id, category_id);

-- =============================================
-- 5. MENU_CATEGORIES TABLE
-- =============================================
ALTER TABLE menu_categories ADD COLUMN organization_id UUID;

UPDATE menu_categories mc
SET organization_id = b.organization_id
FROM branches b
WHERE mc.branch_id = b.id;

ALTER TABLE menu_categories ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE menu_categories 
ADD CONSTRAINT fk_menu_categories_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_menu_categories_org_branch 
ON menu_categories(organization_id, branch_id);

-- =============================================
-- 6. INVENTORY_ITEMS TABLE
-- =============================================
ALTER TABLE inventory_items ADD COLUMN organization_id UUID;

UPDATE inventory_items ii
SET organization_id = b.organization_id
FROM branches b
WHERE ii.branch_id = b.id;

ALTER TABLE inventory_items ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE inventory_items 
ADD CONSTRAINT fk_inventory_items_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_inventory_items_org_branch 
ON inventory_items(organization_id, branch_id);

CREATE INDEX idx_inventory_items_org_sku 
ON inventory_items(organization_id, sku);

-- =============================================
-- 7. CUSTOMERS TABLE (if any exist)
-- =============================================
ALTER TABLE customers ADD COLUMN organization_id UUID;

UPDATE customers c
SET organization_id = b.organization_id
FROM branches b
WHERE c.branch_id = b.id;

-- Only set NOT NULL if customers table has data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM customers LIMIT 1) THEN
    ALTER TABLE customers ALTER COLUMN organization_id SET NOT NULL;
  END IF;
END $$;

ALTER TABLE customers 
ADD CONSTRAINT fk_customers_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_customers_org_phone 
ON customers(organization_id, phone);

CREATE INDEX idx_customers_org_email 
ON customers(organization_id, email);

CREATE INDEX idx_customers_org_branch 
ON customers(organization_id, branch_id);

-- =============================================
-- 8. EMPLOYEES TABLE
-- =============================================
ALTER TABLE employees ADD COLUMN organization_id UUID;

UPDATE employees e
SET organization_id = b.organization_id
FROM branches b
WHERE e.branch_id = b.id;

ALTER TABLE employees ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE employees 
ADD CONSTRAINT fk_employees_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_employees_org_branch 
ON employees(organization_id, branch_id);

CREATE INDEX idx_employees_org_role 
ON employees(organization_id, role);

CREATE INDEX idx_employees_org_active 
ON employees(organization_id, active);

-- =============================================
-- 9. SHIFTS TABLE
-- =============================================
ALTER TABLE shifts ADD COLUMN organization_id UUID;

UPDATE shifts s
SET organization_id = e.organization_id
FROM employees e
WHERE s.employee_id = e.id;

ALTER TABLE shifts ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE shifts 
ADD CONSTRAINT fk_shifts_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_shifts_org_date 
ON shifts(organization_id, clock_in_at DESC);

CREATE INDEX idx_shifts_org_employee 
ON shifts(organization_id, employee_id);

-- =============================================
-- 10. TABLES TABLE
-- =============================================
ALTER TABLE tables ADD COLUMN organization_id UUID;

UPDATE tables t
SET organization_id = b.organization_id
FROM branches b
WHERE t.branch_id = b.id;

ALTER TABLE tables ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE tables 
ADD CONSTRAINT fk_tables_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_tables_org_branch 
ON tables(organization_id, branch_id);

CREATE INDEX idx_tables_org_status 
ON tables(organization_id, status);