-- Create function to get hourly labor percentage sparkline data
CREATE OR REPLACE FUNCTION get_labor_sparkline(hours_back INTEGER DEFAULT 8)
RETURNS TABLE (
  hour_label TEXT,
  labor_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH hourly_data AS (
    SELECT 
      date_trunc('hour', s.clock_in_at) AS hour,
      SUM(
        EXTRACT(EPOCH FROM (COALESCE(s.clock_out_at, NOW()) - s.clock_in_at)) / 3600 
        * COALESCE(e.pay_rate, 0)
      ) AS labor_cost
    FROM shifts s
    LEFT JOIN employees e ON s.employee_id = e.id
    WHERE s.clock_in_at >= NOW() - (hours_back || ' hours')::INTERVAL
    GROUP BY hour
  ),
  hourly_sales AS (
    SELECT 
      date_trunc('hour', o.created_at) AS hour,
      SUM(o.total) AS sales
    FROM orders o
    WHERE o.created_at >= NOW() - (hours_back || ' hours')::INTERVAL
      AND o.status = 'completed'
    GROUP BY hour
  )
  SELECT 
    TO_CHAR(hd.hour, 'HH24:MI') AS hour_label,
    ROUND(
      CASE 
        WHEN COALESCE(hs.sales, 0) > 0 
        THEN (hd.labor_cost / hs.sales) * 100 
        ELSE 0 
      END,
      2
    ) AS labor_percentage
  FROM hourly_data hd
  LEFT JOIN hourly_sales hs ON hd.hour = hs.hour
  ORDER BY hd.hour ASC;
END;
$$ LANGUAGE plpgsql;