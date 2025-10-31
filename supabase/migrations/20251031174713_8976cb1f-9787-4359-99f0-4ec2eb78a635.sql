-- Create marketing content table for customer display
CREATE TABLE marketing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 10,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  schedule_start TIMESTAMPTZ,
  schedule_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE marketing_content ENABLE ROW LEVEL SECURITY;

-- Public can view active marketing content
CREATE POLICY "Marketing content is viewable by everyone"
ON marketing_content FOR SELECT
USING (is_active = true AND (
  schedule_start IS NULL OR schedule_start <= NOW()
) AND (
  schedule_end IS NULL OR schedule_end >= NOW()
));

-- Managers can manage marketing content
CREATE POLICY "Managers can manage marketing content"
ON marketing_content FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Create customer display sessions table for tracking active displays
CREATE TABLE customer_display_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  pos_session_id TEXT,
  mode TEXT NOT NULL DEFAULT 'idle' CHECK (mode IN ('ordering', 'payment', 'idle', 'complete')),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customer_display_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can view and update display sessions (public display)
CREATE POLICY "Display sessions are public"
ON customer_display_sessions FOR ALL
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_marketing_content_updated_at
BEFORE UPDATE ON marketing_content
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert some default marketing content
INSERT INTO marketing_content (title, description, media_type, media_url, duration_seconds, display_order) VALUES
('Welcome', 'Welcome to our restaurant!', 'image', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop', 8, 1),
('Daily Special', 'Try our chef special today!', 'image', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=1080&fit=crop', 10, 2),
('Fresh Ingredients', 'Made with locally sourced ingredients', 'image', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1920&h=1080&fit=crop', 8, 3);