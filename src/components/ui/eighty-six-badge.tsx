import { AlertTriangle } from 'lucide-react';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

interface EightySixBadgeProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export function EightySixBadge({ 
  size = 'default', 
  className,
  showIcon = true 
}: EightySixBadgeProps) {
  return (
    <Badge 
      variant="destructive" 
      className={cn(
        'font-bold uppercase',
        size === 'sm' && 'text-xs px-1.5 py-0.5',
        size === 'lg' && 'text-base px-3 py-1',
        className
      )}
    >
      {showIcon && <AlertTriangle className="h-3 w-3 mr-1" />}
      86
    </Badge>
  );
}
