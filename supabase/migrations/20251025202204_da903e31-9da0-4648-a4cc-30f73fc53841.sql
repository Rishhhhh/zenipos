-- ============================================
-- AI GOVERNANCE TABLES
-- ============================================

-- Extend audit_log with AI classification
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS classification TEXT 
  CHECK (classification IN ('safe', 'critical', 'automated'));
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS ai_context JSONB DEFAULT '{}'::jsonb;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS approved_by UUID;

CREATE INDEX IF NOT EXISTS idx_audit_log_classification ON audit_log(classification);
CREATE INDEX IF NOT EXISTS idx_audit_log_ai_context ON audit_log USING gin(ai_context);

-- AI Command History (for context and learning)
CREATE TABLE IF NOT EXISTS ai_command_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  command TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  intent TEXT,
  confidence NUMERIC(3,2),
  tools_used TEXT[],
  result JSONB,
  execution_time_ms INTEGER,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'denied', 'pending_approval')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_history_user ON ai_command_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_history_intent ON ai_command_history(intent);

-- RLS Policies
ALTER TABLE ai_command_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own AI history" ON ai_command_history;
CREATE POLICY "Users view own AI history" ON ai_command_history
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System inserts AI history" ON ai_command_history;
CREATE POLICY "System inserts AI history" ON ai_command_history
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Managers view all AI history" ON ai_command_history;
CREATE POLICY "Managers view all AI history" ON ai_command_history
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
  );

-- AI Configuration Table (system settings)
CREATE TABLE IF NOT EXISTS ai_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default AI configuration
INSERT INTO ai_config (key, value, description) VALUES
  ('enabled', 'true'::jsonb, 'Enable/disable AI assistant globally'),
  ('languages', '["en", "ms"]'::jsonb, 'Supported languages'),
  ('safe_tools', '["analyze_sales", "analyze_inventory", "get_employee_stats", "generate_insights"]'::jsonb, 'Tools that require no approval'),
  ('critical_tools', '["create_menu_item", "update_price", "adjust_inventory", "modify_promotion"]'::jsonb, 'Tools requiring manager approval'),
  ('max_auto_price_change_percent', '5'::jsonb, 'Max % price change AI can auto-approve'),
  ('kernel_context', '{"framework": "VASVELVOGVEG", "principles": ["no_prediction", "fact_based_analysis", "human_approval"]}'::jsonb, 'AI kernel guiding principles')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage AI config" ON ai_config;
CREATE POLICY "Admins manage AI config" ON ai_config
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone reads AI config" ON ai_config;
CREATE POLICY "Anyone reads AI config" ON ai_config
  FOR SELECT USING (true);