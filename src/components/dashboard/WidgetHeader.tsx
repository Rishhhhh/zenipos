import { Button } from "@/components/ui/button";
import { Minimize2, Maximize2, X, Settings, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetHeaderProps {
  widgetId: string;
  widgetName: string;
  isMinimized: boolean;
  isMaximized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onConfigure: () => void;
}

export function WidgetHeader({
  widgetName,
  isMinimized,
  isMaximized,
  onMinimize,
  onMaximize,
  onClose,
  onConfigure,
}: WidgetHeaderProps) {
  return (
    <div className={cn(
      "absolute top-0 left-0 right-0 h-10 z-50",
      "bg-background/95 backdrop-blur-sm border-b border-border",
      "flex items-center justify-between px-3",
      "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
    )}>
      <h3 className="text-sm font-medium truncate">{widgetName}</h3>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onConfigure();
          }}
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}
        >
          {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
        </Button>
        {!isMinimized && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
          >
            {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
