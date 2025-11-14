-- Add branch_id columns to stock_moves and wastage_logs
ALTER TABLE stock_moves ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
CREATE INDEX IF NOT EXISTS idx_stock_moves_branch ON stock_moves(branch_id);

ALTER TABLE wastage_logs ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
CREATE INDEX IF NOT EXISTS idx_wastage_logs_branch ON wastage_logs(branch_id);

-- Backfill branch_id from inventory_items
UPDATE stock_moves sm
SET branch_id = ii.branch_id
FROM inventory_items ii
WHERE sm.inventory_item_id = ii.id
  AND sm.branch_id IS NULL;

UPDATE wastage_logs wl
SET branch_id = ii.branch_id
FROM inventory_items ii
WHERE wl.inventory_item_id = ii.id
  AND wl.branch_id IS NULL;

-- Update get_low_stock_items RPC to accept branch parameter
CREATE OR REPLACE FUNCTION get_low_stock_items(branch_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sku TEXT,
  current_qty NUMERIC,
  reorder_point NUMERIC,
  unit TEXT,
  branch_id UUID,
  days_until_stockout INTEGER
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    ii.id,
    ii.name,
    ii.sku,
    ii.current_qty,
    ii.reorder_point,
    ii.unit,
    ii.branch_id,
    CASE 
      WHEN ii.current_qty <= 0 THEN 0
      ELSE GREATEST(0, FLOOR(
        ii.current_qty / NULLIF(
          (SELECT ABS(SUM(quantity)) / 30.0 
           FROM stock_moves 
           WHERE inventory_item_id = ii.id 
             AND type = 'order_consumption'
             AND created_at >= NOW() - INTERVAL '30 days'),
          0
        )
      ))
    END::INTEGER as days_until_stockout
  FROM inventory_items ii
  WHERE ii.current_qty <= ii.reorder_point
    AND (branch_id_param IS NULL OR ii.branch_id = branch_id_param)
  ORDER BY ii.current_qty / NULLIF(ii.reorder_point, 1) ASC;
$$;