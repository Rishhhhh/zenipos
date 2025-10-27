import { MoreVertical, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WidgetMenuProps {
  widgetId: string;
  widgetName: string;
  onConfigure: () => void;
  onDelete: () => void;
}

export function WidgetMenu({ widgetId, widgetName, onConfigure, onDelete }: WidgetMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border-border z-[9999]" sideOffset={5}>
        <DropdownMenuItem onClick={onConfigure}>
          <Settings className="h-4 w-4 mr-2" />
          Configure Widget
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Remove Widget
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
