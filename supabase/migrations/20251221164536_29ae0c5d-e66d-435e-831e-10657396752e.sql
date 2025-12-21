-- Add rounding_adjustment column to orders table for 10 sen rounding
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS rounding_adjustment NUMERIC(10,2) DEFAULT 0;