-- Create rate_limit_log table
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('user', 'ip', 'api_key', 'blocked_ip')),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  limit_window TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  limit_exceeded BOOLEAN NOT NULL DEFAULT false,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_rate_limit_identifier ON public.rate_limit_log(identifier, endpoint, window_start);
CREATE INDEX idx_rate_limit_exceeded ON public.rate_limit_log(limit_exceeded, created_at) WHERE limit_exceeded = true;
CREATE INDEX idx_rate_limit_window ON public.rate_limit_log(window_start);

-- Enable RLS
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "System can insert rate limit logs"
  ON public.rate_limit_log
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view rate limit logs"
  ON public.rate_limit_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Helper function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_identifier_type TEXT,
  p_endpoint TEXT,
  p_method TEXT,
  p_limit INTEGER,
  p_window_minutes INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
  v_limit_exceeded BOOLEAN;
BEGIN
  -- Calculate window start time
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Count requests in current window
  SELECT COUNT(*) INTO v_current_count
  FROM rate_limit_log
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;
  
  -- Determine if limit exceeded
  v_limit_exceeded := (v_current_count >= p_limit);
  
  -- Log this request
  INSERT INTO rate_limit_log (
    identifier,
    identifier_type,
    endpoint,
    method,
    limit_window,
    request_count,
    limit_exceeded,
    window_start
  ) VALUES (
    p_identifier,
    p_identifier_type,
    p_endpoint,
    p_method,
    p_window_minutes || 'm',
    v_current_count + 1,
    v_limit_exceeded,
    v_window_start
  );
  
  -- Return true if under limit, false if exceeded
  RETURN NOT v_limit_exceeded;
END;
$$;