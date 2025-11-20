import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ReactNode } from 'react';

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
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
  className = ''
}: ResponsiveModalProps) {
  const { isMobile } = useDeviceDetection();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side={side} className={`overflow-y-auto ${className}`}>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <div className="mt-4">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-2xl overflow-y-auto max-h-[90vh] ${className}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="mt-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
