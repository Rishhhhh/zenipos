import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ImagePlus, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface BulkImageGeneratorProps {
  menuItems: Array<{ id: string; name: string; category_id: string; image_url: string | null }>;
  onComplete: () => void;
}

export function BulkImageGenerator({ menuItems, onComplete }: BulkImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    success: string[];
    unsplashFailed: string[];
    failed: string[];
  } | null>(null);
  const [useLovableAIFallback, setUseLovableAIFallback] = useState(false);

  const itemsWithoutImages = menuItems.filter(item => !item.image_url);

  const handleGenerate = async () => {
    if (itemsWithoutImages.length === 0) {
      toast.info('All menu items already have images');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setResults(null);

    try {
      toast.loading(`Generating images for ${itemsWithoutImages.length} items...`);

      const { data, error } = await supabase.functions.invoke('generate-menu-images', {
        body: {
          menuItems: itemsWithoutImages,
          useLovableAIFallback,
        },
      });

      if (error) throw error;

      setResults(data);
      setProgress(100);

      const successCount = data.success.length;
      const failCount = data.failed.length + data.unsplashFailed.length;

      if (successCount > 0) {
        toast.success(`✅ Generated ${successCount} images successfully!`);
      }
      if (data.unsplashFailed.length > 0 && !useLovableAIFallback) {
        toast.warning(`⚠️ ${data.unsplashFailed.length} items need AI generation (enable fallback)`);
      }
      if (failCount > 0) {
        toast.error(`❌ Failed to generate ${failCount} images`);
      }

      onComplete();
    } catch (error) {
      console.error('Bulk generation error:', error);
      toast.error('Failed to generate images');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ImagePlus className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Bulk Image Generation</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="font-medium">{itemsWithoutImages.length} items without images</p>
            <p className="text-sm text-muted-foreground">
              {menuItems.length - itemsWithoutImages.length} items already have images
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || itemsWithoutImages.length === 0}
            size="lg"
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            Generate Images
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
          <div className="flex-1">
            <Label htmlFor="ai-fallback" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium">Use Lovable AI Fallback</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Generate with AI if no stock photos found (uses credits)
              </p>
            </Label>
          </div>
          <Switch
            id="ai-fallback"
            checked={useLovableAIFallback}
            onCheckedChange={setUseLovableAIFallback}
            disabled={isGenerating}
          />
        </div>

        {isGenerating && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              Generating images...
            </p>
          </div>
        )}

        {results && (
          <div className="space-y-3">
            {results.success.length > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Success ({results.success.length}):</strong>
                  <div className="text-xs mt-1 text-muted-foreground">
                    {results.success.join(', ')}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {results.unsplashFailed.length > 0 && (
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>No stock photos found ({results.unsplashFailed.length}):</strong>
                  <div className="text-xs mt-1 text-muted-foreground">
                    {results.unsplashFailed.join(', ')}
                  </div>
                  <p className="text-xs mt-2">
                    Enable "Lovable AI Fallback" above and regenerate to use AI for these items.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {results.failed.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Failed ({results.failed.length}):</strong>
                  <div className="text-xs mt-1">
                    {results.failed.join(', ')}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>How it works:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>First tries FREE Unsplash stock photos (no cost)</li>
              <li>If enabled, falls back to Lovable AI for missing items (uses credits)</li>
              <li>Images are optimized and uploaded to your storage</li>
              <li>Menu items are automatically updated</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  );
}
