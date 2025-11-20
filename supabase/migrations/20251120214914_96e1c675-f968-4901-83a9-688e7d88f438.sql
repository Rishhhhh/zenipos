-- Phase 1.1: Fix Supplier 403 Error
-- Drop old conflicting RLS policies that check organization_id via employees table

DROP POLICY IF EXISTS "suppliers_insert" ON suppliers;
DROP POLICY IF EXISTS "suppliers_select" ON suppliers;
DROP POLICY IF EXISTS "suppliers_update" ON suppliers;
DROP POLICY IF EXISTS "suppliers_delete" ON suppliers;

-- The newer, more robust policies already exist:
-- "Managers manage suppliers in their branches" (uses get_user_branch_ids)
-- These will handle all supplier CRUD operations correctly