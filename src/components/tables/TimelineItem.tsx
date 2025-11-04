import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TimelineItemProps {
  icon: React.ReactNode;
  title: string;
  timestamp?: string | null;
  status: 'completed' | 'active' | 'pending';
}

export function TimelineItem({ icon, title, timestamp, status }: TimelineItemProps) {
  return (
    <div className="flex items-start gap-3 pb-4 last:pb-0">
      <div className={`
        flex h-8 w-8 items-center justify-center rounded-full
        ${status === 'completed' ? 'bg-success/20 text-success' : ''}
        ${status === 'active' ? 'bg-primary/20 text-primary' : ''}
        ${status === 'pending' ? 'bg-muted text-muted-foreground' : ''}
      `}>
        {status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
        {status === 'active' && <Clock className="h-4 w-4 animate-pulse" />}
        {status === 'pending' && <Circle className="h-4 w-4" />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        {timestamp ? (
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Pending</p>
        )}
      </div>
    </div>
  );
}
