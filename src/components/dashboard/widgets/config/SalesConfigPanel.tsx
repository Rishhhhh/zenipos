import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SalesWidgetConfig } from "@/types/widgetConfigs";

interface SalesConfigPanelProps {
  config: SalesWidgetConfig;
  onConfigChange: (config: SalesWidgetConfig) => void;
}

export function SalesConfigPanel({ config, onConfigChange }: SalesConfigPanelProps) {
  // Provide defaults for nested properties
  const goalTracking = config.goalTracking || { enabled: false, dailyTarget: 0 };
  const comparisonPeriod = config.comparisonPeriod || 'yesterday';
  const showSparklines = config.showSparklines ?? true;
  const showTrends = config.showTrends ?? true;
  const showTrendFooter = config.showTrendFooter ?? true;
  const refreshInterval = config.refreshInterval || 30;
  const compactMode = config.compactMode ?? false;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Comparison Period</Label>
          <RadioGroup
            value={comparisonPeriod}
            onValueChange={(value) => onConfigChange({ ...config, comparisonPeriod: value as any })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yesterday" id="yesterday" />
              <Label htmlFor="yesterday" className="font-normal">vs Yesterday</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lastWeek" id="lastWeek" />
              <Label htmlFor="lastWeek" className="font-normal">vs Last Week</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lastMonth" id="lastMonth" />
              <Label htmlFor="lastMonth" className="font-normal">vs Last Month</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="goal-tracking">Goal Tracking</Label>
            <Switch
              id="goal-tracking"
              checked={goalTracking.enabled}
              onCheckedChange={(checked) => onConfigChange({ 
                ...config, 
                goalTracking: { ...goalTracking, enabled: checked }
              })}
            />
          </div>
          {goalTracking.enabled && (
            <div className="space-y-2 pl-6">
              <Label htmlFor="daily-target">Daily Revenue Target</Label>
              <Input
                id="daily-target"
                type="number"
                value={goalTracking.dailyTarget}
                onChange={(e) => onConfigChange({ 
                  ...config, 
                  goalTracking: { ...goalTracking, dailyTarget: parseFloat(e.target.value) || 0 }
                })}
                placeholder="0.00"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-sparklines">Show Sparklines</Label>
          <Switch
            id="show-sparklines"
            checked={showSparklines}
            onCheckedChange={(checked) => onConfigChange({ ...config, showSparklines: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-trends">Show Trends</Label>
          <Switch
            id="show-trends"
            checked={showTrends}
            onCheckedChange={(checked) => onConfigChange({ ...config, showTrends: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-trend-footer">Show Trend Footer</Label>
          <Switch
            id="show-trend-footer"
            checked={showTrendFooter}
            onCheckedChange={(checked) => onConfigChange({ ...config, showTrendFooter: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label>Refresh Interval</Label>
          <Select
            value={refreshInterval.toString()}
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
            checked={compactMode}
            onCheckedChange={(checked) => onConfigChange({ ...config, compactMode: checked })}
          />
        </div>
      </div>
    </div>
  );
}
