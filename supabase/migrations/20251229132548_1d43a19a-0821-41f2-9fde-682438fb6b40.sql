-- Create denomination presets table for storing saved cash count templates
CREATE TABLE public.denomination_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  preset_type TEXT NOT NULL CHECK (preset_type IN ('opening', 'closing', 'both')) DEFAULT 'opening',
  denominations JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_denomination_presets_employee ON denomination_presets(employee_id);
CREATE INDEX idx_denomination_presets_org ON denomination_presets(organization_id);

-- Enable RLS
ALTER TABLE denomination_presets ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own presets" ON denomination_presets
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own presets" ON denomination_presets
  FOR INSERT WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own presets" ON denomination_presets
  FOR UPDATE USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own presets" ON denomination_presets
  FOR DELETE USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_denomination_presets_updated_at
  BEFORE UPDATE ON denomination_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();