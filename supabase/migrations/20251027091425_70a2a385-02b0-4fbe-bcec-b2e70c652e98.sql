-- Phase 1: System Configuration & Changelog Tables

-- System config for demo mode toggle
CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default demo mode config
INSERT INTO system_config (key, value, description) VALUES 
  ('demo_mode', '{"enabled": false, "seed": 42}'::jsonb, 'Demo data simulation toggle');

-- System changelog for version tracking
CREATE TABLE system_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('feature', 'bugfix', 'refactor', 'breaking', 'security', 'performance')),
  module VARCHAR(50),
  title TEXT NOT NULL,
  description TEXT,
  changes JSONB,
  author_id UUID REFERENCES auth.users(id),
  released_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_changelog_version ON system_changelog(version DESC);
CREATE INDEX idx_changelog_module ON system_changelog(module);
CREATE INDEX idx_changelog_released ON system_changelog(released_at DESC);

-- Documentation system
CREATE TABLE documentation_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  tags TEXT[],
  version VARCHAR(20),
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0
);

CREATE INDEX idx_docs_slug ON documentation_pages(slug);
CREATE INDEX idx_docs_category ON documentation_pages(category);
CREATE INDEX idx_docs_published ON documentation_pages(is_published) WHERE is_published = true;

CREATE TABLE documentation_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES documentation_pages(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Demo data tracking
CREATE TABLE demo_data_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  seed INTEGER
);

CREATE INDEX idx_demo_table ON demo_data_metadata(table_name);
CREATE INDEX idx_demo_record ON demo_data_metadata(record_id);

-- RLS Policies
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_data_metadata ENABLE ROW LEVEL SECURITY;

-- System config: Admins can modify, all authenticated can read
CREATE POLICY "Admins manage system config" ON system_config
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read system config" ON system_config
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Changelog: Anyone can read, admins can write
CREATE POLICY "Anyone reads changelog" ON system_changelog
  FOR SELECT USING (true);

