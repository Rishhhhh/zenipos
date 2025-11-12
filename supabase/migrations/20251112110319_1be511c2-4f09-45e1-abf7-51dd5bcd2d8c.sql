-- Create organization-logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for organization-logos bucket
CREATE POLICY "Organization owners can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-logos' AND
  has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "Anyone can view organization logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'organization-logos');

CREATE POLICY "Organization owners can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-logos' AND
  has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "Organization owners can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-logos' AND
  has_role(auth.uid(), 'owner'::app_role)
);