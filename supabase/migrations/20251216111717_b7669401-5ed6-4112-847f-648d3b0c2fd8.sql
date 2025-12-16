-- Allow service role and authenticated users to insert audit logs
-- Drop existing policy if it exists to recreate it properly
DROP POLICY IF EXISTS "Allow authenticated insert audit_log" ON public.audit_log;

-- Create policy that allows authenticated users to insert
CREATE POLICY "Allow authenticated users to insert audit_log"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also allow service role full access
DROP POLICY IF EXISTS "Allow service role full access" ON public.audit_log;
CREATE POLICY "Allow service role full access"
ON public.audit_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);