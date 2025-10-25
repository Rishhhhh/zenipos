import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';

export async function uploadMenuImage(
  file: File,
  userId: string
): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Compress image if larger than 1MB
  let processedFile = file;
  if (file.size > 1024 * 1024) {
    processedFile = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    });
  }

  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
  const filename = `${userId}/${timestamp}-${sanitizedName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('menu-images')
    .upload(filename, processedFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return getImagePublicUrl(data.path);
}

export async function deleteMenuImage(url: string): Promise<void> {
  // Extract path from public URL
  const path = url.split('/menu-images/')[1];
  if (!path) {
    throw new Error('Invalid image URL');
  }

  const { error } = await supabase.storage
    .from('menu-images')
    .remove([path]);

  if (error) {
    throw error;
  }
}

export function getImagePublicUrl(path: string): string {
  const { data } = supabase.storage
    .from('menu-images')
    .getPublicUrl(path);

  return data.publicUrl;
}
