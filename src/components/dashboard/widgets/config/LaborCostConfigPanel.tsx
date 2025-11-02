import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { LaborCostConfig } from '@/types/widgetConfigs';

interface LaborCostConfigPanelProps {
  config: LaborCostConfig;
  onConfigChange: (config: LaborCostConfig) => void;
}

export function LaborCostConfigPanel({ config, onConfigChange }: LaborCostConfigPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="targetPercentage">Target Labor %</Label>
        <Input
          id="targetPercentage"
          type="number"
          min="10"
          max="50"
          step="0.5"
          value={config.targetPercentage}
          onChange={(e) =>
            onConfigChange({ ...config, targetPercentage: parseFloat(e.target.value) || 25 })
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          Ideal labor cost as percentage of sales (typically 20-30%)
        </p>
      </div>

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

      <div className="flex items-center justify-between">
        <Label htmlFor="show-sparkline">Show 8-Hour Trend</Label>
        <Switch
          id="show-sparkline"
          checked={config.showSparkline ?? true}
          onCheckedChange={(checked) => 
            onConfigChange({ ...config, showSparkline: checked })
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
