-- Add organization_id and branch_id to station_routing_rules
ALTER TABLE public.station_routing_rules
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS branch_id UUID;

-- Backfill organization_id from stations table
UPDATE public.station_routing_rules srr
SET organization_id = s.organization_id,
    branch_id = s.branch_id
FROM public.stations s
WHERE srr.station_id = s.id
  AND srr.organization_id IS NULL;

-- Make organization_id NOT NULL after backfill
ALTER TABLE public.station_routing_rules
ALTER COLUMN organization_id SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE public.station_routing_rules
DROP CONSTRAINT IF EXISTS station_routing_rules_organization_id_fkey,
DROP CONSTRAINT IF EXISTS station_routing_rules_branch_id_fkey;

ALTER TABLE public.station_routing_rules
ADD CONSTRAINT station_routing_rules_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES public.organizations(id)
ON DELETE CASCADE,
ADD CONSTRAINT station_routing_rules_branch_id_fkey
FOREIGN KEY (branch_id)
REFERENCES public.branches(id)
ON DELETE CASCADE;

-- Add composite indexes for performance
DROP INDEX IF EXISTS idx_station_routing_rules_org_station;
DROP INDEX IF EXISTS idx_station_routing_rules_org_branch;

CREATE INDEX idx_station_routing_rules_org_station 
ON public.station_routing_rules(organization_id, station_id);

CREATE INDEX idx_station_routing_rules_org_branch
ON public.station_routing_rules(organization_id, branch_id);

-- Enable RLS
ALTER TABLE public.station_routing_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view routing rules in their organization" ON public.station_routing_rules;
DROP POLICY IF EXISTS "Managers can create routing rules in their organization" ON public.station_routing_rules;
DROP POLICY IF EXISTS "Managers can update routing rules in their organization" ON public.station_routing_rules;
DROP POLICY IF EXISTS "Managers can delete routing rules in their organization" ON public.station_routing_rules;

-- Policy: Users can view routing rules in their organization
CREATE POLICY "Users can view routing rules in their organization"
ON public.station_routing_rules
FOR SELECT
USING (
  organization_id IN (
    SELECT b.organization_id
    FROM public.employees e
    JOIN public.branches b ON b.id = e.branch_id
    WHERE e.auth_user_id = auth.uid()
      AND e.active = true
  )
);

-- Policy: Managers/Owners can create routing rules in their organization
CREATE POLICY "Managers can create routing rules in their organization"
ON public.station_routing_rules
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT b.organization_id
    FROM public.employees e
    JOIN public.branches b ON b.id = e.branch_id
    WHERE e.auth_user_id = auth.uid()
      AND e.active = true
      AND e.role IN ('manager', 'owner', 'super_admin')
  )
);

-- Policy: Managers/Owners can update routing rules in their organization
CREATE POLICY "Managers can update routing rules in their organization"
ON public.station_routing_rules
FOR UPDATE
USING (
  organization_id IN (
    SELECT b.organization_id
    FROM public.employees e
    JOIN public.branches b ON b.id = e.branch_id
    WHERE e.auth_user_id = auth.uid()
      AND e.active = true
      AND e.role IN ('manager', 'owner', 'super_admin')
  )
);

-- Policy: Managers/Owners can delete routing rules in their organization
CREATE POLICY "Managers can delete routing rules in their organization"
ON public.station_routing_rules
FOR DELETE
USING (
  organization_id IN (
    SELECT b.organization_id
    FROM public.employees e
    JOIN public.branches b ON b.id = e.branch_id
    WHERE e.auth_user_id = auth.uid()
      AND e.active = true
      AND e.role IN ('manager', 'owner', 'super_admin')
  )
);