import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuickPOSConfig } from "@/types/widgetConfigs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface QuickPOSConfigPanelProps {
  config: QuickPOSConfig;
  onConfigChange: (config: QuickPOSConfig) => void;
}

export function QuickPOSConfigPanel({ config, onConfigChange }: QuickPOSConfigPanelProps) {
  const { data: categories } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order');
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Display Density</Label>
          <Select
            value={config.displayDensity}
            onValueChange={(value) => {
              const density = value as 'compact' | 'full';
              onConfigChange({ 
                ...config, 
                displayDensity: density,
                itemsPerRow: density === 'compact' ? 2 : 3 
              });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact (2 columns)</SelectItem>
              <SelectItem value="full">Full (3 columns)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cart Position</Label>
          <Select
            value={config.cartPosition}
            onValueChange={(value) => onConfigChange({ ...config, cartPosition: value as 'bottom' | 'side' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="side">Side Panel</SelectItem>
              <SelectItem value="bottom">Bottom Dock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-images">Show Item Images</Label>
          <Switch
            id="show-images"
            checked={config.showImages}
            onCheckedChange={(checked) => onConfigChange({ ...config, showImages: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="quick-add">Quick Add Mode</Label>
          <Switch
            id="quick-add"
            checked={config.quickAddMode}
            onCheckedChange={(checked) => onConfigChange({ ...config, quickAddMode: checked })}
          />
        </div>
        <p className="text-xs text-muted-foreground">Single-click add vs quantity selector</p>

        <div className="space-y-2">
          <Label>Default Category</Label>
          <Select
            value={config.defaultCategoryId || 'all'}
            onValueChange={(value) => onConfigChange({ ...config, defaultCategoryId: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Refresh Interval</Label>
          <Select
            value={config.refreshInterval.toString()}
            onValueChange={(value) => onConfigChange({ ...config, refreshInterval: parseInt(value) as 5 | 30 | 60 | 300 })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 seconds</SelectItem>
              <SelectItem value="30">30 seconds</SelectItem>
              <SelectItem value="60">1 minute</SelectItem>
              <SelectItem value="300">5 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="compact-mode">Compact Mode</Label>
          <Switch
            id="compact-mode"
            checked={config.compactMode}
            onCheckedChange={(checked) => onConfigChange({ ...config, compactMode: checked })}
          />
        </div>
      </div>
    </div>
  );
}
