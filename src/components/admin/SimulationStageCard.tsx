import { Card } from '@/components/ui/card';
import { SimulatedOrder, OrderStage } from '@/lib/simulation/types';
import { cn } from '@/lib/utils';

interface SimulationStageCardProps {
  stage: OrderStage;
  orders: SimulatedOrder[];
}

const STAGE_CONFIG: Record<OrderStage, { icon: string; label: string; color: string }> = {
  customer_arrival: { icon: '👤', label: 'Arriving', color: 'bg-blue-500/10 border-blue-500/20' },
  order_placement: { icon: '📝', label: 'Ordering', color: 'bg-purple-500/10 border-purple-500/20' },
  kitchen_queue: { icon: '⏳', label: 'Queue', color: 'bg-yellow-500/10 border-yellow-500/20' },
  cooking: { icon: '🍳', label: 'Cooking', color: 'bg-orange-500/10 border-orange-500/20' },
  ready: { icon: '✅', label: 'Ready', color: 'bg-green-500/10 border-green-500/20' },
  serving: { icon: '🍽️', label: 'Serving', color: 'bg-teal-500/10 border-teal-500/20' },
  dining: { icon: '🍔', label: 'Dining', color: 'bg-pink-500/10 border-pink-500/20' },
  drinks: { icon: '🥤', label: 'Drinks', color: 'bg-cyan-500/10 border-cyan-500/20' },
  hand_washing: { icon: '🧼', label: 'Cleaning', color: 'bg-indigo-500/10 border-indigo-500/20' },
  clearing: { icon: '🧹', label: 'Clearing', color: 'bg-gray-500/10 border-gray-500/20' },
  payment: { icon: '💳', label: 'Payment', color: 'bg-emerald-500/10 border-emerald-500/20' },
  invoice: { icon: '🧾', label: 'Invoice', color: 'bg-violet-500/10 border-violet-500/20' },
};

export function SimulationStageCard({ stage, orders }: SimulationStageCardProps) {
  const config = STAGE_CONFIG[stage];
  const count = orders.length;

  if (count === 0) return null;

  return (
    <Card className={cn('p-4 border', config.color)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <span className="font-semibold text-sm">{config.label}</span>
        </div>
        <span className="text-lg font-bold">{count}</span>
      </div>

      <div className="space-y-1">
        {orders.slice(0, 3).map((order) => (
          <div
            key={order.id}
            className="text-xs p-2 bg-background/50 rounded flex items-center gap-2 animate-fade-in"
          >
            <span>{order.customer.avatar}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{order.customer.name}</div>
              <div className="text-muted-foreground truncate">
                {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
              </div>
            </div>
            {order.tableNumber && (
              <span className="text-muted-foreground">T{order.tableNumber}</span>
            )}
          </div>
        ))}
        {count > 3 && (
          <div className="text-xs text-muted-foreground text-center py-1">
            +{count - 3} more
          </div>
        )}
      </div>
    </Card>
  );
}
