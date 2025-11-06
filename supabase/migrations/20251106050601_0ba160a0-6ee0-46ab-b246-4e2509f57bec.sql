-- Create pos_displays table for secure display session management
CREATE TABLE pos_displays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id TEXT UNIQUE NOT NULL,
  pos_session_id TEXT,
  linked_by_user_id UUID REFERENCES auth.users NOT NULL,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pos_displays_active ON pos_displays(active, display_id);
CREATE INDEX idx_pos_displays_user ON pos_displays(linked_by_user_id);
CREATE INDEX idx_pos_displays_session ON pos_displays(pos_session_id);

-- Enable RLS
ALTER TABLE pos_displays ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view their own displays
CREATE POLICY "Users can view own displays"
ON pos_displays FOR SELECT
USING (linked_by_user_id = auth.uid());

-- Only managers/admins can link displays
CREATE POLICY "Managers can link displays"
ON pos_displays FOR INSERT
WITH CHECK (
  linked_by_user_id = auth.uid() 
  AND (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Users can update their own displays
CREATE POLICY "Users can update own displays"
ON pos_displays FOR UPDATE
USING (linked_by_user_id = auth.uid());

-- Managers can deactivate displays
CREATE POLICY "Managers can deactivate displays"
ON pos_displays FOR DELETE
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Cleanup function for inactive displays
CREATE OR REPLACE FUNCTION cleanup_inactive_displays()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- Deactivate displays inactive for >24 hours
  UPDATE pos_displays
  SET active = false, updated_at = NOW()
  WHERE last_activity < NOW() - INTERVAL '24 hours'
    AND active = true;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  -- Clean up old customer display sessions (>7 days)
  DELETE FROM customer_display_sessions
  WHERE last_activity < NOW() - INTERVAL '7 days';
  
  RETURN cleaned_count;
END;
$$;

-- Function to get active display for user (replaces localStorage)
CREATE OR REPLACE FUNCTION get_user_active_display(user_id_param UUID)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT display_id
  FROM pos_displays
  WHERE linked_by_user_id = user_id_param
    AND active = true
  ORDER BY last_activity DESC
  LIMIT 1;
$$;

-- Update trigger for updated_at
CREATE TRIGGER update_pos_displays_updated_at
BEFORE UPDATE ON pos_displays
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();