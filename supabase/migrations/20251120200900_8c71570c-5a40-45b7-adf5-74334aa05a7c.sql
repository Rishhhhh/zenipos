-- Add table configuration columns
ALTER TABLE tables 
ADD COLUMN IF NOT EXISTS grid_x INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS grid_y INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS custom_name TEXT,
ADD COLUMN IF NOT EXISTS reservation_name TEXT,
ADD COLUMN IF NOT EXISTS reservation_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reservation_contact TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for reservation queries
CREATE INDEX IF NOT EXISTS idx_tables_reservation_time ON tables(reservation_time) 
WHERE reservation_time IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN tables.grid_x IS 'X position for custom table layout grid';
COMMENT ON COLUMN tables.grid_y IS 'Y position for custom table layout grid';
COMMENT ON COLUMN tables.custom_name IS 'Optional custom display name for table';
COMMENT ON COLUMN tables.reservation_name IS 'Name of person who reserved the table';
COMMENT ON COLUMN tables.reservation_time IS 'Time when table is reserved';
COMMENT ON COLUMN tables.reservation_contact IS 'Contact info (phone/email) for reservation';
COMMENT ON COLUMN tables.notes IS 'Additional notes for this table (allergies, preferences, etc)';