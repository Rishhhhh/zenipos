-- Add missing updated_at column to open_tabs table
-- This column is required by the update_tab_balance() trigger

ALTER TABLE open_tabs 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add standard auto-update trigger for updated_at column
-- This follows the same pattern as other tables in the system
CREATE TRIGGER update_open_tabs_updated_at
  BEFORE UPDATE ON open_tabs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN open_tabs.updated_at IS 'Timestamp of last update, automatically maintained by trigger';