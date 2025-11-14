-- Make branch_id nullable for development mode
ALTER TABLE menu_categories 
ALTER COLUMN branch_id DROP NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_menu_categories_branch 
ON menu_categories(branch_id) WHERE branch_id IS NOT NULL;

-- Add comment explaining why nullable
COMMENT ON COLUMN menu_categories.branch_id IS 
'Branch assignment - nullable to support development mode and multi-branch categories';