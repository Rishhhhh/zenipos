-- ============================================
-- PHASE 1.1.1: ENHANCE ORGANIZATIONS TABLE
-- Multi-Tenant POS System - Organization Authentication Foundation
-- ============================================

-- Add authentication columns
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS login_email TEXT,
  ADD COLUMN IF NOT EXISTS login_password_hash TEXT,
  
  -- White-label branding
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#8B5CF6',
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#10B981',
  
  -- Status tracking
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  
  -- Additional metadata
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS business_type TEXT;

-- Add CHECK constraint for business_type enum
ALTER TABLE organizations 
  ADD CONSTRAINT organizations_business_type_check 
  CHECK (business_type IS NULL OR business_type IN ('restaurant', 'cafe', 'fast_food', 'bar', 'food_truck', 'catering', 'other'));

-- Function to auto-generate slug from restaurant name
CREATE OR REPLACE FUNCTION generate_organization_slug(org_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces/special chars with hyphens
  base_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Remove leading/trailing hyphens
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  -- Max 50 chars
  base_slug := substring(base_slug, 1, 50);
  
  -- Handle empty slug
  IF base_slug = '' THEN
    base_slug := 'org';
  END IF;
  
  final_slug := base_slug;
  
  -- Check uniqueness, append counter if needed
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Trigger to auto-set slug on INSERT if not provided
CREATE OR REPLACE FUNCTION set_organization_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_organization_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-slug generation
DROP TRIGGER IF EXISTS trg_set_organization_slug ON organizations;
CREATE TRIGGER trg_set_organization_slug
  BEFORE INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION set_organization_slug();

-- Update existing organizations to have slugs
UPDATE organizations
SET slug = generate_organization_slug(name)
WHERE slug IS NULL OR slug = '';

-- Create indexes for performance BEFORE adding constraints
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_login_email ON organizations(login_email);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);

-- Add uniqueness constraints
ALTER TABLE organizations 
  ADD CONSTRAINT organizations_slug_unique UNIQUE (slug);

ALTER TABLE organizations 
  ADD CONSTRAINT organizations_login_email_unique UNIQUE (login_email);

-- Add CHECK constraint for slug format (lowercase, alphanumeric, hyphens only)
ALTER TABLE organizations 
  ADD CONSTRAINT organizations_slug_format_check 
  CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

-- Make slug NOT NULL after data migration
ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL;

-- Add helpful column comments
COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier (e.g., "joes-pizza-kl"). Auto-generated from name if not provided.';
COMMENT ON COLUMN organizations.login_email IS 'Organization admin login email (unique across all orgs). Used for organization-level authentication.';
COMMENT ON COLUMN organizations.login_password_hash IS 'Bcrypt hashed password for organization login (never store plaintext!)';
COMMENT ON COLUMN organizations.logo_url IS 'URL to organization logo in Supabase Storage (for white-label branding)';
COMMENT ON COLUMN organizations.primary_color IS 'Primary brand color (hex format, default: ZeniPOS purple #8B5CF6)';
COMMENT ON COLUMN organizations.accent_color IS 'Accent brand color (hex format, default: ZeniPOS green #10B981)';
COMMENT ON COLUMN organizations.is_active IS 'Whether organization can access the system (for subscription management/suspension)';
COMMENT ON COLUMN organizations.onboarding_completed IS 'Whether initial setup wizard is complete (tracks registration progress)';
COMMENT ON COLUMN organizations.phone IS 'Organization contact phone number';
COMMENT ON COLUMN organizations.address IS 'Organization physical address';
COMMENT ON COLUMN organizations.business_type IS 'Type of food service business (restaurant, cafe, fast_food, bar, food_truck, catering, other)';

COMMENT ON FUNCTION generate_organization_slug(TEXT) IS 'Generates a unique URL-friendly slug from organization name. Appends counter if slug exists.';
COMMENT ON FUNCTION set_organization_slug() IS 'Trigger function to auto-generate slug before INSERT if not provided.';