import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { cn } from '@/lib/utils';

interface CompactModuleCardProps {
  module: {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    path: string;
  };
  onClick: () => void;
}

export function CompactModuleCard({ module, onClick }: CompactModuleCardProps) {
  const Icon = module.icon;
  const { isMobile } = useDeviceDetection();

  const handleClick = () => {
    haptics.selection();
    onClick();
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        "group relative p-3 hover:shadow-xl transition-all duration-300 cursor-pointer border hover:border-primary overflow-hidden hover:scale-105",
        isMobile ? "h-[80px]" : "h-[100px] p-4"
      )}
    >
      {/* Icon badge - top right */}
      {!isMobile && (
        <div className="absolute -top-2 -right-2 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      )}

      {/* Content */}
      <div className="flex items-start gap-2">
        <div className={cn("bg-primary/10 rounded-lg shrink-0", isMobile ? "p-1.5" : "p-2")}>
          <Icon className={cn("text-primary", isMobile ? "h-4 w-4" : "h-5 w-5")} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold mb-1 truncate text-foreground", isMobile ? "text-xs" : "text-sm")}>
            {module.name}
          </h3>
          {!isMobile && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {module.description}
            </p>
          )}
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Card>
  );
}
