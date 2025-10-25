-- ============================================
-- PHASE 10A: OBSERVABILITY & PERFORMANCE MONITORING
-- ============================================

-- 1. PERFORMANCE_METRICS (Client-side performance tracking)
-- ============================================
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metric details
  metric_type TEXT NOT NULL, -- 'page_load', 'route_change', 'api_call', 'kds_update'
  page_path TEXT,
  
  -- Core Web Vitals
  tti NUMERIC, -- Time to Interactive (ms)
  fcp NUMERIC, -- First Contentful Paint (ms)
  lcp NUMERIC, -- Largest Contentful Paint (ms)
  cls NUMERIC, -- Cumulative Layout Shift
  fid NUMERIC, -- First Input Delay (ms)
  
  -- Custom metrics
  duration_ms INTEGER,
  exceeded_budget BOOLEAN DEFAULT false,
  
  -- Context
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  connection_type TEXT, -- '4g', 'wifi', etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_perf_metrics_type_date ON performance_metrics(metric_type, created_at DESC);
CREATE INDEX idx_perf_metrics_exceeded ON performance_metrics(exceeded_budget) WHERE exceeded_budget = true;

-- 2. SYSTEM_HEALTH (Service health checks)
-- ============================================
CREATE TABLE system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Service info
  service_name TEXT NOT NULL, -- 'database', 'edge_functions', 'realtime', 'storage'
  check_type TEXT NOT NULL, -- 'ping', 'latency', 'error_rate'
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  
  -- Metrics
  response_time_ms INTEGER,
  error_count INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2),
  
  -- Details
  details JSONB,
  
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_health_service_time ON system_health(service_name, checked_at DESC);
CREATE INDEX idx_system_health_status ON system_health(status) WHERE status != 'healthy';

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Log performance metric
CREATE OR REPLACE FUNCTION log_performance_metric(
  _metric_type TEXT,
  _page_path TEXT,
  _duration_ms INTEGER,
  _budget_ms INTEGER,
  _device_type TEXT DEFAULT 'desktop'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO performance_metrics (
    user_id,
    metric_type,
    page_path,
    duration_ms,
    exceeded_budget,
    device_type
  ) VALUES (
    auth.uid(),
    _metric_type,
    _page_path,
    _duration_ms,
    _duration_ms > _budget_ms,
    _device_type
  );
END;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Performance Metrics
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins view all performance metrics" ON performance_metrics
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- System Health
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System inserts health checks" ON system_health
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins view system health" ON system_health
  FOR SELECT USING (has_role(auth.uid(), 'admin'));