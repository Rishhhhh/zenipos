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
                value={config.alertThreshold.critical}
                onChange={(e) => onConfigChange({ 
                  ...config, 
                  alertThreshold: { ...config.alertThreshold, critical: parseFloat(e.target.value) || 10 }
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
                value={config.alertThreshold.low}
                onChange={(e) => onConfigChange({ 
                  ...config, 
                  alertThreshold: { ...config.alertThreshold, low: parseFloat(e.target.value) || 30 }
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
            value={config.sortBy}
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
            checked={config.showSupplier}
            onCheckedChange={(checked) => onConfigChange({ ...config, showSupplier: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="auto-reorder">Auto-Reorder</Label>
          <Switch
            id="auto-reorder"
            checked={config.autoReorder}
            onCheckedChange={(checked) => onConfigChange({ ...config, autoReorder: checked })}
          />
        </div>
        <p className="text-xs text-muted-foreground">Show "Create PO" button for critical items</p>

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
