import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { getWidgetById } from "@/lib/widgets/widgetCatalog";
import { WidgetConfigRouter } from "./WidgetConfigRouter";
import { useState, useEffect } from "react";

interface WidgetConfigModalProps {
  widgetId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WidgetConfigModal({ widgetId, open, onOpenChange }: WidgetConfigModalProps) {
  const { config, saveConfig, resetToDefault } = useWidgetConfig(widgetId || 'sales');
  const [localConfig, setLocalConfig] = useState(config);
  const widgetDef = widgetId ? getWidgetById(widgetId) : null;

  useEffect(() => {
    setLocalConfig(config);
  }, [config, open]);

  const handleSave = () => {
    saveConfig(localConfig);
    // Force a re-render by dispatching a custom event
    window.dispatchEvent(new CustomEvent('widget-config-updated', { detail: { widgetId } }));
    onOpenChange(false);
  };

  const handleReset = () => {
    resetToDefault();
    setLocalConfig(config);
  };

  if (!widgetId || !widgetDef) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure {widgetDef.name}</DialogTitle>
          <DialogDescription>
            Customize how this widget displays and behaves
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <WidgetConfigRouter
            widgetId={widgetId}
            config={localConfig}
            onConfigChange={setLocalConfig}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
