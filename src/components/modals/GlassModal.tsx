import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface GlassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'drawer' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disableBackdropClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
  onSubmit?: () => void;
  ariaDescribedBy?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl'
};

export function GlassModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  variant = 'default',
  size = 'md',
  disableBackdropClick = false,
  showCloseButton = true,
  className,
  onSubmit,
  ariaDescribedBy
}: GlassModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      // Focus first focusable element
      setTimeout(() => {
        const firstFocusable = contentRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        onOpenChange(false);
      }

      if (e.key === 'Enter' && onSubmit && !['TEXTAREA', 'BUTTON'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        onSubmit();
      }

      // Focus trap
      if (e.key === 'Tab') {
        const focusableElements = contentRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange, onSubmit]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !disableBackdropClick) {
      onOpenChange(false);
    }
  };

  const isDrawer = variant === 'drawer' || (variant === 'default' && window.innerWidth < 768);
  const isFullscreen = variant === 'fullscreen';

  return (
    <div
      className="glass-modal-backdrop glass-backdrop fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="glass-modal-title"
        aria-describedby={description || ariaDescribedBy ? "glass-modal-description" : undefined}
        className={cn(
          'glass-modal-content glass-card relative w-full shadow-2xl',
          'animate-scale-in',
          {
            // Default variant - centered modal
            'rounded-xl mx-4': variant === 'default' && !isDrawer,
            [sizeClasses[size]]: variant === 'default' && !isDrawer,
            
            // Drawer variant - slide from bottom on mobile
            'fixed bottom-0 left-0 right-0 rounded-t-2xl max-h-[90vh] animate-slide-in-bottom': isDrawer,
            
            // Fullscreen variant
            'h-screen w-screen rounded-none': isFullscreen
          },
          className
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-start justify-between border-b border-border/50 bg-background/50",
          isDrawer ? "p-4" : "p-6"
        )}>
          <div className="flex-1">
            <h2
              id="glass-modal-title"
              className="text-xl font-semibold text-foreground"
            >
              {title}
            </h2>
            {description && (
              <p
                id="glass-modal-description"
                className="mt-1 text-sm text-muted-foreground"
              >
                {description}
              </p>
            )}
            {!description && ariaDescribedBy && (
              <span id="glass-modal-description" className="sr-only">
                {ariaDescribedBy}
              </span>
            )}
          </div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-4 h-8 w-8 shrink-0"
              onClick={() => onOpenChange(false)}
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className={cn(
          "overflow-y-auto",
          isDrawer ? "max-h-[calc(90vh-8rem)] p-4" : "max-h-[calc(100vh-12rem)] p-6"
        )}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={cn(
            "flex items-center justify-end gap-3 border-t border-border/50 bg-background/50",
            isDrawer ? "p-4" : "p-6"
          )}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
