-- Add image variant columns to menu_items table for responsive images
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS image_srcset_webp TEXT,
ADD COLUMN IF NOT EXISTS image_srcset_jpeg TEXT,
ADD COLUMN IF NOT EXISTS image_variants JSONB;

COMMENT ON COLUMN menu_items.image_srcset_webp IS 'Srcset string for WebP image variants (e.g., "url1 800w, url2 400w")';
COMMENT ON COLUMN menu_items.image_srcset_jpeg IS 'Srcset string for JPEG image variants (fallback for older browsers)';
COMMENT ON COLUMN menu_items.image_variants IS 'JSON array of all image variants with metadata (path, width, quality, format, url)';