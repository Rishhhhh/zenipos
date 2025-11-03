import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PendingModsConfig } from '@/types/widgetConfigs';

interface PendingModsConfigPanelProps {
  config: PendingModsConfig;
  onConfigChange: (config: PendingModsConfig) => void;
}

export function PendingModsConfigPanel({ config, onConfigChange }: PendingModsConfigPanelProps) {
  return (
    <div className="space-y-4">
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
            <SelectItem value="10">10 seconds</SelectItem>
            <SelectItem value="30">30 seconds</SelectItem>
            <SelectItem value="60">1 minute</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="maxItems">Max Items to Display</Label>
        <Select
          value={config.maxItems.toString()}
          onValueChange={(value) =>
            onConfigChange({ ...config, maxItems: parseInt(value) as 3 | 5 | 7 | 10 })
          }
        >
          <SelectTrigger id="maxItems">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 items</SelectItem>
            <SelectItem value="5">5 items (default)</SelectItem>
            <SelectItem value="7">7 items</SelectItem>
            <SelectItem value="10">10 items</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          More items will require scrolling in the widget
        </p>
      </div>

      <div>
        <Label>Sort By</Label>
        <RadioGroup
          value={config.sortBy}
          onValueChange={(value: 'time' | 'wastage') =>
            onConfigChange({ ...config, sortBy: value })
          }
          className="flex flex-col space-y-2 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="time" id="sort-time" />
            <Label htmlFor="sort-time" className="font-normal cursor-pointer">
              Most Recent First
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="wastage" id="sort-wastage" />
            <Label htmlFor="sort-wastage" className="font-normal cursor-pointer">
              Highest Wastage Cost First
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="show-wastage">Show Wastage Cost</Label>
        <Switch
          id="show-wastage"
          checked={config.showWastageCost ?? true}
          onCheckedChange={(checked) => 
            onConfigChange({ ...config, showWastageCost: checked })
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="compact-mode">Compact Mode</Label>
        <Switch
          id="compact-mode"
          checked={config.compactMode ?? false}
          onCheckedChange={(checked) => 
            onConfigChange({ ...config, compactMode: checked })
          }
        />
      </div>
    </div>
  );
}
