import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LowStockConfig } from "@/types/widgetConfigs";

interface LowStockConfigPanelProps {
  config: LowStockConfig;
  onConfigChange: (config: LowStockConfig) => void;
}

export function LowStockConfigPanel({ config, onConfigChange }: LowStockConfigPanelProps) {
  // Provide defaults for nested properties that might not exist in old configs
  const alertThreshold = config.alertThreshold || { critical: 10, low: 30 };
  const sortBy = config.sortBy || 'stockLevel';
  const showSupplier = config.showSupplier ?? true;
  const autoReorder = config.autoReorder ?? false;
  const refreshInterval = config.refreshInterval || 30;
  const compactMode = config.compactMode ?? false;
  const maxItems = config.maxItems || 3;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Alert Thresholds</Label>
          <div className="space-y-3 pl-2">
            <div className="space-y-1">
              <Label htmlFor="critical-threshold" className="text-sm text-destructive">Critical Level (%)</Label>
              <Input
                id="critical-threshold"
                type="number"
                value={alertThreshold.critical}
                onChange={(e) => onConfigChange({ 
                  ...config, 
                  alertThreshold: { ...alertThreshold, critical: parseFloat(e.target.value) || 10 }
                })}
                placeholder="10"
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="low-threshold" className="text-sm text-warning">Low Level (%)</Label>
              <Input
                id="low-threshold"
                type="number"
                value={alertThreshold.low}
                onChange={(e) => onConfigChange({ 
                  ...config, 
                  alertThreshold: { ...alertThreshold, low: parseFloat(e.target.value) || 30 }
                })}
                placeholder="30"
                min={0}
                max={100}
              />
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
              <RadioGroupItem value="stockLevel" id="stockLevel" />
              <Label htmlFor="stockLevel" className="font-normal">Stock Level</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="alphabetical" id="alphabetical" />
              <Label htmlFor="alphabetical" className="font-normal">Alphabetical</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lastUpdated" id="lastUpdated" />
              <Label htmlFor="lastUpdated" className="font-normal">Last Updated</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-supplier">Show Supplier</Label>
          <Switch
            id="show-supplier"
            checked={showSupplier}
            onCheckedChange={(checked) => onConfigChange({ ...config, showSupplier: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="auto-reorder">Auto-Reorder</Label>
          <Switch
            id="auto-reorder"
            checked={autoReorder}
            onCheckedChange={(checked) => onConfigChange({ ...config, autoReorder: checked })}
          />
        </div>
        <p className="text-xs text-muted-foreground">Show "Create PO" button for critical items</p>

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

        <div className="space-y-2">
          <Label>Max Items to Display</Label>
          <Select
            value={maxItems.toString()}
            onValueChange={(value) => onConfigChange({ ...config, maxItems: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 items</SelectItem>
              <SelectItem value="5">5 items</SelectItem>
              <SelectItem value="8">8 items</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
