-- Clean up duplicate tables (keep first created)
WITH duplicates AS (
  SELECT id, label, 
         ROW_NUMBER() OVER (PARTITION BY LOWER(label) ORDER BY created_at) as rn
  FROM tables
)
DELETE FROM tables 
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Fix stale occupied status (tables marked occupied but no active order)
UPDATE tables 
SET status = 'available',
    current_order_id = NULL,
    seated_at = NULL
WHERE status = 'occupied' 
  AND current_order_id IS NULL;

-- Sync table status with order status
UPDATE tables t
SET status = CASE 
  WHEN o.status IN ('preparing', 'delivered') THEN 'occupied'
  WHEN o.status = 'paid' THEN 'available'
  ELSE t.status
END,
current_order_id = CASE 
  WHEN o.status = 'paid' THEN NULL
  ELSE t.current_order_id
END
FROM orders o
WHERE t.current_order_id = o.id;

-- Clear current_order_id if order doesn't exist
UPDATE tables
SET current_order_id = NULL,
    status = 'available',
    seated_at = NULL
WHERE current_order_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM orders WHERE id = tables.current_order_id
  );