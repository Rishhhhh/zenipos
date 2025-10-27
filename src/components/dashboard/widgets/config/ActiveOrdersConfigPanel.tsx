import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActiveOrdersConfig } from "@/types/widgetConfigs";

interface ActiveOrdersConfigPanelProps {
  config: ActiveOrdersConfig;
  onConfigChange: (config: ActiveOrdersConfig) => void;
}

export function ActiveOrdersConfigPanel({ config, onConfigChange }: ActiveOrdersConfigPanelProps) {
  // Provide defaults for nested properties
  const statusFilters = config.statusFilters || ['pending', 'preparing', 'ready'];
  const sortBy = config.sortBy || 'orderTime';
  const showTimer = config.showTimer ?? true;
  const alertThresholdMinutes = config.alertThresholdMinutes || 15;
  const viewMode = config.viewMode || 'list';
  const refreshInterval = config.refreshInterval || 30;
  const compactMode = config.compactMode ?? false;

  const handleStatusFilterChange = (status: 'pending' | 'preparing' | 'ready', checked: boolean) => {
    const newFilters = checked
      ? [...statusFilters, status]
      : statusFilters.filter(s => s !== status);
    onConfigChange({ ...config, statusFilters: newFilters as any });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Status Filters</Label>
          <div className="space-y-2 pl-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pending"
                checked={statusFilters.includes('pending')}
                onCheckedChange={(checked) => handleStatusFilterChange('pending', checked as boolean)}
              />
              <Label htmlFor="pending" className="font-normal">Pending</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="preparing"
                checked={statusFilters.includes('preparing')}
                onCheckedChange={(checked) => handleStatusFilterChange('preparing', checked as boolean)}
              />
              <Label htmlFor="preparing" className="font-normal">Preparing</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ready"
                checked={statusFilters.includes('ready')}
                onCheckedChange={(checked) => handleStatusFilterChange('ready', checked as boolean)}
              />
              <Label htmlFor="ready" className="font-normal">Ready</Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Sort By</Label>
          <RadioGroup
            value={sortBy}
            onValueChange={(value) => onConfigChange({ ...config, sortBy: value as any })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="orderTime" id="orderTime" />
              <Label htmlFor="orderTime" className="font-normal">Order Time</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tableNumber" id="tableNumber" />
              <Label htmlFor="tableNumber" className="font-normal">Table Number</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="priority" id="priority" />
              <Label htmlFor="priority" className="font-normal">Priority</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-timer">Show Timer</Label>
          <Switch
            id="show-timer"
            checked={showTimer}
            onCheckedChange={(checked) => onConfigChange({ ...config, showTimer: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="alert-threshold">Alert Threshold (minutes)</Label>
          <Input
            id="alert-threshold"
            type="number"
            value={alertThresholdMinutes}
            onChange={(e) => onConfigChange({ ...config, alertThresholdMinutes: parseInt(e.target.value) || 15 })}
            placeholder="15"
            min={1}
          />
          <p className="text-xs text-muted-foreground">Highlight orders older than this duration</p>
        </div>

        <div className="space-y-2">
          <Label>View Mode</Label>
          <RadioGroup
            value={viewMode}
            onValueChange={(value) => onConfigChange({ ...config, viewMode: value as any })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="list" id="list" />
              <Label htmlFor="list" className="font-normal">List</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="kanban" id="kanban" />
              <Label htmlFor="kanban" className="font-normal">Kanban Board</Label>
            </div>
          </RadioGroup>
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
