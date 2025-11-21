import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Minimize2, Maximize2, Settings, MoreVertical, ExternalLink, RefreshCw } from "lucide-react";
import { useWidgetRefresh } from "@/contexts/WidgetRefreshContext";

interface WidgetHeaderProps {
  widgetId: string;
  widgetName: string;
  isMinimized: boolean;
  onMinimize: () => void;
  onNavigateToModule: () => void;
  onConfigure: () => void;
}

export function WidgetHeader({
  widgetId,
  widgetName,
  isMinimized,
  onMinimize,
  onNavigateToModule,
  onConfigure,
}: WidgetHeaderProps) {
  const { triggerRefresh, hasRefresh } = useWidgetRefresh();

  return (
    <div className="absolute top-1.5 right-1.5 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 min-h-[32px] min-w-[32px] rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/95 hover:border-primary/50 transition-all shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {hasRefresh && (
            <>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                triggerRefresh();
              }}>
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Refresh Data
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            onConfigure();
          }}>
            <Settings className="mr-2 h-3.5 w-3.5" />
            Configure Widget
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}>
            {isMinimized ? <Maximize2 className="mr-2 h-3.5 w-3.5" /> : <Minimize2 className="mr-2 h-3.5 w-3.5" />}
            {isMinimized ? "Restore" : "Minimize"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            onNavigateToModule();
          }}>
          <ExternalLink className="mr-2 h-3.5 w-3.5" />
          Open in Full View
        </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
