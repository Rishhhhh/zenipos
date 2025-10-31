-- Module 4: Advanced KDS Multi-Station Routing

-- Add station routing to menu items
ALTER TABLE menu_items 
ADD COLUMN station_id UUID REFERENCES stations(id),
ADD COLUMN prep_time_minutes INTEGER DEFAULT 10,
ADD COLUMN course_sequence INTEGER DEFAULT 1; -- 1=appetizer, 2=main, 3=dessert

-- Enhance order_items with station routing and status tracking
ALTER TABLE order_items
ADD COLUMN station_id UUID REFERENCES stations(id),
ADD COLUMN status TEXT DEFAULT 'pending',
ADD COLUMN started_at TIMESTAMPTZ,
ADD COLUMN prepared_at TIMESTAMPTZ,
ADD COLUMN ready_at TIMESTAMPTZ,
ADD COLUMN prep_time_actual INTEGER, -- seconds
ADD COLUMN assigned_to UUID REFERENCES employees(id),
ADD COLUMN priority INTEGER DEFAULT 0, -- 0=normal, 1=high, 2=rush
ADD COLUMN dietary_alerts TEXT[],
ADD COLUMN fire_time TIMESTAMPTZ; -- when to start cooking (course sequencing)

-- Create KDS item status history table
CREATE TABLE kds_item_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  station_id UUID REFERENCES stations(id),
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  staff_id UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE kds_item_status ENABLE ROW LEVEL SECURITY;

-- KDS staff can view and update item status
CREATE POLICY "KDS staff can view item status"
ON kds_item_status FOR SELECT
USING (
  has_role(auth.uid(), 'kitchen'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "KDS staff can insert item status"
ON kds_item_status FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'kitchen'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
);

-- Create order priorities table
CREATE TABLE order_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  priority_level INTEGER DEFAULT 0, -- 0=normal, 1=high, 2=vip, 3=rush
  reason TEXT,
  set_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE order_priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage order priorities"
ON order_priorities FOR ALL
USING (
  has_role(auth.uid(), 'cashier'::app_role) OR
  has_role(auth.uid(), 'kitchen'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
);

-- Create function to auto-route order items to stations
CREATE OR REPLACE FUNCTION auto_route_order_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Get station from menu item if not already set
  IF NEW.station_id IS NULL THEN
    SELECT mi.station_id, mi.prep_time_minutes, mi.course_sequence
    INTO NEW.station_id, NEW.prep_time_actual, NEW.fire_time
    FROM menu_items mi
    WHERE mi.id = NEW.menu_item_id;
    
    -- Convert prep time to seconds
    NEW.prep_time_actual := COALESCE(NEW.prep_time_actual, 10) * 60;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-routing
CREATE TRIGGER auto_route_items_trigger
BEFORE INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION auto_route_order_items();

-- Add indexes for performance
CREATE INDEX idx_order_items_station_status ON order_items(station_id, status);
CREATE INDEX idx_order_items_ready_at ON order_items(ready_at) WHERE ready_at IS NOT NULL;
CREATE INDEX idx_kds_item_status_order_item ON kds_item_status(order_item_id);

-- Update existing orders to have a default station (expo/all)
-- This won't affect new orders, just ensures existing data has a station