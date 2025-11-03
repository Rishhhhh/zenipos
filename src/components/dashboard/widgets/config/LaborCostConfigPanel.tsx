import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LaborCostConfig {
  targetPercentage: number;
  refreshInterval: number;
  showOvertimeAlert: boolean;
  branchId?: string;
}

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
            onConfigChange({ ...config, refreshInterval: parseInt(value) })
          }
        >
          <SelectTrigger id="refreshInterval">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30000">30 seconds</SelectItem>
            <SelectItem value="60000">1 minute</SelectItem>
            <SelectItem value="120000">2 minutes</SelectItem>
            <SelectItem value="300000">5 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showOvertimeAlert"
          checked={config.showOvertimeAlert}
          onChange={(e) =>
            onConfigChange({ ...config, showOvertimeAlert: e.target.checked })
          }
          className="h-4 w-4"
        />
        <Label htmlFor="showOvertimeAlert" className="cursor-pointer">
          Show overtime alerts
        </Label>
      </div>
    </div>
  );
}
