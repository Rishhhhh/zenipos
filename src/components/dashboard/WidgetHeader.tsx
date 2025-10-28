import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Minimize2, Maximize2, X, Settings, LayoutDashboard, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWidgetById } from "@/lib/widgets/widgetCatalog";

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
  widgetId,
  widgetName,
  isMinimized,
  isMaximized,
  onMinimize,
  onMaximize,
  onClose,
  onConfigure,
}: WidgetHeaderProps) {
  // Get widget icon from catalog
  const widgetDefinition = getWidgetById(widgetId);
  const WidgetIcon = widgetDefinition?.icon || LayoutDashboard;

  return (
    <TooltipProvider>
      <div className={cn(
      "absolute top-0 left-0 right-0 h-10 z-50",
      "bg-background/95 backdrop-blur-sm border-b border-border",
      "flex items-center justify-between px-3",
      isMinimized 
        ? "opacity-100" 
        : "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
    )}>
      {isMinimized && (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <WidgetIcon className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold">{widgetName}</h3>
        </div>
      )}
      {!isMinimized && <h3 className="text-sm font-medium truncate">{widgetName}</h3>}
      
      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {!isMaximized && (
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent>Configure</TooltipContent>
          </Tooltip>
        )}

        {!isMaximized && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimize();
                }}
              >
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isMinimized ? "Restore" : "Minimize"}
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onMaximize();
              }}
            >
              {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isMaximized ? "Restore" : "Maximize"}
          </TooltipContent>
        </Tooltip>

        {!isMaximized && (
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
