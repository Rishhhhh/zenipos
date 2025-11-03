import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { EightySixConfig } from '@/types/widgetConfigs';

interface EightySixConfigPanelProps {
  config: EightySixConfig;
  onConfigChange: (config: EightySixConfig) => void;
}

export function EightySixConfigPanel({ config, onConfigChange }: EightySixConfigPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="refreshInterval">Refresh Interval</Label>
        <Select
          value={config.refreshInterval.toString()}
          onValueChange={(value) =>
            onConfigChange({ ...config, refreshInterval: parseInt(value) as 5 | 30 | 60 | 300 })
          }
        >
          <SelectTrigger id="refreshInterval">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 seconds</SelectItem>
            <SelectItem value="30">30 seconds</SelectItem>
            <SelectItem value="60">1 minute</SelectItem>
            <SelectItem value="120">2 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="maxItems">Max Items to Display</Label>
        <Select
          value={config.maxItems.toString()}
          onValueChange={(value) =>
            onConfigChange({ ...config, maxItems: parseInt(value) as 3 | 5 | 10 })
          }
        >
          <SelectTrigger id="maxItems">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 items (no scroll)</SelectItem>
            <SelectItem value="5">5 items</SelectItem>
            <SelectItem value="10">10 items</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          3 items fit perfectly in widget. More items will scroll.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="show-last-updated">Show Last Updated</Label>
        <Switch
          id="show-last-updated"
          checked={config.showLastUpdated ?? true}
          onCheckedChange={(checked) => 
            onConfigChange({ ...config, showLastUpdated: checked })
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="compact-mode">Compact Mode</Label>
        <Switch
          id="compact-mode"
          checked={config.compactMode ?? false}
          onCheckedChange={(checked) => 
            onConfigChange({ ...config, compactMode: checked })
          }
        />
      </div>
    </div>
  );
}
