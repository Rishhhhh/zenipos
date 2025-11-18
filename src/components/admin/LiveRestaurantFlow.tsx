import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/lib/realtime/RealtimeService';
import { RealFlowStageCard } from './RealFlowStageCard';
import { getFlowStageOrder, isActiveStage, type FlowStage } from '@/lib/orderFlow/stageCalculator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Activity, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function LiveRestaurantFlow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);

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
          tables!orders_table_id_fkey(label),
          customers(name)
        `)
        .not('status', 'eq', 'cancelled')  // Exclude cancelled
        .is('metadata->simulated', null)    // Exclude simulated orders
        .gte('created_at', fourHoursAgo)    // Last 4 hours
        .order('created_at', { ascending: false })
        .limit(100);                        // Max 100 orders

      if (error) throw error;

      // Transform tables array to single object (due to explicit FK syntax)
      const normalizedData = data?.map(order => ({
        ...order,
        tables: Array.isArray(order.tables) && order.tables.length > 0 
          ? order.tables[0] 
          : null
      })) || [];

      console.log(`✅ Fetched ${normalizedData.length} real orders for flow visualization`);
      return normalizedData;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Subscribe to real-time updates
  useRealtimeTable('orders', (payload) => {
    console.log('🔄 Order update received:', payload.eventType);
    queryClient.invalidateQueries({ queryKey: ['live-restaurant-flow'] });
  });

  // Cleanup simulated orders
  const handleCleanupSimulated = async () => {
    setIsClearing(true);
    try {
      const { data, error } = await supabase.rpc('cleanup_simulated_orders' as any);
      
      if (error) throw error;
      
      const result = Array.isArray(data) ? data[0] : data;
      toast({
        title: '🧹 Cleanup Complete',
        description: `Removed ${result?.deleted_orders || 0} simulated orders, ${result?.deleted_items || 0} items, ${result?.deleted_payments || 0} payments in ${result?.execution_time_ms || 0}ms`,
      });
      
      // Refresh the flow
      refetch();
    } catch (error) {
      toast({
        title: 'Cleanup Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          {/* Cleanup button - only show in dev or if simulated data exists */}
          {(import.meta.env.DEV || orders?.some(o => (o.metadata as any)?.simulated)) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                  disabled={isClearing}
                >
                  <Trash2 className="h-4 w-4" />
                  {isClearing ? 'Cleaning...' : 'Clean Simulated'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Simulated Orders?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all orders marked as simulated (metadata.simulated = true).
                    This action cannot be undone. Real orders will not be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCleanupSimulated}>
                    Yes, Remove Simulated Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
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
