import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TopItemsConfig } from "@/types/widgetConfigs";

interface TopItemsConfigPanelProps {
  config: TopItemsConfig;
  onConfigChange: (config: TopItemsConfig) => void;
}

export function TopItemsConfigPanel({ config, onConfigChange }: TopItemsConfigPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Sort By</Label>
          <RadioGroup
            value={config.sortBy}
            onValueChange={(value) => onConfigChange({ ...config, sortBy: value as any })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="quantity" id="quantity" />
              <Label htmlFor="quantity" className="font-normal">Quantity Sold</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="revenue" id="revenue" />
              <Label htmlFor="revenue" className="font-normal">Revenue</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="profit" id="profit" />
              <Label htmlFor="profit" className="font-normal">Profit Margin</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Number of Items to Display</Label>
          <Slider
            value={[config.topN]}
            onValueChange={([value]) => onConfigChange({ ...config, topN: value as 3 | 5 | 10 | 20 })}
            min={3}
            max={20}
            step={1}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">Top {config.topN} items</p>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-images">Show Item Images</Label>
          <Switch
            id="show-images"
            checked={config.showImages}
            onCheckedChange={(checked) => onConfigChange({ ...config, showImages: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-percentages">Show Percentages</Label>
          <Switch
            id="show-percentages"
            checked={config.showPercentages}
            onCheckedChange={(checked) => onConfigChange({ ...config, showPercentages: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-comparison">Show Comparison</Label>
          <Switch
            id="show-comparison"
            checked={config.showComparison}
            onCheckedChange={(checked) => onConfigChange({ ...config, showComparison: checked })}
          />
        </div>
        <p className="text-xs text-muted-foreground">Highlight movers and new entries</p>

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
