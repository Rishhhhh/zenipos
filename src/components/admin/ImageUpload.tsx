import { useState } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadMenuImage, deleteMenuImage } from '@/lib/storage/imageUpload';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value?: string;
  onUpload: (url: string) => void;
  onDelete?: () => void;
  maxSizeMB?: number;
}

export function ImageUpload({
  value,
  onUpload,
  onDelete,
  maxSizeMB = 2,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${maxSizeMB}MB`,
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Only image files are allowed',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // Use temporary user ID until auth is implemented
      const userId = 'temp-user';
      const url = await uploadMenuImage(file, userId);
      onUpload(url);
      toast({
        title: 'Image uploaded',
        description: 'Your image has been uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDelete = async () => {
    if (!value || !onDelete) return;
    try {
      await deleteMenuImage(value);
      onDelete();
      toast({
        title: 'Image deleted',
        description: 'Your image has been removed',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete image',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Preview"
            loading="lazy"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleDelete}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-primary bg-accent' : 'border-border'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Drop image here or</p>
                <label className="cursor-pointer">
                  <span className="text-sm text-primary hover:underline">
                    browse files
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleChange}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Max {maxSizeMB}MB • JPEG, PNG, WebP
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
