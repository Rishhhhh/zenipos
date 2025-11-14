-- Add unique constraints for idempotent menu seeding
-- These constraints allow safe upserts without duplicates

-- Unique constraint on (branch_id, name) for categories
CREATE UNIQUE INDEX IF NOT EXISTS menu_categories_branch_name_unique_idx 
ON menu_categories(branch_id, name);

-- Unique constraint on (branch_id, sku) for menu items
CREATE UNIQUE INDEX IF NOT EXISTS menu_items_branch_sku_unique_idx 
ON menu_items(branch_id, sku);