-- Phase 5.1: Role System Migration to staff/manager/owner

-- Rename role enum values (this automatically updates all existing data)
ALTER TYPE app_role RENAME VALUE 'cashier' TO 'staff';
ALTER TYPE app_role RENAME VALUE 'admin' TO 'owner';
-- 'manager' stays the same

-- Add comment for documentation
COMMENT ON TYPE app_role IS 'Application roles: staff (front-of-house), manager (supervisor/register), owner (business admin)';