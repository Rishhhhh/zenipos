import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoyaltyStatsConfig } from "@/types/widgetConfigs";

interface LoyaltyStatsConfigPanelProps {
  config: LoyaltyStatsConfig;
  onConfigChange: (config: LoyaltyStatsConfig) => void;
}

export function LoyaltyStatsConfigPanel({ config, onConfigChange }: LoyaltyStatsConfigPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-tier-progress">Show Tier Progress</Label>
          <Switch
            id="show-tier-progress"
            checked={config.showTierProgress}
            onCheckedChange={(checked) => onConfigChange({ ...config, showTierProgress: checked })}
          />
        </div>
        <p className="text-xs text-muted-foreground">Display loyalty tiers (Bronze, Silver, Gold)</p>

        <div className="space-y-2">
          <Label>Number of Top Customers</Label>
          <Slider
            value={[config.topNCustomers]}
            onValueChange={([value]) => onConfigChange({ ...config, topNCustomers: value as 3 | 5 | 10 })}
            min={3}
            max={10}
            step={1}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">Top {config.topNCustomers} customers</p>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-customer-photos">Show Customer Photos</Label>
          <Switch
            id="show-customer-photos"
            checked={config.showCustomerPhotos}
            onCheckedChange={(checked) => onConfigChange({ ...config, showCustomerPhotos: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-points-conversion">Show Points Conversion</Label>
          <Switch
            id="show-points-conversion"
            checked={config.showPointsConversion}
            onCheckedChange={(checked) => onConfigChange({ ...config, showPointsConversion: checked })}
          />
        </div>
        <p className="text-xs text-muted-foreground">Display cash equivalent of points</p>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-redemption-rate">Show Redemption Rate</Label>
          <Switch
            id="show-redemption-rate"
            checked={config.showRedemptionRate}
            onCheckedChange={(checked) => onConfigChange({ ...config, showRedemptionRate: checked })}
          />
        </div>
        <p className="text-xs text-muted-foreground">Points earned vs redeemed ratio</p>

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
