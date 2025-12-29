import { supabase } from '@/integrations/supabase/client';
import imageCompression from 'browser-image-compression';

const BUCKET_NAME = 'payment-qr-codes';

export type QRProviderType = 'duitnow' | 'tng';

interface UploadResult {
  url: string;
  path: string;
}

export async function uploadPaymentQRCode(
  file: File,
  organizationId: string,
  providerType: QRProviderType
): Promise<UploadResult> {
  // Compress image if needed
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 512,
    useWebWorker: true,
  };

  let processedFile = file;
  if (file.size > 500 * 1024) {
    try {
      processedFile = await imageCompression(file, options);
    } catch (error) {
      console.warn('Image compression failed, using original:', error);
    }
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `${organizationId}/${providerType}-qr.${fileExt}`;

  // Delete existing file first (if any)
  await supabase.storage.from(BUCKET_NAME).remove([fileName]);

  // Upload new file
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, processedFile, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload QR code: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

export async function deletePaymentQRCode(
  organizationId: string,
  providerType: QRProviderType
): Promise<void> {
  // Try to delete both common extensions
  const extensions = ['png', 'jpg', 'jpeg', 'webp'];
  const filesToDelete = extensions.map(ext => `${organizationId}/${providerType}-qr.${ext}`);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(filesToDelete);

  if (error) {
    console.warn('Error deleting QR code:', error);
  }
}
