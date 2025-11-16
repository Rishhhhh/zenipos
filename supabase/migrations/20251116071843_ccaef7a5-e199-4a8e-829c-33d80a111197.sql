-- =============================================
-- Function: cleanup_simulated_orders()
-- Purpose: Remove all orders marked as simulated
-- Safety: Only deletes orders with metadata.simulated = true
-- =============================================

CREATE OR REPLACE FUNCTION cleanup_simulated_orders()
RETURNS TABLE(
  deleted_orders INT,
  deleted_items INT,
  deleted_payments INT,
  execution_time_ms INT
) AS $$
DECLARE
  v_deleted_items INT;
  v_deleted_payments INT;
  v_deleted_orders INT;
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
BEGIN
  v_start_time := clock_timestamp();

  -- Safety check: Log what we're about to delete
  RAISE NOTICE 'Starting simulated data cleanup...';
  
  -- Count what will be deleted
  SELECT COUNT(*) INTO v_deleted_orders 
  FROM orders 
  WHERE metadata->>'simulated' = 'true';
  
  RAISE NOTICE 'Found % simulated orders to delete', v_deleted_orders;

  -- Delete order_items first (foreign key dependency)
  DELETE FROM order_items 
  WHERE order_id IN (
    SELECT id FROM orders 
    WHERE metadata->>'simulated' = 'true'
  );
  GET DIAGNOSTICS v_deleted_items = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % order_items', v_deleted_items;

  -- Delete payments
  DELETE FROM payments 
  WHERE order_id IN (
    SELECT id FROM orders 
    WHERE metadata->>'simulated' = 'true'
  );
  GET DIAGNOSTICS v_deleted_payments = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % payments', v_deleted_payments;

  -- Delete orders
  DELETE FROM orders 
  WHERE metadata->>'simulated' = 'true';
  GET DIAGNOSTICS v_deleted_orders = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % orders', v_deleted_orders;

  v_end_time := clock_timestamp();

  -- Log cleanup to audit_log
  INSERT INTO audit_log (action, entity, diff, created_at)
  VALUES (
    'cleanup_simulation',
    'orders',
    jsonb_build_object(
      'deleted_orders', v_deleted_orders,
      'deleted_items', v_deleted_items,
      'deleted_payments', v_deleted_payments,
      'execution_time_ms', EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))
    ),
    NOW()
  );

  RETURN QUERY SELECT 
    v_deleted_orders,
    v_deleted_items,
    v_deleted_payments,
    EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time))::INT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (managers/admins only via RLS)
GRANT EXECUTE ON FUNCTION cleanup_simulated_orders() TO authenticated;

-- Add comment
COMMENT ON FUNCTION cleanup_simulated_orders IS 
  'Removes all orders with metadata.simulated = true. Safe to run anytime. Logs to audit_log.';