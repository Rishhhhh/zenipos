-- Phase 1: Category-Based Modifier System
-- Create junction table linking categories to modifier groups

CREATE TABLE IF NOT EXISTS category_modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  modifier_group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, modifier_group_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_category_modifiers_category ON category_modifier_groups(category_id);
CREATE INDEX IF NOT EXISTS idx_category_modifiers_group ON category_modifier_groups(modifier_group_id);

-- Enable RLS
ALTER TABLE category_modifier_groups ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read category modifiers
CREATE POLICY "Staff can view category modifiers"
  ON category_modifier_groups FOR SELECT
  TO authenticated
  USING (true);

-- Allow managers to manage category modifiers
CREATE POLICY "Managers can manage category modifiers"
  ON category_modifier_groups FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Add branch_id to modifier_groups for multi-branch support
ALTER TABLE modifier_groups 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;