-- Add auth_user_id to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON employees(auth_user_id);

-- Ensure user_roles table uses the app_role enum correctly
-- Note: user_roles should already exist based on the has_role function
-- We'll populate it via the edge function when employees log in