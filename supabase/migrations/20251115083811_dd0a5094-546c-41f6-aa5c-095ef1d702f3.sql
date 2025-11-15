-- Phase 3: Setup cron jobs for auto-progression
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Auto-start cooking (every minute - will check orders > 2 min old)
SELECT cron.schedule(
  'auto-start-cooking',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://eiutjobcaojpnlzgqhis.supabase.co/functions/v1/auto-start-cooking',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdXRqb2JjYW9qcG5semdxaGlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTQ4MzEsImV4cCI6MjA3Njk3MDgzMX0.KgDtoP7mAKVseFUtQm5OAKxp7vwn2bg0za-gffuQlro"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Auto-progress serving (every minute - immediate transition)
SELECT cron.schedule(
  'auto-progress-serving',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://eiutjobcaojpnlzgqhis.supabase.co/functions/v1/auto-progress-serving',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdXRqb2JjYW9qcG5semdxaGlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTQ4MzEsImV4cCI6MjA3Njk3MDgzMX0.KgDtoP7mAKVseFUtQm5OAKxp7vwn2bg0za-gffuQlro"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Auto-progress dining (every minute - will check orders > 3 min old)
SELECT cron.schedule(
  'auto-progress-dining',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://eiutjobcaojpnlzgqhis.supabase.co/functions/v1/auto-progress-dining',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdXRqb2JjYW9qcG5semdxaGlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTQ4MzEsImV4cCI6MjA3Njk3MDgzMX0.KgDtoP7mAKVseFUtQm5OAKxp7vwn2bg0za-gffuQlro"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Auto-complete stuck payments (every 5 minutes)
SELECT cron.schedule(
  'auto-complete-stuck-payments',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://eiutjobcaojpnlzgqhis.supabase.co/functions/v1/auto-complete-payments',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdXRqb2JjYW9qcG5semdxaGlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTQ4MzEsImV4cCI6MjA3Njk3MDgzMX0.KgDtoP7mAKVseFUtQm5OAKxp7vwn2bg0za-gffuQlro"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Add helpful comment
COMMENT ON EXTENSION pg_cron IS 'Job scheduler for auto-progression of order statuses';