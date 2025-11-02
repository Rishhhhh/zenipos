import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActiveShiftsConfig } from "@/types/widgetConfigs";

interface ActiveShiftsConfigPanelProps {
  config: ActiveShiftsConfig;
  onConfigChange: (config: ActiveShiftsConfig) => void;
}

export function ActiveShiftsConfigPanel({ config, onConfigChange }: ActiveShiftsConfigPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-photos">Show Employee Photos</Label>
          <Switch
            id="show-photos"
            checked={config.showPhotos}
            onCheckedChange={(checked) => onConfigChange({ ...config, showPhotos: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-roles">Show Job Roles</Label>
          <Switch
            id="show-roles"
            checked={config.showRoles}
            onCheckedChange={(checked) => onConfigChange({ ...config, showRoles: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-labor-cost">Show Labor Cost</Label>
          <Switch
            id="show-labor-cost"
            checked={config.showLaborCost}
            onCheckedChange={(checked) => onConfigChange({ ...config, showLaborCost: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label>Time Format</Label>
          <RadioGroup
            value={config.timeFormat}
            onValueChange={(value) => onConfigChange({ ...config, timeFormat: value as any })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="12hr" id="12hr" />
              <Label htmlFor="12hr" className="font-normal">12-hour (2:30 PM)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="24hr" id="24hr" />
              <Label htmlFor="24hr" className="font-normal">24-hour (14:30)</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>View Mode</Label>
          <RadioGroup
            value={config.viewMode}
            onValueChange={(value) => onConfigChange({ ...config, viewMode: value as any })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="list" id="list" />
              <Label htmlFor="list" className="font-normal">List View (detailed)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="grid" id="grid" />
              <Label htmlFor="grid" className="font-normal">Grid View (compact avatars)</Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">Grid mode: 3×2 avatar layout for small widgets</p>
        </div>

        <div className="space-y-2">
          <Label>Group By</Label>
          <RadioGroup
            value={config.groupBy}
            onValueChange={(value) => onConfigChange({ ...config, groupBy: value as any })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="role" id="role" />
              <Label htmlFor="role" className="font-normal">Role</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="shiftTime" id="shiftTime" />
              <Label htmlFor="shiftTime" className="font-normal">Shift Time</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="alphabetical" id="alphabetical" />
              <Label htmlFor="alphabetical" className="font-normal">Alphabetical</Label>
            </div>
          </RadioGroup>
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
