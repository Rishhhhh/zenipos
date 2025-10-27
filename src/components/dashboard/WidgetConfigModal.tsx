import { BarChart3, Table, LayoutGrid, Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { getWidgetById } from "@/lib/widgets/widgetCatalog";
import { getThemeColors } from "@/lib/themes/widgetColors";
import { useTheme } from "next-themes";

interface WidgetConfigModalProps {
  widgetId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WidgetConfigModal({ widgetId, open, onOpenChange }: WidgetConfigModalProps) {
  if (!widgetId) return null;

  const widgetDef = getWidgetById(widgetId);
  const { config, saveConfig, resetToDefault } = useWidgetConfig(widgetId);
  const { theme } = useTheme();

  if (!widgetDef) return null;

  const themeColors = getThemeColors(theme || 'cosmic-modern');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Configure {widgetDef.name}</DialogTitle>
          <DialogDescription>
            Customize how this widget displays data
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="display">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="display" className="space-y-4 mt-4">
            {/* Visualization Type */}
            <div className="space-y-2">
              <Label>Visualization Style</Label>
              <Select 
                value={config.displayType} 
                onValueChange={(v) => saveConfig({ ...config, displayType: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="chart">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>Chart (recommended for finance data)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="table">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4" />
                      <span>Table (recommended for items/names)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cards">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      <span>Cards (visual tiles)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="gauge">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span>Gauge (KPI meter)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Compact Mode */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <p className="text-xs text-muted-foreground">Dense data-rich view with less spacing</p>
              </div>
              <Switch 
                checked={config.compactMode}
                onCheckedChange={(v) => saveConfig({ ...config, compactMode: v })}
              />
            </div>
            
            {/* Color Preview */}
            <div className="space-y-2">
              <Label>Color Scheme (auto-matched to theme)</Label>
              <div className="flex gap-2 mt-2">
                {themeColors.slice(0, 5).map((color, i) => (
                  <div 
                    key={i}
                    className="h-8 w-8 rounded-md border border-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Colors automatically adapt to your selected theme
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select 
                value={config.dataFilters.dateRange || 'today'} 
                onValueChange={(v) => saveConfig({ 
                  ...config, 
                  dataFilters: { ...config.dataFilters, dateRange: v as any }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="today">Today Only</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Auto-Refresh Interval</Label>
              <Select 
                value={config.refreshInterval.toString()} 
                onValueChange={(v) => saveConfig({ ...config, refreshInterval: parseInt(v) as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="5">5 seconds (real-time)</SelectItem>
                  <SelectItem value="30">30 seconds (balanced)</SelectItem>
                  <SelectItem value="60">1 minute (performance)</SelectItem>
                  <SelectItem value="300">5 minutes (manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={resetToDefault}>
            Reset to Default
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
