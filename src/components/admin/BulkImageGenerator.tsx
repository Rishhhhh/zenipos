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
  const [currentItem, setCurrentItem] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [recentItems, setRecentItems] = useState<Array<{ name: string; status: 'success' | 'failed' }>>([]);
  const [results, setResults] = useState<{
    success: string[];
    failed: string[];
  } | null>(null);

  // Safety check for menuItems
  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
  const itemsWithoutImages = safeMenuItems.filter(item => !item.image_url);

  const handleGenerate = async () => {
    if (itemsWithoutImages.length === 0) {
      toast.info('All menu items already have images');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setSuccessCount(0);
    setFailCount(0);
    setCurrentItem('');
    setRecentItems([]);
    setResults(null);

    const toastId = toast.loading(`Starting generation for ${itemsWithoutImages.length} items...`);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-menu-images`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ menuItems: itemsWithoutImages }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);

            if (event.type === 'progress') {
              setCurrentItem(event.itemName);
              setProgress((event.current / event.total) * 100);

              if (event.status === 'success') {
                setSuccessCount(prev => prev + 1);
                setRecentItems(prev => [
                  { name: event.itemName, status: 'success' },
                  ...prev.slice(0, 4)
                ]);
              } else if (event.status === 'failed') {
                setFailCount(prev => prev + 1);
                setRecentItems(prev => [
                  { name: event.itemName, status: 'failed' },
                  ...prev.slice(0, 4)
                ]);
              }

              toast.loading(
                `Generating: ${event.itemName} (${event.current}/${event.total})`,
                { id: toastId }
              );
            } else if (event.type === 'complete') {
              setResults(event.results);
              setProgress(100);

              toast.success(
                `✅ Generated ${event.results.success.length} images successfully!`,
                { id: toastId }
              );

              if (event.results.failed.length > 0) {
                toast.error(`❌ Failed: ${event.results.failed.length} items`);
              }

              onComplete();
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    } catch (error) {
      console.error('Bulk generation error:', error);
      toast.error('Failed to generate images', { id: toastId });
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
                {safeMenuItems.length - itemsWithoutImages.length} items already have images
              </p>
            </div>

            {isGenerating && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {currentItem && (
                  <div className="p-2 bg-primary/5 rounded text-xs">
                    <span className="text-muted-foreground">Generating: </span>
                    <span className="font-medium">{currentItem}</span>
                  </div>
                )}

                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span>{successCount} success</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-danger" />
                    <span>{failCount} failed</span>
                  </div>
                </div>

                {recentItems.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Recent:</p>
                    <div className="space-y-1">
                      {recentItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          {item.status === 'success' ? (
                            <CheckCircle2 className="h-3 w-3 text-success" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-danger" />
                          )}
                          <span className="truncate">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {results && !isGenerating && (
              <div className="space-y-2">
                {results.success.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{results.success.length} images generated successfully</span>
                  </div>
                )}
                {results.failed.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-danger">
                    <AlertCircle className="h-4 w-4" />
                    <span>{results.failed.length} items failed</span>
                  </div>
                )}
              </div>
            )}

            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Images are generated using Lovable AI for professional food photography.
                <br /><br />
                <strong>Note:</strong> AI generation uses credits from your Lovable workspace.
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
