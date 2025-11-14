-- Add database-level protection for single-branch limitation
-- This will enforce that organizations can only have 1 branch until upgraded to premium

CREATE OR REPLACE FUNCTION check_branch_limit()
RETURNS TRIGGER AS $$
DECLARE
  branch_count INTEGER;
BEGIN
  -- Count existing branches for this organization
  SELECT COUNT(*) INTO branch_count
  FROM branches
  WHERE organization_id = NEW.organization_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Allow only 1 branch per organization
  IF branch_count >= 1 THEN
    RAISE EXCEPTION 'Additional branches require a premium plan. Contact support to upgrade.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce branch limit on INSERT
DROP TRIGGER IF EXISTS enforce_branch_limit_insert ON branches;
CREATE TRIGGER enforce_branch_limit_insert
  BEFORE INSERT ON branches
  FOR EACH ROW
  EXECUTE FUNCTION check_branch_limit();

-- Add comment for future reference
COMMENT ON FUNCTION check_branch_limit() IS 'Enforces single-branch limitation for free tier. Remove this trigger when implementing multi-branch premium feature.';