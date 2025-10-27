import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { haptics } from "@/lib/haptics";

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

  const handleClick = () => {
    haptics.selection();
    onClick();
  };

  return (
    <Card
      onClick={handleClick}
      className="group relative h-[100px] p-4 hover:shadow-xl transition-all duration-300 cursor-pointer border hover:border-primary overflow-hidden hover:scale-105"
    >
      {/* Icon badge - top right */}
      <div className="absolute -top-2 -right-2 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
        <Icon className="h-5 w-5 text-primary" />
      </div>

      {/* Content */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1 truncate text-foreground">
            {module.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {module.description}
          </p>
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Card>
  );
}
