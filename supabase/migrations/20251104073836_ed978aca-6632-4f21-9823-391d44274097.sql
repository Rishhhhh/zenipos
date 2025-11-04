-- Add NFC card and table info to customer display sessions
ALTER TABLE customer_display_sessions 
ADD COLUMN IF NOT EXISTS nfc_card_uid TEXT,
ADD COLUMN IF NOT EXISTS table_label TEXT;

-- Enable realtime for order_items table (if not already enabled)
DO $$ 
BEGIN
  ALTER TABLE order_items REPLICA IDENTITY FULL;
  
  -- Only add if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
  END IF;
END $$;

-- Enable realtime for customer_display_sessions
DO $$ 
BEGIN
  ALTER TABLE customer_display_sessions REPLICA IDENTITY FULL;
  
  -- Only add if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'customer_display_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE customer_display_sessions;
  END IF;
END $$;

-- Create index for faster display session lookups
CREATE INDEX IF NOT EXISTS idx_customer_display_sessions_session_id 
ON customer_display_sessions(session_id);

CREATE INDEX IF NOT EXISTS idx_customer_display_sessions_pos_session 
ON customer_display_sessions(pos_session_id) 
WHERE pos_session_id IS NOT NULL;