-- Add organization_id column to pos_displays for branch-wide display lookup
ALTER TABLE public.pos_displays 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create index for efficient organization-based lookup
CREATE INDEX IF NOT EXISTS idx_pos_displays_organization_active 
ON public.pos_displays(organization_id, active) 
WHERE active = true;

-- Update existing displays to set organization_id from linked user
UPDATE public.pos_displays pd
SET organization_id = (
  SELECT b.organization_id 
  FROM employees e 
  JOIN branches b ON b.id = e.branch_id 
  WHERE e.auth_user_id = pd.linked_by_user_id 
  LIMIT 1
)
WHERE organization_id IS NULL;