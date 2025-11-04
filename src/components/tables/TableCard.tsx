import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TableCardProps {
  table: any;
  onClick: () => void;
}

export function TableCard({ table, onClick }: TableCardProps) {
  const getTableState = () => {
    if (!table.current_order) {
      return {
        label: 'Available',
        color: 'bg-success/10 border-success text-success',
        pulse: false,
      };
    }

    const order = table.current_order;
    
    if (order.status === 'delivered') {
      return {
        label: 'Ready to Pay',
        color: 'bg-primary/10 border-primary text-primary',
        pulse: true,
      };
    }

    if (order.status === 'preparing') {
      return {
        label: 'Preparing',
        color: 'bg-warning/10 border-warning text-warning',
        pulse: false,
      };
    }

    return {
      label: 'Occupied',
      color: 'bg-muted border-border text-foreground',
      pulse: false,
    };
  };

  const state = getTableState();
  const order = table.current_order;

  return (
    <Card
      onClick={onClick}
      className={`
        relative cursor-pointer transition-all hover:shadow-lg
        ${state.color}
        ${state.pulse ? 'animate-pulse' : ''}
        border-2 p-4
      `}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{table.label}</h3>
          <Badge variant="secondary" className={state.color}>
            {state.label}
          </Badge>
        </div>

        {order && (
          <>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </div>
            <div className="text-sm font-semibold">
              RM {order.total.toFixed(2)}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
