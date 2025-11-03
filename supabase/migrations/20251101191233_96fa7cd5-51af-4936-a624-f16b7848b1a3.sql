-- Create performance_alerts table for real-time performance monitoring
CREATE TABLE IF NOT EXISTS performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  metric_type TEXT NOT NULL,
  measured_value NUMERIC NOT NULL,
  threshold_value NUMERIC NOT NULL,
  page_path TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching unresolved alerts efficiently
CREATE INDEX idx_performance_alerts_unresolved 
  ON performance_alerts(created_at DESC) 
  WHERE resolved = FALSE;

-- Index for filtering by severity
CREATE INDEX idx_performance_alerts_severity 
  ON performance_alerts(severity, created_at DESC);

-- Index for filtering by metric type
CREATE INDEX idx_performance_alerts_metric 
  ON performance_alerts(metric_type, created_at DESC);

-- Enable RLS
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view alerts (for dashboard widgets)
CREATE POLICY "Anyone can view performance alerts"
  ON performance_alerts
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert alerts
CREATE POLICY "Authenticated users can insert alerts"
  ON performance_alerts
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only authenticated users can update alerts
CREATE POLICY "Authenticated users can update alerts"
  ON performance_alerts
  FOR UPDATE
  USING (true);