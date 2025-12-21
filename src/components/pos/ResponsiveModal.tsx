import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

/**
 * ResponsiveModal - Automatically switches between Dialog (desktop) and Sheet (mobile)
 * Mobile: Slides up from bottom for better touch interaction
 * Desktop: Centered dialog modal
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = 'bottom',
  size = 'md',
  className = ''
}: ResponsiveModalProps) {
  const { isMobile } = useDeviceDetection();

  // Size mappings for desktop Dialog
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side={side} 
          className={cn(
            'overflow-y-auto',
            size === 'full' ? 'w-full' : '',
            className
          )}
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <div className="mt-4 pb-20">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          sizeClasses[size],
          'overflow-y-auto max-h-[90vh]',
          className
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="mt-4 pb-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
