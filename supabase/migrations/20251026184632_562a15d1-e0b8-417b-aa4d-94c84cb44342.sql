-- Add role column to employees table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='employees' AND column_name='role') THEN
    ALTER TABLE employees ADD COLUMN role app_role DEFAULT 'cashier';
  END IF;
END $$;

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_pin ON employees(pin);

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert test employee with PIN 12345 (only if not exists)
INSERT INTO employees (name, pin, role, active, email)
SELECT 
  'Test Cashier',
  crypt('12345', gen_salt('bf')),
  'cashier'::app_role,
  true,
  'cashier@test.pos'
WHERE NOT EXISTS (
  SELECT 1 FROM employees WHERE email = 'cashier@test.pos'
);

-- Insert test manager with PIN 12345
INSERT INTO employees (name, pin, role, active, email)
SELECT 
  'Test Manager',
  crypt('12345', gen_salt('bf')),
  'manager'::app_role,
  true,
  'manager@test.pos'
WHERE NOT EXISTS (
  SELECT 1 FROM employees WHERE email = 'manager@test.pos'
);

-- Insert test admin with PIN 12345
INSERT INTO employees (name, pin, role, active, email)
SELECT 
  'Test Admin',
  crypt('12345', gen_salt('bf')),
  'admin'::app_role,
  true,
  'admin@test.pos'
WHERE NOT EXISTS (
  SELECT 1 FROM employees WHERE email = 'admin@test.pos'
);