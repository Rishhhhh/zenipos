-- Add color and icon fields to menu_categories
ALTER TABLE menu_categories
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#8B5CF6',
ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'Utensils';

-- Update existing categories with default values
UPDATE menu_categories 
SET color = '#8B5CF6', icon = 'Utensils'
WHERE color IS NULL OR icon IS NULL;