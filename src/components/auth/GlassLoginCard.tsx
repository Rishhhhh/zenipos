import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassLoginCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassLoginCard({ children, className }: GlassLoginCardProps) {
  return (
    <div
      className={cn(
        'glass-card',
        'border border-danger/30',
        'shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_80px_rgba(239,68,68,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]',
        'rounded-3xl',
        // Responsive padding: smaller on mobile, full on desktop
        'p-4 sm:p-6 md:p-8 lg:p-12',
        // Responsive width: prevent overflow on small screens
        'w-full max-w-[95vw] sm:max-w-md',
        'animate-[login-card-enter_0.6s_ease-out]',
        className
      )}
    >
      {children}
    </div>
  );
}
