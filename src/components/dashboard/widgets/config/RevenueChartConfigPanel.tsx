import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RevenueChartConfig } from "@/types/widgetConfigs";

interface RevenueChartConfigPanelProps {
  config: RevenueChartConfig;
  onConfigChange: (config: RevenueChartConfig) => void;
}

export function RevenueChartConfigPanel({ config, onConfigChange }: RevenueChartConfigPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Time Granularity</Label>
          <RadioGroup
            value={config.timeGranularity}
            onValueChange={(value) => onConfigChange({ ...config, timeGranularity: value as any })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hourly" id="hourly" />
              <Label htmlFor="hourly" className="font-normal">Hourly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="daily" id="daily" />
              <Label htmlFor="daily" className="font-normal">Daily</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly" className="font-normal">Weekly</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Chart Type</Label>
          <RadioGroup
            value={config.chartType}
            onValueChange={(value) => onConfigChange({ ...config, chartType: value as any })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="area" id="area" />
              <Label htmlFor="area" className="font-normal">Area</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="line" id="line" />
              <Label htmlFor="line" className="font-normal">Line</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bar" id="bar" />
              <Label htmlFor="bar" className="font-normal">Bar</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-data-points">Show Data Points</Label>
          <Switch
            id="show-data-points"
            checked={config.showDataPoints}
            onCheckedChange={(checked) => onConfigChange({ ...config, showDataPoints: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-moving-average">Show Moving Average</Label>
          <Switch
            id="show-moving-average"
            checked={config.showMovingAverage}
            onCheckedChange={(checked) => onConfigChange({ ...config, showMovingAverage: checked })}
          />
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
