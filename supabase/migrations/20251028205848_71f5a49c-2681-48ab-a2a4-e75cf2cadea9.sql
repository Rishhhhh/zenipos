-- Create MCP training log table
CREATE TABLE IF NOT EXISTS public.mcp_training_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id UUID NOT NULL,
  zenipos_mastery NUMERIC(3,2) NOT NULL CHECK (zenipos_mastery >= 0 AND zenipos_mastery <= 1),
  jarvis_mastery NUMERIC(3,2) NOT NULL CHECK (jarvis_mastery >= 0 AND jarvis_mastery <= 1),
  validation_pass_rate NUMERIC(3,2) NOT NULL CHECK (validation_pass_rate >= 0 AND validation_pass_rate <= 1),
  status TEXT NOT NULL CHECK (status IN ('certified', 'needs_retraining', 'in_progress')),
  training_data JSONB DEFAULT '{}'::jsonb,
  training_completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create MCP execution metrics table
CREATE TABLE IF NOT EXISTS public.mcp_execution_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_id UUID REFERENCES public.ai_command_history(id) ON DELETE CASCADE,
  mcp_tool TEXT NOT NULL,
  mcp_server TEXT NOT NULL,
  arguments JSONB DEFAULT '{}'::jsonb,
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  result_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.mcp_training_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_execution_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mcp_training_log
CREATE POLICY "Admins view training log"
  ON public.mcp_training_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "System inserts training log"
  ON public.mcp_training_log
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for mcp_execution_metrics
CREATE POLICY "Admins view execution metrics"
  ON public.mcp_execution_metrics
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "System inserts execution metrics"
  ON public.mcp_execution_metrics
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_training_log_session ON public.mcp_training_log(training_session_id);
CREATE INDEX idx_training_log_status ON public.mcp_training_log(status);
CREATE INDEX idx_execution_metrics_command ON public.mcp_execution_metrics(command_id);
CREATE INDEX idx_execution_metrics_tool ON public.mcp_execution_metrics(mcp_tool);
CREATE INDEX idx_execution_metrics_created ON public.mcp_execution_metrics(created_at DESC);