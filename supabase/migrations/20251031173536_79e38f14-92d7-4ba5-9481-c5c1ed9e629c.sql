-- Create NFC cards table
CREATE TABLE nfc_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_uid TEXT NOT NULL UNIQUE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id),
  status TEXT NOT NULL DEFAULT 'active',
  security_hash TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_scanned_at TIMESTAMPTZ,
  scan_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'lost', 'damaged', 'retired'))
);

-- Create index for fast card UID lookups
CREATE INDEX idx_nfc_cards_card_uid ON nfc_cards(card_uid);
CREATE INDEX idx_nfc_cards_table_id ON nfc_cards(table_id);
CREATE INDEX idx_nfc_cards_status ON nfc_cards(status);

-- Add NFC card reference to tables
ALTER TABLE tables ADD COLUMN nfc_card_id UUID REFERENCES nfc_cards(id);

-- Enable RLS
ALTER TABLE nfc_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nfc_cards
CREATE POLICY "Staff can view NFC cards"
  ON nfc_cards FOR SELECT
  USING (true);

CREATE POLICY "Managers can manage NFC cards"
  ON nfc_cards FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "System can update scan tracking"
  ON nfc_cards FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Function to log NFC card scans
CREATE OR REPLACE FUNCTION log_nfc_scan(card_uid_param TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  card_record RECORD;
BEGIN
  -- Update scan count and last scanned time
  UPDATE nfc_cards
  SET 
    scan_count = scan_count + 1,
    last_scanned_at = NOW(),
    updated_at = NOW()
  WHERE card_uid = card_uid_param AND status = 'active'
  RETURNING * INTO card_record;
  
  IF card_record.id IS NULL THEN
    RAISE EXCEPTION 'NFC card not found or inactive: %', card_uid_param;
  END IF;
  
  RETURN card_record.table_id;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_nfc_cards_updated_at
  BEFORE UPDATE ON nfc_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();