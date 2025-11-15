import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStageDisplay, type FlowStage } from '@/lib/orderFlow/stageCalculator';
import { formatDistanceToNow } from 'date-fns';
import { Clock, MapPin, User, DollarSign } from 'lucide-react';

interface Order {
  id: string;
  status: FlowStage;
  total: number;
  created_at: string;
  table_id?: string | null;
  customer_id?: string | null;
  order_type: string;
  tables?: { label: string } | null;
  customers?: { name: string } | null;
}

interface RealFlowStageCardProps {
  stage: FlowStage;
  orders: Order[];
}

export function RealFlowStageCard({ stage, orders }: RealFlowStageCardProps) {
  const config = getStageDisplay(stage);
  const count = orders.length;

  if (count === 0) return null;

  return (
    <Card className={cn('p-4 border-2 transition-all hover:shadow-md', config.color)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl" title={config.description}>
            {config.icon}
          </span>
          <div>
            <h3 className="font-semibold text-sm">{config.label}</h3>
            <p className="text-xs text-muted-foreground">{count} active</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-lg font-bold">
          {count}
        </Badge>
      </div>

      {/* Order List */}
      <div className="space-y-2">
        {orders.slice(0, 5).map((order) => (
          <div
            key={order.id}
            className="p-2 bg-background/60 rounded-md border border-border/50 hover:bg-background/80 transition-colors animate-in fade-in duration-200"
          >
            {/* Order header */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {order.tables && (
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>{order.tables.label}</span>
                  </div>
                )}
                {order.customers && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{order.customers.name}</span>
                  </div>
                )}
                {!order.tables && !order.customers && (
                  <Badge variant="outline" className="text-xs">
                    {order.order_type}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                <DollarSign className="h-3 w-3" />
                RM {order.total.toFixed(2)}
              </div>
            </div>

            {/* Order footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </span>
              <span className="font-mono text-[10px]">#{order.id.slice(0, 8)}</span>
            </div>
          </div>
        ))}

        {/* Show more indicator */}
        {count > 5 && (
          <div className="text-xs text-muted-foreground text-center py-1 bg-muted/30 rounded">
            +{count - 5} more orders
          </div>
        )}
      </div>
    </Card>
  );
}
