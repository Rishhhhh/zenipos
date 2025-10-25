-- ============================================
-- 1. EMPLOYEES & ROLE SYSTEM (Security Critical)
-- ============================================

-- Create app roles enum (admin, manager, cashier, kitchen)
CREATE TYPE app_role AS ENUM ('admin', 'manager', 'cashier', 'kitchen');

-- Employees table (staff management)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pin VARCHAR(60) NOT NULL, -- Hashed PIN (bcrypt)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table (SECURITY DEFINER pattern)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all roles" ON user_roles
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- RLS for employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view active employees" ON employees
  FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Admins and managers can manage employees" ON employees
  FOR ALL TO authenticated USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );

-- ============================================
-- 2. REFUNDS SYSTEM
-- ============================================

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  authorized_by UUID REFERENCES auth.users(id),
  employee_id UUID REFERENCES employees(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  provider_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_order ON refunds(order_id);

-- RLS for refunds (only managers/admins can view/create)
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can view refunds" ON refunds
  FOR SELECT TO authenticated USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );
CREATE POLICY "Managers can create refunds" ON refunds
  FOR INSERT TO authenticated WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );

-- ============================================
-- 3. RECEIPT TEMPLATES
-- ============================================

CREATE TABLE receipt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  template TEXT NOT NULL,
  width_mm INTEGER NOT NULL CHECK (width_mm IN (58, 80)),
  type TEXT NOT NULL CHECK (type IN ('customer_receipt', 'kitchen_ticket', 'refund_receipt')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for receipt_templates
ALTER TABLE receipt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active templates" ON receipt_templates
  FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage templates" ON receipt_templates
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- 4. PAYMENT METHOD UPDATES
-- ============================================

-- Add payment provider field to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider TEXT;

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_templates_active ON receipt_templates(active, type);