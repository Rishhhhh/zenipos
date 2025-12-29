-- Add QR URL columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS duitnow_qr_url TEXT,
ADD COLUMN IF NOT EXISTS tng_qr_url TEXT;

-- Add QR image URL column to customer_display_sessions for broadcasting
ALTER TABLE customer_display_sessions
ADD COLUMN IF NOT EXISTS payment_qr_image_url TEXT;

-- Create storage bucket for payment QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-qr-codes', 'payment-qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment QR codes
CREATE POLICY "Anyone can view payment QR codes"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-qr-codes');

CREATE POLICY "Authenticated users can upload payment QR codes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-qr-codes' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update payment QR codes"
ON storage.objects FOR UPDATE
USING (bucket_id = 'payment-qr-codes' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete payment QR codes"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-qr-codes' AND auth.role() = 'authenticated');