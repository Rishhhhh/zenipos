-- Drop duplicate RPC functions that cause 'function not unique' errors
-- Keep the 4-parameter versions with org/branch filtering as they are more comprehensive

DROP FUNCTION IF EXISTS get_sales_by_hour(timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS get_sales_by_day_of_week(timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS get_sales_by_employee(timestamp with time zone, timestamp with time zone);
DROP FUNCTION IF EXISTS get_sales_by_category(timestamp with time zone, timestamp with time zone);