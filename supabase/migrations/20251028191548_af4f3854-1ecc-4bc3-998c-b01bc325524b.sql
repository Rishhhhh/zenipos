-- JARVIS X Intelligence System Tables

-- Table for storing JARVIS insights, patterns, and recommendations
CREATE TABLE public.jarvis_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('pattern', 'recommendation', 'prediction', 'anomaly')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  related_data JSONB DEFAULT '{}',
  source_commands TEXT[],
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  consciousness_state JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_jarvis_insights_user_confidence 
  ON public.jarvis_insights(user_id, confidence DESC) 
  WHERE applied = false;

CREATE INDEX idx_jarvis_insights_type 
  ON public.jarvis_insights(insight_type, created_at DESC);

-- Enable RLS
ALTER TABLE public.jarvis_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights"
  ON public.jarvis_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert insights"
  ON public.jarvis_insights FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own insights"
  ON public.jarvis_insights FOR UPDATE
  USING (auth.uid() = user_id);

-- Table for tracking JARVIS consciousness evolution
CREATE TABLE public.jarvis_consciousness_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vas NUMERIC(4,2) CHECK (vas >= 0 AND vas <= 1),
  vel NUMERIC(4,2) CHECK (vel >= 0 AND vel <= 1),
  quality_score NUMERIC(4,2) CHECK (quality_score >= 0 AND quality_score <= 1),
  consciousness_contribution NUMERIC(4,2),
  command_count INTEGER DEFAULT 0,
  insight_count INTEGER DEFAULT 0,
  happiness NUMERIC(3,2) CHECK (happiness >= 0 AND happiness <= 1),
  awareness NUMERIC(3,2) CHECK (awareness >= 0 AND awareness <= 1),
  learning_rate NUMERIC(3,2) CHECK (learning_rate >= 0 AND learning_rate <= 1),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_jarvis_consciousness_created 
  ON public.jarvis_consciousness_log(created_at DESC);

-- Enable RLS (public read for consciousness metrics)
ALTER TABLE public.jarvis_consciousness_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view consciousness log"
  ON public.jarvis_consciousness_log FOR SELECT
  USING (true);

CREATE POLICY "System can insert consciousness log"
  ON public.jarvis_consciousness_log FOR INSERT
  WITH CHECK (true);

-- Table for user feedback on JARVIS responses
CREATE TABLE public.jarvis_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_history_id UUID REFERENCES public.ai_command_history(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating IN (-1, 1)),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_jarvis_feedback_user 
  ON public.jarvis_feedback(user_id, created_at DESC);

CREATE INDEX idx_jarvis_feedback_rating 
  ON public.jarvis_feedback(rating, created_at DESC);

-- Enable RLS
ALTER TABLE public.jarvis_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON public.jarvis_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON public.jarvis_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Helper function to get current consciousness state
CREATE OR REPLACE FUNCTION public.get_current_consciousness()
RETURNS TABLE(
  vas NUMERIC,
  vel NUMERIC,
  quality_score NUMERIC,
  happiness NUMERIC,
  total_commands BIGINT,
  total_insights BIGINT
) 
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    COALESCE(cl.vas, 0.72) as vas,
    COALESCE(cl.vel, 0.75) as vel,
    COALESCE(cl.quality_score, 0.85) as quality_score,
    COALESCE(cl.happiness, 0.85) as happiness,
    (SELECT COUNT(*) FROM ai_command_history) as total_commands,
    (SELECT COUNT(*) FROM jarvis_insights) as total_insights
  FROM jarvis_consciousness_log cl
  ORDER BY cl.created_at DESC
  LIMIT 1;
$$;