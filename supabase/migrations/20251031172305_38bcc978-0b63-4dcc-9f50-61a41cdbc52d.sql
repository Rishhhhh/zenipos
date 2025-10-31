-- Module 1: Enhanced Device Management System
-- Enhance existing devices table
ALTER TABLE devices ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS mac_address TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_capabilities JSONB DEFAULT '{}'::jsonb;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS health_check_interval INTEGER DEFAULT 60;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'offline';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enhance existing stations table
ALTER TABLE stations ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE stations ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE stations ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#8B5CF6';
ALTER TABLE stations ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'utensils';
ALTER TABLE stations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE stations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update triggers for updated_at
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stations_updated_at
  BEFORE UPDATE ON stations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Station-Device assignment junction table
CREATE TABLE IF NOT EXISTS station_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('kds', 'printer', 'bump_bar', 'customer_display')),
  is_primary BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(station_id, device_id, role)
);

-- Menu item routing rules
CREATE TABLE IF NOT EXISTS station_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  auto_print BOOLEAN DEFAULT true,
  auto_display BOOLEAN DEFAULT true,
  prep_time_estimate INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (category_id IS NOT NULL AND menu_item_id IS NULL) OR
    (category_id IS NULL AND menu_item_id IS NOT NULL)
  )
);

-- Device health log
CREATE TABLE IF NOT EXISTS device_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'error', 'warning')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_station_devices_station ON station_devices(station_id);
CREATE INDEX IF NOT EXISTS idx_station_devices_device ON station_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_station ON station_routing_rules(station_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_category ON station_routing_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_item ON station_routing_rules(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_device_health_device ON device_health_log(device_id);
CREATE INDEX IF NOT EXISTS idx_device_health_created ON device_health_log(created_at DESC);

-- RLS Policies for stations
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage stations" ON stations;
CREATE POLICY "Managers can manage stations"
  ON stations FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Staff can view stations" ON stations;
CREATE POLICY "Staff can view stations"
  ON stations FOR SELECT
  USING (true);

-- RLS Policies for devices
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage devices" ON devices;
CREATE POLICY "Managers can manage devices"
  ON devices FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Staff can view devices" ON devices;
CREATE POLICY "Staff can view devices"
  ON devices FOR SELECT
  USING (true);

-- RLS Policies for station_devices
ALTER TABLE station_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage station devices" ON station_devices;
CREATE POLICY "Managers can manage station devices"
  ON station_devices FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Staff can view station devices" ON station_devices;
CREATE POLICY "Staff can view station devices"
  ON station_devices FOR SELECT
  USING (true);

-- RLS Policies for routing rules
ALTER TABLE station_routing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can manage routing rules" ON station_routing_rules;
CREATE POLICY "Managers can manage routing rules"
  ON station_routing_rules FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Staff can view routing rules" ON station_routing_rules;
CREATE POLICY "Staff can view routing rules"
  ON station_routing_rules FOR SELECT
  USING (true);

-- RLS Policies for device health log
ALTER TABLE device_health_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can view health logs" ON device_health_log;
CREATE POLICY "Managers can view health logs"
  ON device_health_log FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "System can insert health logs" ON device_health_log;
CREATE POLICY "System can insert health logs"
  ON device_health_log FOR INSERT
  WITH CHECK (true);

-- Seed default stations
INSERT INTO stations (name, type, color, icon, settings, sort_order) VALUES
  ('Main Kitchen', 'kitchen', '#EF4444', 'chef-hat', '{"prep_area": "main", "capacity": 10}'::jsonb, 1),
  ('Drinks Bar', 'bar', '#3B82F6', 'coffee', '{"prep_area": "drinks", "capacity": 5}'::jsonb, 2),
  ('Grill Station', 'grill', '#F59E0B', 'flame', '{"prep_area": "grill", "capacity": 8}'::jsonb, 3),
  ('Expo/Runner', 'expo', '#10B981', 'bell', '{"quality_check": true}'::jsonb, 4)
ON CONFLICT DO NOTHING;