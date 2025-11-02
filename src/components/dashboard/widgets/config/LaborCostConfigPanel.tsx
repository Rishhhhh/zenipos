import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
            <SelectItem value="5">5 seconds</SelectItem>
            <SelectItem value="30">30 seconds</SelectItem>
            <SelectItem value="60">1 minute</SelectItem>
            <SelectItem value="300">5 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showSparkline"
          checked={config.showSparkline}
          onChange={(e) =>
            onConfigChange({ ...config, showSparkline: e.target.checked })
          }
          className="h-4 w-4"
        />
        <Label htmlFor="showSparkline" className="cursor-pointer">
          Show sparkline trend (last 8 hours)
        </Label>
      </div>
    </div>
  );
}
