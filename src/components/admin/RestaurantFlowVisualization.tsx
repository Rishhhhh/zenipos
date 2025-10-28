import { SimulatedOrder, OrderStage } from '@/lib/simulation/types';
import { SimulationStageCard } from './SimulationStageCard';
import { ArrowRight } from 'lucide-react';

interface RestaurantFlowVisualizationProps {
  orders: SimulatedOrder[];
}

const FLOW_STAGES: OrderStage[] = [
  'customer_arrival',
  'order_placement',
  'kitchen_queue',
  'cooking',
  'ready',
  'serving',
  'dining',
  'drinks',
  'hand_washing',
  'clearing',
  'payment',
  'invoice',
];

export function RestaurantFlowVisualization({ orders }: RestaurantFlowVisualizationProps) {
  const ordersByStage = FLOW_STAGES.reduce((acc, stage) => {
    acc[stage] = orders.filter(order => order.stage === stage);
    return acc;
  }, {} as Record<OrderStage, SimulatedOrder[]>);

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {FLOW_STAGES.map((stage, index) => {
          const stageOrders = ordersByStage[stage];
          const hasOrders = stageOrders.length > 0;

          return (
            <div key={stage} className="relative">
              <SimulationStageCard stage={stage} orders={stageOrders} />
              
              {/* Arrow connector */}
              {hasOrders && index < FLOW_STAGES.length - 1 && (
                <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="h-6 w-6 text-primary/30 animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">🎬 No active orders</p>
          <p className="text-sm">Start the simulation to see live restaurant flow</p>
        </div>
      )}
    </div>
  );
}
