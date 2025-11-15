import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/lib/realtime/RealtimeService';
import { RealFlowStageCard } from './RealFlowStageCard';
import { getFlowStageOrder, isActiveStage, type FlowStage } from '@/lib/orderFlow/stageCalculator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LiveRestaurantFlow() {
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['live-restaurant-flow'],
    queryFn: async () => {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total,
          created_at,
          table_id,
          customer_id,
          order_type,
          metadata,
          tables(label),
          customers(name)
        `)
        .not('status', 'eq', 'cancelled')  // Exclude cancelled
        .is('metadata->simulated', null)    // Exclude simulated orders
        .gte('created_at', fourHoursAgo)    // Last 4 hours
        .order('created_at', { ascending: false })
        .limit(100);                        // Max 100 orders

      if (error) throw error;

      console.log(`✅ Fetched ${data?.length || 0} real orders for flow visualization`);
      return data || [];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Subscribe to real-time updates
  useRealtimeTable('orders', (payload) => {
    console.log('🔄 Order update received:', payload.eventType);
    queryClient.invalidateQueries({ queryKey: ['live-restaurant-flow'] });
  });

  // Group orders by stage
  const ordersByStage = orders?.reduce((acc, order) => {
    const stage = order.status as FlowStage;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(order);
    return acc;
  }, {} as Record<FlowStage, typeof orders>);

  // Get only active stages in the correct order
  const flowStages = getFlowStageOrder();

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {flowStages.map((stage) => (
          <Skeleton key={stage} className="h-48" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load restaurant flow: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate stats
  const totalActiveOrders = orders?.filter(o => isActiveStage(o.status as FlowStage)).length || 0;
  const lastUpdate = new Date(dataUpdatedAt).toLocaleTimeString();

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary animate-pulse" />
          <div>
            <h3 className="text-xl font-bold">🎬 Live Restaurant Flow</h3>
            <p className="text-sm text-muted-foreground">
              Real-time order tracking from cart to completion • {totalActiveOrders} active orders • Last update: {lastUpdate}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Flow visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {flowStages.map((stage) => {
          const stageOrders = ordersByStage?.[stage] || [];
          return (
            <RealFlowStageCard
              key={stage}
              stage={stage}
              orders={stageOrders}
            />
          );
        })}
      </div>

      {/* Empty state */}
      {totalActiveOrders === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">🍽️ No active orders</p>
          <p className="text-sm">
            Orders will appear here in real-time as they flow through the system
          </p>
        </div>
      )}

      {/* Debug info (only in development) */}
      {import.meta.env.DEV && orders && (
        <details className="mt-4">
          <summary className="text-xs text-muted-foreground cursor-pointer">
            Debug: Show all statuses ({orders.length} total orders)
          </summary>
          <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
            {JSON.stringify(
              Object.entries(ordersByStage || {}).map(([status, orders]) => ({
                status,
                count: orders.length,
              })),
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}
