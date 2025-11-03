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
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
          <WidgetIcon className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className={cn(
          "text-sm truncate",
          isMinimized ? "font-semibold" : "font-medium"
        )}>{widgetName}</h3>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-1 widget-header">
        {!isMaximized && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 min-h-[44px] min-w-[44px] touch-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigure();
                }}
                data-touch-target
              >
                <Settings className="h-4 w-4" />
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
                className="h-9 w-9 min-h-[44px] min-w-[44px] touch-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimize();
                }}
                data-touch-target
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
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
              className="h-9 w-9 min-h-[44px] min-w-[44px] touch-none"
              onClick={(e) => {
                e.stopPropagation();
                onMaximize();
              }}
              data-touch-target
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Square className="h-4 w-4" />}
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
                className="h-9 w-9 min-h-[44px] min-w-[44px] touch-none hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                data-touch-target
              >
                <X className="h-4 w-4" />
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
