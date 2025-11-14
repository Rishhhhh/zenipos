import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ImagePlus, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="default">
          <ImagePlus className="h-4 w-4 mr-2" />
          Generate Images
          {itemsWithoutImages.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
              {itemsWithoutImages.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Bulk Image Generation</h3>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{itemsWithoutImages.length} items without images</p>
              <p className="text-xs text-muted-foreground">
                {menuItems.length - itemsWithoutImages.length} items already have images
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
              <div className="flex-1">
                <Label htmlFor="ai-fallback" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Use AI Fallback</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generate with AI if no stock photos found
                  </p>
                </Label>
              </div>
              <Switch
                id="ai-fallback"
                checked={useLovableAIFallback}
                onCheckedChange={setUseLovableAIFallback}
              />
            </div>

            {isGenerating && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">Generating images...</p>
              </div>
            )}

            {results && (
              <div className="space-y-2 text-xs">
                {results.success.length > 0 && (
                  <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        {results.success.length} successful
                      </p>
                    </div>
                  </div>
                )}
                {results.unsplashFailed.length > 0 && (
                  <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-900 dark:text-yellow-100">
                        {results.unsplashFailed.length} need AI generation
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300">Enable AI fallback to generate</p>
                    </div>
                  </div>
                )}
                {results.failed.length > 0 && (
                  <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-100">
                        {results.failed.length} failed
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Alert className="border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Uses Unsplash for free stock photos. Enable AI fallback for custom generation (uses credits).
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || itemsWithoutImages.length === 0}
              className="w-full"
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Images'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
