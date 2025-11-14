-- Phase 3: Make branch_id nullable for menu categories and items
ALTER TABLE menu_categories ALTER COLUMN branch_id DROP NOT NULL;
ALTER TABLE menu_items ALTER COLUMN branch_id DROP NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_categories_branch 
ON menu_categories(branch_id) WHERE branch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_menu_items_branch 
ON menu_items(branch_id) WHERE branch_id IS NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN menu_categories.branch_id IS 
'Branch assignment - nullable to support development and multi-branch items';
COMMENT ON COLUMN menu_items.branch_id IS 
'Branch assignment - nullable to support development and multi-branch items';