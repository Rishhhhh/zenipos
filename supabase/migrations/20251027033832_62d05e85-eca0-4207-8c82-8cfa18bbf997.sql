-- Add updated_at column to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update test employee PINs for Manager and Admin
-- Manager: 12345 -> 22222
-- Admin: 12345 -> 11111
-- Cashier: keeps 12345 (no change)
UPDATE employees
SET pin = crypt('22222', gen_salt('bf'))
WHERE email = 'manager@test.pos';

UPDATE employees
SET pin = crypt('11111', gen_salt('bf'))
WHERE email = 'admin@test.pos';