CREATE POLICY "Admins manage changelog" ON system_changelog
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Documentation: Published docs readable by all, admins manage
CREATE POLICY "Anyone reads published docs" ON documentation_pages
  FOR SELECT USING (is_published = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage docs" ON documentation_pages
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone reads doc attachments" ON documentation_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documentation_pages dp
      WHERE dp.id = documentation_attachments.page_id
      AND (dp.is_published = true OR has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Admins manage doc attachments" ON documentation_attachments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Demo metadata: Admins only
CREATE POLICY "Admins manage demo metadata" ON demo_data_metadata
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documentation_pages_updated_at
  BEFORE UPDATE ON documentation_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed initial documentation
INSERT INTO documentation_pages (slug, title, content, category, is_published) VALUES
  ('/overview', 'System Overview', E'# Restaurant POS System\n\n## Architecture\n\nThis is a modern, cloud-native Point of Sale system built with:\n\n- **Frontend**: React + TypeScript + Vite\n- **Backend**: Supabase (PostgreSQL + Realtime + Edge Functions)\n- **State Management**: Zustand + React Query\n- **UI Framework**: Tailwind CSS + shadcn/ui\n\n## Core Modules\n\n1. **POS**: Point of sale interface for cashiers\n2. **KDS**: Kitchen display system for order management\n3. **Admin**: Configuration and management\n4. **Dashboard**: Analytics and insights\n\n## Key Features\n\n- Dual-screen operation (Cashier + Customer)\n- Real-time order synchronization\n- Inventory management with auto-deduction\n- Loyalty points system\n- Multi-payment support (Cash, QR, Card)\n- AI-powered insights and forecasting', 'general', true),
  
  ('/modules/pos', 'Point of Sale Module', E'# POS Module\n\n## Overview\n\nThe POS module is the core cashier interface for processing orders.\n\n## Features\n\n- Category-based menu browsing\n- Quick item search\n- Modifier selection\n- Multiple payment methods\n- Table assignment\n- Split bill support\n- Receipt printing\n\n## Workflow\n\n1. Select table or order type (dine-in/takeaway)\n2. Add items to cart\n3. Apply modifiers and special instructions\n4. Review cart and apply promotions\n5. Send to kitchen (KDS)\n6. Process payment\n7. Print receipt\n\n## Keyboard Shortcuts\n\n- `⌘1`: Open POS\n- `⌘K`: Search menu items\n- `Enter`: Add selected item to cart', 'modules', true),
  
  ('/modules/kds', 'Kitchen Display System', E'# KDS Module\n\n## Overview\n\nThe Kitchen Display System manages order flow from POS to kitchen stations.\n\n## Features\n\n- Station-based routing\n- Order prioritization\n- Preparation timers\n- Bump/recall functionality\n- Color-coded status indicators\n\n## Order Lifecycle\n\n1. **New**: Order received from POS\n2. **Preparing**: Kitchen started working\n3. **Ready**: Food ready for serving\n4. **Done**: Order completed and bumped\n\n## Station Types\n\n- Expo: Main expeditor screen\n- Grill: Grilled items\n- Wok: Stir-fry items\n- Cold: Salads and cold dishes\n- Dessert: Desserts and pastries', 'modules', true),
  
  ('/database/schema', 'Database Schema', E'# Database Schema\n\n## Core Tables\n\n### orders\nStores all order transactions\n- `id`: UUID primary key\n- `session_id`: Links POS to customer screen\n- `order_type`: dine_in | takeaway | delivery\n- `status`: new | preparing | ready | done\n- `subtotal`, `tax`, `discount`, `total`: Calculated amounts\n\n### order_items\nLine items for each order\n- `order_id`: FK to orders\n- `menu_item_id`: FK to menu_items\n- `quantity`: Number of items\n- `modifiers`: JSONB array of modifier choices\n\n### menu_items\nProduct catalog\n- `name`, `sku`, `price`, `cost`\n- `category_id`: FK to menu_categories\n- `track_inventory`: Boolean flag\n\n### inventory_items\nStock management\n- `current_qty`: Current stock level\n- `reorder_point`: Threshold for reordering\n- `unit`: Measurement unit (kg, L, pcs)\n\n### recipes\nBill of materials\n- Links menu items to inventory ingredients\n- `quantity_per_serving`: Amount needed per dish', 'technical', true),
  
  ('/api/edge-functions', 'Edge Functions API', E'# Edge Functions\n\n## Available Functions\n\n### ai-orchestrator\nAI assistant for insights and recommendations\n- **Endpoint**: `/functions/v1/ai-orchestrator`\n- **Auth**: Required (JWT)\n- **Body**: `{ type, context, data }`\n\n### generate-demo-data\nPopulates database with realistic demo data\n- **Endpoint**: `/functions/v1/generate-demo-data`\n- **Auth**: Admin only\n- **Body**: `{ seed?: number }`\n\n### inventory-forecast\nPredicts inventory needs\n- **Endpoint**: `/functions/v1/inventory-forecast`\n- **Auth**: Required\n- **Body**: `{ days: number }`\n\n### loyalty-insights\nCustomer loyalty analytics\n- **Endpoint**: `/functions/v1/loyalty-insights`\n- **Auth**: Required\n- **Returns**: Top customers, redemption rates', 'technical', true);

-- Seed initial changelog
INSERT INTO system_changelog (version, type, module, title, description, changes) VALUES
  ('1.0.0', 'feature', 'system', 'Initial Release', 'Complete POS system with all core modules', '{"files": ["Initial codebase"], "timestamp": "2025-01-01T00:00:00Z"}'::jsonb),
  ('1.1.0', 'feature', 'dashboard', 'Widget System', 'Draggable, resizable widget dashboard with 8+ widgets', '{"files": ["Dashboard.tsx", "WidgetLibrary.tsx", "5 widget components"], "timestamp": "2025-01-15T00:00:00Z"}'::jsonb),
  ('1.2.0', 'feature', 'admin', 'Admin Redesign', 'Compact module cards with detail modals and search', '{"files": ["Admin.tsx", "CompactModuleCard.tsx", "ModuleDetailModal.tsx"], "timestamp": "2025-01-20T00:00:00Z"}'::jsonb),
  ('1.3.0', 'feature', 'system', 'Documentation & Changelog', 'Added comprehensive documentation portal and version tracking', '{"files": ["Changelog.tsx", "Documentation.tsx", "system migrations"], "timestamp": "2025-01-25T00:00:00Z"}'::jsonb);