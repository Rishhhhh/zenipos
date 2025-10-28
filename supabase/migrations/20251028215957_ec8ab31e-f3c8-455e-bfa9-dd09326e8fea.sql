-- Create AI learning feedback table for self-improvement
CREATE TABLE IF NOT EXISTS ai_learning_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  quality_score NUMERIC(5,2),
  issues JSONB DEFAULT '[]'::jsonb,
  improvements JSONB DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_learning_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all feedback
CREATE POLICY "Authenticated users can read feedback"
  ON ai_learning_feedback
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: System can insert feedback (service role)
CREATE POLICY "Service role can insert feedback"
  ON ai_learning_feedback
  FOR INSERT
  WITH CHECK (true);

-- Index for querying recent feedback
CREATE INDEX idx_ai_learning_feedback_action_created ON ai_learning_feedback(action, created_at DESC);
CREATE INDEX idx_ai_learning_feedback_quality ON ai_learning_feedback(quality_score) WHERE applied = false;