import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';

export interface LogoUploadResult {
  url: string;
  path: string;
}

export async function uploadOrganizationLogo(
  file: File,
  organizationId: string
): Promise<LogoUploadResult> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').split('.')[0];
  const path = `${organizationId}/${timestamp}-${sanitizedName}.webp`;

  // Compress and convert to WebP
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 400,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.85,
  });

  // Upload to storage
  const { error } = await supabase.storage
    .from('organization-logos')
    .upload(path, compressed, {
      cacheControl: '31536000', // 1 year
      upsert: true, // Allow replacing existing logo
    });

  if (error) throw error;

  // Get public URL
  const { data } = supabase.storage
    .from('organization-logos')
    .getPublicUrl(path);

  return {
    url: data.publicUrl,
    path,
  };
}

export async function deleteOrganizationLogo(url: string): Promise<void> {
  // Extract path from public URL
  const path = url.split('/organization-logos/')[1];
  if (!path) {
    throw new Error('Invalid logo URL');
  }

  const { error } = await supabase.storage
    .from('organization-logos')
    .remove([path]);

  if (error) throw error;
}
