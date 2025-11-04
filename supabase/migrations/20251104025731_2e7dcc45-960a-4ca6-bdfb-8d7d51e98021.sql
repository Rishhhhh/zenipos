-- Phase 2: Clean up duplicate categories
-- This migration consolidates duplicate menu categories and reassigns items

-- Step 1: Create a temporary mapping of duplicates to keep
CREATE TEMP TABLE category_mapping AS
WITH ranked_categories AS (
  SELECT 
    id,
    name,
    sort_order,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(name)) ORDER BY created_at ASC, sort_order ASC) as rn
  FROM menu_categories
)
SELECT 
  id as old_id,
  FIRST_VALUE(id) OVER (PARTITION BY LOWER(TRIM(name)) ORDER BY created_at ASC, sort_order ASC) as new_id,
  name
FROM ranked_categories;

-- Step 2: Update menu_items to point to the first (kept) category
UPDATE menu_items
SET category_id = cm.new_id
FROM category_mapping cm
WHERE menu_items.category_id = cm.old_id
  AND cm.old_id != cm.new_id;

-- Step 3: Update station_routing_rules to point to the first (kept) category
UPDATE station_routing_rules
SET category_id = cm.new_id
FROM category_mapping cm
WHERE station_routing_rules.category_id = cm.old_id
  AND cm.old_id != cm.new_id;

-- Step 4: Delete duplicate categories (keep only the first one per name)
DELETE FROM menu_categories
WHERE id IN (
  SELECT old_id 
  FROM category_mapping 
  WHERE old_id != new_id
);

-- Step 5: Re-normalize sort_order to clean sequence
WITH sorted_cats AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, name) * 10 as new_sort_order
  FROM menu_categories
)
UPDATE menu_categories
SET sort_order = sc.new_sort_order
FROM sorted_cats sc
WHERE menu_categories.id = sc.id;

-- Add comment for documentation
COMMENT ON TABLE menu_categories IS 'Menu categories with enforced unique names (case-insensitive)';

-- Optional: Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS menu_categories_name_unique_idx 
ON menu_categories (LOWER(TRIM(name)));