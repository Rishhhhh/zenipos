import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';

interface ImageVariant {
  path: string;
  width: number;
  quality: number;
  format: 'webp' | 'jpeg';
  url: string;
}

export interface ImageUploadResult {
  url: string;
  variants: ImageVariant[];
  srcset_webp: string;
  srcset_jpeg: string;
}

export async function uploadMenuImage(
  file: File,
  userId: string
): Promise<ImageUploadResult> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').split('.')[0];
  const basePath = `${userId}/${timestamp}-${sanitizedName}`;

  const variants: ImageVariant[] = [];
  
  // Generate WebP versions (primary - 70% smaller)
  const webpLarge = await compressImage(file, 800, 80, 'image/webp');
  const webpMedium = await compressImage(file, 400, 80, 'image/webp');
  const webpThumbnail = await compressImage(file, 200, 75, 'image/webp');
  
  // Generate JPEG fallbacks (for older browsers)
  const jpegLarge = await compressImage(file, 800, 80, 'image/jpeg');
  const jpegMedium = await compressImage(file, 400, 80, 'image/jpeg');
  
  // Upload all variants
  const uploads = [
    { file: webpLarge, path: `${basePath}-large.webp`, width: 800, quality: 80, format: 'webp' as const },
    { file: webpMedium, path: `${basePath}-medium.webp`, width: 400, quality: 80, format: 'webp' as const },
    { file: webpThumbnail, path: `${basePath}-thumb.webp`, width: 200, quality: 75, format: 'webp' as const },
    { file: jpegLarge, path: `${basePath}-large.jpg`, width: 800, quality: 80, format: 'jpeg' as const },
    { file: jpegMedium, path: `${basePath}-medium.jpg`, width: 400, quality: 80, format: 'jpeg' as const },
  ];
  
  for (const upload of uploads) {
    const { error } = await supabase.storage
      .from('menu-images')
      .upload(upload.path, upload.file, {
        cacheControl: '31536000', // 1 year - images never change
        upsert: false,
      });
    
    if (error) throw error;
    
    variants.push({
      path: upload.path,
      width: upload.width,
      quality: upload.quality,
      format: upload.format,
      url: getImagePublicUrl(upload.path),
    });
  }

  return {
    url: getImagePublicUrl(`${basePath}-large.webp`),
    variants,
    srcset_webp: getImageSrcSet(variants.filter(v => v.format === 'webp')),
    srcset_jpeg: getImageSrcSet(variants.filter(v => v.format === 'jpeg')),
  };
}

async function compressImage(
  file: File,
  maxWidth: number,
  quality: number,
  format: string
): Promise<Blob> {
  return await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: maxWidth,
    useWebWorker: true,
    fileType: format,
    initialQuality: quality / 100,
  });
}

function getImageSrcSet(variants: ImageVariant[]): string {
  return variants
    .map(v => `${v.url} ${v.width}w`)
    .join(', ');
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
