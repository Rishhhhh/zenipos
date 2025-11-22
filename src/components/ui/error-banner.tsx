import { X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorBannerProps {
  error: string | null;
  onDismiss: () => void;
  actionLink?: {
    text: string;
    onClick: () => void;
  };
  severity?: 'error' | 'warning' | 'info';
}

export function ErrorBanner({ error, onDismiss, actionLink, severity = 'error' }: ErrorBannerProps) {
  if (!error) return null;

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 mb-4',
        severity === 'error' && 'bg-danger/10 border-danger/30 text-danger',
        severity === 'warning' && 'bg-warning/10 border-warning/30 text-warning',
        severity === 'info' && 'bg-info/10 border-info/30 text-info'
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium leading-relaxed">{error}</p>
          {actionLink && (
            <button
              onClick={actionLink.onClick}
              className="text-sm underline hover:no-underline font-medium"
            >
              {actionLink.text}
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-md hover:bg-background/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
