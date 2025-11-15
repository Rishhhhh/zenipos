-- Add Foreign Key Constraints for orders.customer_id and orders.table_id
-- This enables PostgREST to automatically join these tables

-- Clean up any orphaned customer_ids before adding constraint
UPDATE orders 
SET customer_id = NULL 
WHERE customer_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM customers WHERE customers.id = orders.customer_id
  );

-- Clean up any orphaned table_ids before adding constraint
UPDATE orders 
SET table_id = NULL 
WHERE table_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM tables WHERE tables.id = orders.table_id
  );

-- Add foreign key constraint for customer_id
ALTER TABLE orders
ADD CONSTRAINT fk_orders_customer
FOREIGN KEY (customer_id) 
REFERENCES customers(id) 
ON DELETE SET NULL;

-- Add foreign key constraint for table_id
ALTER TABLE orders
ADD CONSTRAINT fk_orders_table
FOREIGN KEY (table_id) 
REFERENCES tables(id) 
ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);

-- Add comments for documentation
COMMENT ON CONSTRAINT fk_orders_customer ON orders IS 
  'Foreign key to customers table for loyalty tracking and customer history';
COMMENT ON CONSTRAINT fk_orders_table ON orders IS 
  'Foreign key to tables table for dine-in orders and table management';