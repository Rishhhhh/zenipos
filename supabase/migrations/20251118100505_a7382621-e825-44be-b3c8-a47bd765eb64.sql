-- PHASE 4 COMPLETION: Remaining RPC Functions and Create Tables for Acc X

-- Update get_sales_by_category
CREATE OR REPLACE FUNCTION public.get_sales_by_category(start_date timestamptz, end_date timestamptz, _organization_id uuid DEFAULT NULL, _branch_id uuid DEFAULT NULL)
RETURNS TABLE(category_name text, total_sales numeric, item_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT mc.name, SUM(oi.quantity * oi.unit_price), COUNT(DISTINCT oi.menu_item_id)::BIGINT
  FROM order_items oi JOIN menu_items mi ON mi.id = oi.menu_item_id 
  JOIN menu_categories mc ON mc.id = mi.category_id JOIN orders o ON o.id = oi.order_id
  WHERE o.created_at >= start_date AND o.created_at <= end_date AND o.status IN ('completed', 'paid')
  AND (_organization_id IS NULL OR oi.organization_id = _organization_id) AND (_branch_id IS NULL OR o.branch_id = _branch_id)
  GROUP BY mc.name ORDER BY SUM(oi.quantity * oi.unit_price) DESC;
$function$;

-- Update get_sales_by_employee
CREATE OR REPLACE FUNCTION public.get_sales_by_employee(start_date timestamptz, end_date timestamptz, _organization_id uuid DEFAULT NULL, _branch_id uuid DEFAULT NULL)
RETURNS TABLE(employee_name text, order_count bigint, total_sales numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT e.name, COUNT(*)::BIGINT, SUM(o.total)
  FROM orders o JOIN employees e ON e.id = o.created_by
  WHERE o.created_at >= start_date AND o.created_at <= end_date AND o.status IN ('completed', 'paid')
  AND (_organization_id IS NULL OR o.organization_id = _organization_id) AND (_branch_id IS NULL OR o.branch_id = _branch_id)
  GROUP BY e.name ORDER BY SUM(o.total) DESC;
$function$;

-- Update get_sales_by_day_of_week
CREATE OR REPLACE FUNCTION public.get_sales_by_day_of_week(start_date timestamptz, end_date timestamptz, _organization_id uuid DEFAULT NULL, _branch_id uuid DEFAULT NULL)
RETURNS TABLE(day_of_week integer, day_name text, total_sales numeric, order_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT EXTRACT(DOW FROM created_at)::INT, TO_CHAR(created_at, 'Day'), SUM(total), COUNT(*)::BIGINT
  FROM orders
  WHERE created_at >= start_date AND created_at <= end_date AND status IN ('completed', 'paid')
  AND (_organization_id IS NULL OR organization_id = _organization_id) AND (_branch_id IS NULL OR branch_id = _branch_id)
  GROUP BY EXTRACT(DOW FROM created_at), TO_CHAR(created_at, 'Day') ORDER BY EXTRACT(DOW FROM created_at);
$function$;

-- Update get_active_eighty_six_items
CREATE OR REPLACE FUNCTION public.get_active_eighty_six_items(_organization_id uuid DEFAULT NULL, _branch_id uuid DEFAULT NULL)
RETURNS TABLE(id uuid, menu_item_id uuid, item_name text, reason text, created_at timestamptz, estimated_return_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT esi.id, esi.menu_item_id, mi.name, esi.reason, esi.created_at, esi.estimated_return_at
  FROM eighty_six_items esi JOIN menu_items mi ON mi.id = esi.menu_item_id
  WHERE esi.active = true
  AND (_organization_id IS NULL OR esi.organization_id = _organization_id) AND (_branch_id IS NULL OR esi.branch_id = _branch_id)
  ORDER BY esi.created_at DESC;
$function$;

-- Create 5 tables for acc X (restoranalmufahtasik@gmail.com)
INSERT INTO tables (label, seats, status, branch_id, organization_id) VALUES
('T1', 4, 'available', '7af1c5d8-e253-4f4f-b858-65193b33105b', 'e511db38-cd22-435b-9842-1790575704f1'),
('T2', 4, 'available', '7af1c5d8-e253-4f4f-b858-65193b33105b', 'e511db38-cd22-435b-9842-1790575704f1'),
('T3', 6, 'available', '7af1c5d8-e253-4f4f-b858-65193b33105b', 'e511db38-cd22-435b-9842-1790575704f1'),
('T4', 2, 'available', '7af1c5d8-e253-4f4f-b858-65193b33105b', 'e511db38-cd22-435b-9842-1790575704f1'),
('T5', 8, 'available', '7af1c5d8-e253-4f4f-b858-65193b33105b', 'e511db38-cd22-435b-9842-1790575704f1')
ON CONFLICT DO NOTHING;