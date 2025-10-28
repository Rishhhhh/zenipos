-- Add metadata column to orders table for simulation tracking
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for efficient querying of simulated orders
CREATE INDEX IF NOT EXISTS idx_orders_metadata_simulated 
ON orders USING gin ((metadata->'simulated'));

-- Create index for efficient date-based queries  
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders (created_at DESC);