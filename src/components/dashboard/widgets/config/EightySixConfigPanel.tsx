import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EightySixConfig {
  refreshInterval: number;
  maxItems: number;
  branchId?: string;
}

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
            onConfigChange({ ...config, refreshInterval: parseInt(value) })
          }
        >
          <SelectTrigger id="refreshInterval">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15000">15 seconds</SelectItem>
            <SelectItem value="30000">30 seconds</SelectItem>
            <SelectItem value="60000">1 minute</SelectItem>
            <SelectItem value="120000">2 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="maxItems">Max Items to Display</Label>
        <Select
          value={config.maxItems.toString()}
          onValueChange={(value) =>
            onConfigChange({ ...config, maxItems: parseInt(value) })
          }
        >
          <SelectTrigger id="maxItems">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 items</SelectItem>
            <SelectItem value="5">5 items</SelectItem>
            <SelectItem value="10">10 items</SelectItem>
            <SelectItem value="20">20 items</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
