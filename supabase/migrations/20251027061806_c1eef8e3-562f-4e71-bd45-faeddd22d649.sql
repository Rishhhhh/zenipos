-- Create tables table for restaurant seating
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  seats INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  branch_id UUID REFERENCES public.branches(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create modifier_groups table
CREATE TABLE IF NOT EXISTS public.modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_selections INTEGER NOT NULL DEFAULT 0,
  max_selections INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create modifiers table
CREATE TABLE IF NOT EXISTS public.modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create menu_item_modifiers junction table to link menu items with modifier groups
CREATE TABLE IF NOT EXISTS public.menu_item_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  modifier_group_id UUID NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_item_id, modifier_group_id)
);

-- Enable RLS
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_modifiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tables
CREATE POLICY "Authenticated users can view tables"
  ON public.tables FOR SELECT
  USING (true);

CREATE POLICY "Managers can manage tables"
  ON public.tables FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

-- RLS Policies for modifier_groups
CREATE POLICY "Authenticated users can view modifier groups"
  ON public.modifier_groups FOR SELECT
  USING (true);

CREATE POLICY "Managers can manage modifier groups"
  ON public.modifier_groups FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

-- RLS Policies for modifiers
CREATE POLICY "Authenticated users can view modifiers"
  ON public.modifiers FOR SELECT
  USING (true);

CREATE POLICY "Managers can manage modifiers"
  ON public.modifiers FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

-- RLS Policies for menu_item_modifiers
CREATE POLICY "Authenticated users can view menu item modifiers"
  ON public.menu_item_modifiers FOR SELECT
  USING (true);

CREATE POLICY "Managers can manage menu item modifiers"
  ON public.menu_item_modifiers FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_branch ON public.tables(branch_id);
CREATE INDEX IF NOT EXISTS idx_modifiers_group ON public.modifiers(group_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_modifiers_menu_item ON public.menu_item_modifiers(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_modifiers_group ON public.menu_item_modifiers(modifier_group_id);