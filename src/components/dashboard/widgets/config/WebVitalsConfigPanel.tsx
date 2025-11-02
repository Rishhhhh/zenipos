import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WebVitalsConfig } from '@/types/widgetConfigs';

interface WebVitalsConfigPanelProps {
  config: WebVitalsConfig;
  onConfigChange: (config: WebVitalsConfig) => void;
}

export function WebVitalsConfigPanel({ config, onConfigChange }: WebVitalsConfigPanelProps) {
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
            <SelectItem value="30">30 seconds</SelectItem>
            <SelectItem value="60">1 minute</SelectItem>
            <SelectItem value="120">2 minutes</SelectItem>
            <SelectItem value="300">5 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 pt-2 border-t">
        <Label>Performance Thresholds</Label>
        
        <div>
          <Label htmlFor="lcp-threshold" className="text-xs text-muted-foreground">
            LCP (Largest Contentful Paint) - ms
          </Label>
          <Input
            id="lcp-threshold"
            type="number"
            min="1000"
            max="5000"
            step="100"
            value={config.thresholds.lcp}
            onChange={(e) =>
              onConfigChange({ 
                ...config, 
                thresholds: { ...config.thresholds, lcp: parseInt(e.target.value) || 2500 }
              })
            }
          />
        </div>

        <div>
          <Label htmlFor="fid-threshold" className="text-xs text-muted-foreground">
            FID (First Input Delay) - ms
          </Label>
          <Input
            id="fid-threshold"
            type="number"
            min="50"
            max="300"
            step="10"
            value={config.thresholds.fid}
            onChange={(e) =>
              onConfigChange({ 
                ...config, 
                thresholds: { ...config.thresholds, fid: parseInt(e.target.value) || 100 }
              })
            }
          />
        </div>

        <div>
          <Label htmlFor="cls-threshold" className="text-xs text-muted-foreground">
            CLS (Cumulative Layout Shift) - score
          </Label>
          <Input
            id="cls-threshold"
            type="number"
            min="0.05"
            max="0.5"
            step="0.01"
            value={config.thresholds.cls}
            onChange={(e) =>
              onConfigChange({ 
                ...config, 
                thresholds: { ...config.thresholds, cls: parseFloat(e.target.value) || 0.1 }
              })
            }
          />
        </div>

        <div>
          <Label htmlFor="tti-threshold" className="text-xs text-muted-foreground">
            TTI (Time to Interactive) - ms
          </Label>
          <Input
            id="tti-threshold"
            type="number"
            min="1000"
            max="5000"
            step="100"
            value={config.thresholds.tti}
            onChange={(e) =>
              onConfigChange({ 
                ...config, 
                thresholds: { ...config.thresholds, tti: parseInt(e.target.value) || 2000 }
              })
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <Label htmlFor="show-alerts">Show Alert Count</Label>
        <Switch
          id="show-alerts"
          checked={config.showAlertCount ?? false}
          onCheckedChange={(checked) => 
            onConfigChange({ ...config, showAlertCount: checked })
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
