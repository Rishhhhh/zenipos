import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Minimize2, Maximize2, X, Settings, LayoutDashboard, MoreVertical, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getWidgetById } from "@/lib/widgets/widgetCatalog";

interface WidgetHeaderProps {
  widgetId: string;
  widgetName: string;
  isMinimized: boolean;
  onMinimize: () => void;
  onNavigateToModule: () => void;
  onClose: () => void;
  onConfigure: () => void;
}

export function WidgetHeader({
  widgetId,
  widgetName,
  isMinimized,
  onMinimize,
  onNavigateToModule,
  onClose,
  onConfigure,
}: WidgetHeaderProps) {
  // Get widget icon from catalog
  const widgetDefinition = getWidgetById(widgetId);
  const WidgetIcon = widgetDefinition?.icon || LayoutDashboard;

  return (
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
      
      {/* Action Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 min-h-[44px] min-w-[44px] touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            onConfigure();
          }}>
            <Settings className="mr-2 h-4 w-4" />
            Configure Widget
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}>
            {isMinimized ? <Maximize2 className="mr-2 h-4 w-4" /> : <Minimize2 className="mr-2 h-4 w-4" />}
            {isMinimized ? "Restore" : "Minimize"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            onNavigateToModule();
          }}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in Full View
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-destructive focus:text-destructive"
          >
            <X className="mr-2 h-4 w-4" />
            Remove Widget
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
