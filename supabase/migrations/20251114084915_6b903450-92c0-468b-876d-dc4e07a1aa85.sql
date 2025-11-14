-- Create stations table
CREATE TABLE IF NOT EXISTS public.stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('kitchen', 'expo', 'bar', 'grill', 'dessert', 'printer')),
  color TEXT DEFAULT '#8B5CF6',
  icon TEXT DEFAULT 'utensils',
  settings JSONB DEFAULT '{}'::jsonb,
  route_rules JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stations_branch_id ON public.stations(branch_id);
CREATE INDEX IF NOT EXISTS idx_stations_type ON public.stations(type);
CREATE INDEX IF NOT EXISTS idx_stations_active ON public.stations(active);
CREATE INDEX IF NOT EXISTS idx_stations_sort_order ON public.stations(sort_order);

-- Enable RLS
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view stations in their branches"
  ON public.stations FOR SELECT
  USING (branch_id IN (
    SELECT get_user_branch_ids(auth.uid())
  ));

CREATE POLICY "Managers manage stations in their branches"
  ON public.stations FOR ALL
  USING (
    (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
    AND branch_id IN (SELECT get_user_branch_ids(auth.uid()))
  );

-- Update trigger
CREATE TRIGGER update_stations_updated_at
  BEFORE UPDATE ON public.stations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default stations for all existing branches
INSERT INTO public.stations (branch_id, name, type, color, icon, sort_order)
SELECT 
  id as branch_id,
  'Kitchen Station',
  'kitchen',
  '#10B981',
  'chef-hat',
  1
FROM public.branches
WHERE active = true
ON CONFLICT DO NOTHING;

INSERT INTO public.stations (branch_id, name, type, color, icon, sort_order)
SELECT 
  id as branch_id,
  'Expo Station',
  'expo',
  '#F59E0B',
  'clipboard-check',
  2
FROM public.branches
WHERE active = true
ON CONFLICT DO NOTHING;