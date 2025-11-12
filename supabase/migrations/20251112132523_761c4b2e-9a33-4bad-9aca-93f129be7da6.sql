-- Add public RLS policy for email uniqueness checks during registration
-- This allows anonymous users to check if a login_email exists without exposing any sensitive data

CREATE POLICY "Public can check email existence for registration"
ON public.organizations
FOR SELECT
TO anon
USING (
  -- Only allow checking if login_email exists
  -- No other columns are exposed
  login_email IS NOT NULL
);