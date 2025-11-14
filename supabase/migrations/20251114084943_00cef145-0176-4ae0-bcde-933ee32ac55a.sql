-- Add station_id to menu_items table
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL;

-- Create index for station_id
CREATE INDEX IF NOT EXISTS idx_menu_items_station_id ON public.menu_items(station_id);

-- Add station_id to devices table (replace the old station_id FK if it exists)
ALTER TABLE public.devices DROP CONSTRAINT IF EXISTS devices_station_id_fkey;
ALTER TABLE public.devices DROP COLUMN IF EXISTS station_id;
ALTER TABLE public.devices 
ADD COLUMN station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL;

-- Create index for devices station_id
CREATE INDEX IF NOT EXISTS idx_devices_station_id ON public.devices(station_id);

-- Create station_routing_rules table
CREATE TABLE IF NOT EXISTS public.station_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  prep_time_minutes INTEGER DEFAULT 10,
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT routing_rule_target CHECK (
    (menu_item_id IS NOT NULL AND category_id IS NULL) OR
    (menu_item_id IS NULL AND category_id IS NOT NULL)
  )
);

-- Create indexes for station_routing_rules
CREATE INDEX IF NOT EXISTS idx_routing_rules_station ON public.station_routing_rules(station_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_item ON public.station_routing_rules(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_category ON public.station_routing_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_active ON public.station_routing_rules(active);

-- Enable RLS on station_routing_rules
ALTER TABLE public.station_routing_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for station_routing_rules
CREATE POLICY "Users view routing rules in their branches"
  ON public.station_routing_rules FOR SELECT
  USING (station_id IN (
    SELECT s.id FROM public.stations s
    WHERE s.branch_id IN (SELECT get_user_branch_ids(auth.uid()))
  ));

CREATE POLICY "Managers manage routing rules in their branches"
  ON public.station_routing_rules FOR ALL
  USING (
    (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
    AND station_id IN (
      SELECT s.id FROM public.stations s
      WHERE s.branch_id IN (SELECT get_user_branch_ids(auth.uid()))
    )
  );

-- Update trigger for station_routing_rules
CREATE TRIGGER update_routing_rules_updated_at
  BEFORE UPDATE ON public.station_routing_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();