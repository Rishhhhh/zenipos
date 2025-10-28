-- Create RPC functions for Reports Dashboard

-- Function 1: Get sales by hour of day
CREATE OR REPLACE FUNCTION get_sales_by_hour(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  hour INT,
  total_sales NUMERIC,
  order_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    EXTRACT(HOUR FROM created_at)::INT as hour,
    COALESCE(SUM(total), 0) as total_sales,
    COUNT(*)::BIGINT as order_count
  FROM orders
  WHERE created_at >= start_date 
    AND created_at <= end_date
    AND status IN ('completed', 'paid')
  GROUP BY EXTRACT(HOUR FROM created_at)
  ORDER BY hour;
$$;

-- Function 2: Calculate COGS (Cost of Goods Sold)
CREATE OR REPLACE FUNCTION calculate_cogs(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  cogs_percentage NUMERIC,
  food_cost_percentage NUMERIC,
  total_cogs NUMERIC,
  total_revenue NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH sales_data AS (
    SELECT COALESCE(SUM(o.total), 0) as revenue
    FROM orders o
    WHERE o.created_at >= start_date 
      AND o.created_at <= end_date
      AND o.status IN ('completed', 'paid')
  ),
  cost_data AS (
    SELECT COALESCE(SUM(oi.unit_price * oi.quantity * COALESCE(mi.cost, 0) / NULLIF(mi.price, 0)), 0) as total_cost
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
    WHERE o.created_at >= start_date 
      AND o.created_at <= end_date
      AND o.status IN ('completed', 'paid')
  )
  SELECT 
    CASE WHEN s.revenue > 0 THEN (c.total_cost / s.revenue * 100) ELSE 0 END as cogs_percentage,
    CASE WHEN s.revenue > 0 THEN (c.total_cost / s.revenue * 100) ELSE 0 END as food_cost_percentage,
    c.total_cost as total_cogs,
    s.revenue as total_revenue
  FROM sales_data s, cost_data c;
$$;

-- Function 3: Get sales by employee
CREATE OR REPLACE FUNCTION get_sales_by_employee(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  total_sales NUMERIC,
  order_count BIGINT,
  hours_worked NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.id as employee_id,
    e.name as employee_name,
    COALESCE(SUM(o.total), 0) as total_sales,
    COUNT(o.id)::BIGINT as order_count,
    COALESCE(SUM(EXTRACT(EPOCH FROM (s.clock_out_at - s.clock_in_at)) / 3600), 0)::NUMERIC as hours_worked
  FROM employees e
  LEFT JOIN orders o ON o.created_by = e.auth_user_id 
    AND o.created_at >= start_date 
    AND o.created_at <= end_date
    AND o.status IN ('completed', 'paid')
  LEFT JOIN shifts s ON s.employee_id = e.id
    AND s.clock_in_at >= start_date
    AND s.clock_in_at <= end_date
  GROUP BY e.id, e.name
  ORDER BY total_sales DESC;
$$;

-- Function 4: Get top selling items
CREATE OR REPLACE FUNCTION get_top_selling_items(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  item_id UUID,
  item_name TEXT,
  quantity_sold BIGINT,
  total_revenue NUMERIC,
  times_ordered BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    mi.id as item_id,
    mi.name as item_name,
    COALESCE(SUM(oi.quantity), 0)::BIGINT as quantity_sold,
    COALESCE(SUM(oi.unit_price * oi.quantity), 0) as total_revenue,
    COUNT(DISTINCT oi.order_id)::BIGINT as times_ordered
  FROM menu_items mi
  LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
  LEFT JOIN orders o ON o.id = oi.order_id
    AND o.created_at >= start_date
    AND o.created_at <= end_date
    AND o.status IN ('completed', 'paid')
  GROUP BY mi.id, mi.name
  HAVING SUM(oi.quantity) > 0
  ORDER BY quantity_sold DESC
  LIMIT limit_count;
$$;

-- Function 5: Get sales by category
CREATE OR REPLACE FUNCTION get_sales_by_category(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  total_sales NUMERIC,
  item_count BIGINT,
  percentage_of_total NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH category_sales AS (
    SELECT 
      mc.id as cat_id,
      mc.name as cat_name,
      COALESCE(SUM(oi.unit_price * oi.quantity), 0) as sales
    FROM menu_categories mc
    LEFT JOIN menu_items mi ON mi.category_id = mc.id
    LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
    LEFT JOIN orders o ON o.id = oi.order_id
      AND o.created_at >= start_date
      AND o.created_at <= end_date
      AND o.status IN ('completed', 'paid')
    GROUP BY mc.id, mc.name
  ),
  total_sales AS (
    SELECT SUM(sales) as total FROM category_sales
  )
  SELECT 
    cs.cat_id as category_id,
    cs.cat_name as category_name,
    cs.sales as total_sales,
    0::BIGINT as item_count,
    CASE WHEN ts.total > 0 THEN (cs.sales / ts.total * 100) ELSE 0 END as percentage_of_total
  FROM category_sales cs, total_sales ts
  WHERE cs.sales > 0
  ORDER BY cs.sales DESC;
$$;

-- Function 6: Get sales by day of week
CREATE OR REPLACE FUNCTION get_sales_by_day_of_week(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  day_of_week INT,
  total_sales NUMERIC,
  order_count BIGINT,
  avg_ticket NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    EXTRACT(DOW FROM created_at)::INT as day_of_week,
    COALESCE(SUM(total), 0) as total_sales,
    COUNT(*)::BIGINT as order_count,
    CASE WHEN COUNT(*) > 0 THEN AVG(total) ELSE 0 END as avg_ticket
  FROM orders
  WHERE created_at >= start_date 
    AND created_at <= end_date
    AND status IN ('completed', 'paid')
  GROUP BY EXTRACT(DOW FROM created_at)
  ORDER BY day_of_week;
$$;