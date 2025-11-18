-- PHASE 4 COMPLETION: Multi-Tenancy Database Migration
-- Step 1: Tier 2 Supporting Tables Migration

-- modifier_groups
ALTER TABLE modifier_groups ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE modifier_groups mg SET organization_id = b.organization_id 
FROM branches b WHERE mg.branch_id = b.id;
ALTER TABLE modifier_groups ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE modifier_groups ADD CONSTRAINT fk_modifier_groups_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_modifier_groups_org ON modifier_groups(organization_id);

-- modifiers
ALTER TABLE modifiers ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE modifiers m SET organization_id = mg.organization_id 
FROM modifier_groups mg WHERE m.group_id = mg.id;
ALTER TABLE modifiers ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE modifiers ADD CONSTRAINT fk_modifiers_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_modifiers_org ON modifiers(organization_id);

-- recipes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE recipes r SET organization_id = mi.organization_id 
FROM menu_items mi WHERE r.menu_item_id = mi.id;
ALTER TABLE recipes ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE recipes ADD CONSTRAINT fk_recipes_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_recipes_org ON recipes(organization_id);

-- eighty_six_items
ALTER TABLE eighty_six_items ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE eighty_six_items esi SET organization_id = b.organization_id 
FROM branches b WHERE esi.branch_id = b.id;
ALTER TABLE eighty_six_items ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE eighty_six_items ADD CONSTRAINT fk_eighty_six_items_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_eighty_six_items_org ON eighty_six_items(organization_id);

-- stations
ALTER TABLE stations ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE stations s SET organization_id = b.organization_id 
FROM branches b WHERE s.branch_id = b.id;
ALTER TABLE stations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE stations ADD CONSTRAINT fk_stations_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_stations_org ON stations(organization_id);

-- devices
ALTER TABLE devices ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE devices d SET organization_id = b.organization_id 
FROM branches b WHERE d.branch_id = b.id;
ALTER TABLE devices ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE devices ADD CONSTRAINT fk_devices_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_devices_org ON devices(organization_id);

-- promotions
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE promotions p SET organization_id = b.organization_id 
FROM branches b WHERE p.branch_id = b.id;
ALTER TABLE promotions ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE promotions ADD CONSTRAINT fk_promotions_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_promotions_org ON promotions(organization_id);

-- stock_moves
ALTER TABLE stock_moves ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE stock_moves sm SET organization_id = ii.organization_id 
FROM inventory_items ii WHERE sm.inventory_item_id = ii.id;
ALTER TABLE stock_moves ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE stock_moves ADD CONSTRAINT fk_stock_moves_organization 
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_stock_moves_org ON stock_moves(organization_id);