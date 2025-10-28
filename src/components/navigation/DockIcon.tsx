import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DockIconProps {
  icon: LucideIcon;
  label: string;
  shortcut: string;
  isActive?: boolean;
  onClick: () => void;
}

export function DockIcon({ icon: Icon, label, shortcut, isActive, onClick }: DockIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onClick();
    setTimeout(() => setIsClicked(false), 400);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              'dock-icon relative flex items-center justify-center',
              'w-14 h-14 rounded-2xl transition-all duration-300',
              'hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-primary focus-visible:ring-offset-2',
              isClicked && 'animate-dock-bounce'
            )}
            style={{
              transform: isHovered 
                ? 'scale(1.5) translateY(-8px)' 
                : 'scale(1) translateY(0)',
              transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            aria-label={`${label} (${shortcut})`}
          >
            <Icon className={cn(
              "w-6 h-6 transition-colors duration-200",
              isActive ? "text-primary" : "text-foreground"
            )} />
            
            {/* Active indicator - enhanced gold glow */}
            {isActive && (
              <div 
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-md shadow-primary/50"
                aria-label="Active"
              />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="glass-card border-border/50"
          sideOffset={12}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{label}</span>
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">
              {shortcut}
            </kbd>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
