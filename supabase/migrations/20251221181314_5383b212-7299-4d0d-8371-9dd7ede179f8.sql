-- Allow 'payment_pending' mode for customer display sessions
ALTER TABLE public.customer_display_sessions
  DROP CONSTRAINT IF EXISTS customer_display_sessions_mode_check;

ALTER TABLE public.customer_display_sessions
  ADD CONSTRAINT customer_display_sessions_mode_check
  CHECK (mode = ANY (ARRAY[
    'ordering'::text,
    'payment'::text,
    'payment_pending'::text,
    'idle'::text,
    'complete'::text
  ]));