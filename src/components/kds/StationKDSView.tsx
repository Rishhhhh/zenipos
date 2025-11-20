import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Clock, ChefHat, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeTable } from '@/lib/realtime/RealtimeService';
import { trackPerformance } from '@/lib/monitoring/sentry';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { getGridClasses, getGapClasses } from '@/lib/utils/responsiveGrid';
import { cn } from '@/lib/utils';

interface StationKDSViewProps {
  stationId: string;
  stationName: string;
}

export function StationKDSView({ stationId, stationName }: StationKDSViewProps) {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(new Date());
  
  // Device detection for responsive layouts
  const { device, isMobile, orientation } = useDeviceDetection();
  const itemGridClass = getGridClasses('kdsOrders', device);
  const itemGapClass = getGapClasses(device);
  
  // Portrait tablet specific: prefer vertical stacking
  const isPortraitTablet = device === 'portrait-tablet' || 
    (device === 'landscape-tablet' && orientation === 'portrait');

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { 
    data: stationItems = [], 
    error: stationError,
    isError: stationIsError,
    isLoading: stationLoading 
  } = useQuery({
    queryKey: ['station-items', stationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          order:orders!inner(
            id,
            table_id,
            order_type,
            created_at,
            table:tables!fk_orders_table(label),
            priority:order_priorities(priority_level, reason)
          ),
          menu_item:menu_items(name, description)
        `)
        .eq('station_id', stationId)
        .in('status', ['kitchen_queue', 'pending', 'preparing'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[StationKDS] order_items query error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          stationId
        });
        throw error;
      }

      console.log(`[StationKDS] Loaded ${data?.length || 0} items for station ${stationId}`);
      
      // Transform table array to single object (due to explicit FK syntax)
      const normalizedData = data?.map(item => ({
        ...item,
        order: item.order ? {
          ...item.order,
          table: Array.isArray(item.order.table) && item.order.table.length > 0
            ? item.order.table[0]
            : null
        } : null
      }));
      
      return normalizedData;
    },
    refetchInterval: 3000, // Refresh every 3s
  });

  // Real-time subscription using unified service with latency tracking
  useRealtimeTable(
    'order_items',
    (payload) => {
      queryClient.invalidateQueries({ queryKey: ['station-items', stationId] });
      
      // Track KDS update latency
      if (payload.eventType === 'INSERT' && payload.new) {
        const itemCreatedAt = new Date((payload.new as any).created_at).getTime();
        const receivedAt = Date.now();
        const latency = receivedAt - itemCreatedAt;
        
        // Only track if item is fresh (< 10 seconds old)
        if (latency < 10000) {
          trackPerformance('kds_update', latency, {
            page: 'StationKDS',
            station_id: stationId,
            order_item_id: (payload.new as any).id,
          });
        }
      }
    },
    { filter: `station_id=eq.${stationId}` }
  );

  const startItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('order_items')
        .update({
          status: 'preparing',
          started_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;

      // Log status change
      await supabase.from('kds_item_status').insert({
        order_item_id: itemId,
        station_id: stationId,
        status: 'preparing',
        started_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['station-items', stationId] });
      toast.success('Item started');
    },
  });

  const completeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // First, get the item's order_id
      const { data: item } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('id', itemId)
        .single();

      if (!item) throw new Error('Item not found');

      // Update this item to ready
      const { error } = await supabase
        .from('order_items')
        .update({
          status: 'ready',
          ready_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;

      // Log item status change
      await supabase.from('kds_item_status').insert({
        order_item_id: itemId,
        station_id: stationId,
        status: 'ready',
        completed_at: new Date().toISOString(),
      });

      // Check if ALL items in this order are now ready
      const { data: allOrderItems } = await supabase
        .from('order_items')
        .select('id, status')
        .eq('order_id', item.order_id);

      const allReady = allOrderItems?.every(i => i.status === 'ready');

      if (allReady) {
        // Update ORDER status to ready
        await supabase
          .from('orders')
          .update({ 
            status: 'ready',
            ready_at: new Date().toISOString()
          })
          .eq('id', item.order_id);

        // Log order status change
        await supabase.from('audit_log').insert({
          actor: null,
          action: 'kds_order_ready',
          entity: 'orders',
          entity_id: item.order_id,
          diff: { 
            from: 'preparing', 
            to: 'ready', 
            trigger: 'all_items_ready',
            station: stationName
          }
        });

        console.log(`✅ All items ready for order ${item.order_id}, updated ORDER status to 'ready'`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['station-items', stationId] });
      toast.success('Item ready!');
    },
  });

  const getElapsedTime = (createdAt: string, startedAt?: string) => {
    const start = startedAt ? new Date(startedAt) : new Date(createdAt);
    const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return 'bg-red-500 text-white';
      case 2: return 'bg-orange-500 text-white';
      case 1: return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3: return 'RUSH';
      case 2: return 'VIP';
      case 1: return 'HIGH';
      default: return 'NORMAL';
    }
  };

  // Group items by order
  const groupedOrders = stationItems.reduce((acc, item) => {
    const orderId = item.order.id;
    if (!acc[orderId]) {
      acc[orderId] = {
        order: item.order,
        items: [],
      };
    }
    acc[orderId].items.push(item);
    return acc;
  }, {} as Record<string, { order: any; items: any[] }>);

  // Loading state
  if (stationLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading {stationName} KDS...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (stationIsError) {
    return (
      <div className="p-8">
        <Card className="border-destructive bg-destructive/10 p-6">
          <h2 className="text-2xl font-bold text-destructive mb-4 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Station KDS Error
          </h2>
          <div className="space-y-2 mb-4 text-sm">
            <p><strong>Station:</strong> {stationName} ({stationId})</p>
            <p><strong>Message:</strong> {(stationError as any)?.message || 'Unknown error'}</p>
            <p><strong>Details:</strong> {(stationError as any)?.details || 'No details'}</p>
            <p><strong>Hint:</strong> {(stationError as any)?.hint || 'No hint'}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['station-items', stationId] })}
          >
            Retry
          </Button>
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold text-sm">Raw Error (Debug)</summary>
            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-60">
              {JSON.stringify(stationError, null, 2)}
            </pre>
          </details>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background p-4 overflow-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <ChefHat className="w-10 h-10 text-primary" />
            {stationName}
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            {stationItems.length} items in queue
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl md:text-5xl font-bold text-foreground">
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className={cn(
        "grid overflow-y-auto",
        isPortraitTablet ? "grid-cols-1 gap-3" : cn(itemGridClass, itemGapClass)
      )}>
        <AnimatePresence>
          {Object.values(groupedOrders).map(({ order, items }) => {
            const priority = order.priority?.[0]?.priority_level || 0;
            const priorityReason = order.priority?.[0]?.reason;

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="will-change-transform"
              >
                <StationOrderCard
                  order={order}
                  items={items}
                  priority={priority}
                  priorityReason={priorityReason}
                  now={now}
                  isMobile={isMobile}
                  isPortraitTablet={isPortraitTablet}
                  onStart={(itemId) => startItemMutation.mutate(itemId)}
                  onComplete={(itemId) => completeItemMutation.mutate(itemId)}
                  getElapsedTime={getElapsedTime}
                  getPriorityColor={getPriorityColor}
                  getPriorityLabel={getPriorityLabel}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {stationItems.length === 0 && (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <CheckCircle className="w-24 h-24 text-green-500 mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-2">All Clear!</h2>
          <p className="text-xl text-muted-foreground">
            No orders in queue for {stationName}
          </p>
        </div>
      )}
    </div>
  );
}

// Station Order Card Component with responsive variants
interface StationOrderCardProps {
  order: any;
  items: any[];
  priority: number;
  priorityReason?: string;
  now: Date;
  isMobile: boolean;
  isPortraitTablet: boolean;
  onStart: (itemId: string) => void;
  onComplete: (itemId: string) => void;
  getElapsedTime: (createdAt: string, startedAt?: string) => string;
  getPriorityColor: (priority: number) => string;
  getPriorityLabel: (priority: number) => string;
}

function StationOrderCard({
  order,
  items,
  priority,
  priorityReason,
  now,
  isMobile,
  isPortraitTablet,
  onStart,
  onComplete,
  getElapsedTime,
  getPriorityColor,
  getPriorityLabel,
}: StationOrderCardProps) {
  const compact = isMobile || isPortraitTablet;

  return (
    <Card className={cn("border-2", priority > 0 ? 'border-primary' : '', compact ? 'p-3' : 'p-6')}>
      {/* Order Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className={cn("font-bold text-foreground", compact ? "text-2xl" : "text-3xl")}>
            {order.order_type === 'dine_in' && order.table?.label
              ? `Table ${order.table.label}`
              : `Order #${order.id.slice(0, 8)}`}
          </h3>
          <p className="text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleTimeString()}
          </p>
        </div>
        {priority > 0 && (
          <Badge className={getPriorityColor(priority)}>
            {getPriorityLabel(priority)}
          </Badge>
        )}
      </div>

      {priorityReason && (
        <div className="mb-4 p-2 bg-yellow-500/10 border border-yellow-500 rounded flex items-start gap-2">
          <AlertTriangle className={cn("text-yellow-600 mt-0.5", compact ? "w-3 h-3" : "w-4 h-4")} />
          <p className={cn("text-yellow-700 dark:text-yellow-300", compact ? "text-xs" : "text-sm")}>
            {priorityReason}
          </p>
        </div>
      )}

      {/* Items */}
      <div className={cn("space-y-3", compact && "space-y-2")}>
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-lg border-2",
              item.status === 'preparing' ? 'bg-primary/10 border-primary' : 'bg-card border-border',
              compact ? 'p-2' : 'p-4'
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("font-bold text-primary", compact ? "text-xl" : "text-2xl")}>
                    {item.quantity}×
                  </span>
                  <span className={cn("font-semibold text-foreground", compact ? "text-base" : "text-xl")}>
                    {item.menu_item?.name || 'Unknown'}
                  </span>
                </div>
                {item.menu_item?.description && !compact && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {item.menu_item.description}
                  </p>
                )}
                {item.notes && (
                  <div className={cn("rounded p-2 bg-yellow-500/10 border border-yellow-500", compact && "p-1")}>
                    <p className={cn("text-yellow-700 dark:text-yellow-300", compact ? "text-xs" : "text-sm")}>
                      <strong>Note:</strong> {item.notes}
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right ml-4">
                <div className={cn(
                  "font-bold tabular-nums",
                  compact ? "text-base" : "text-xl",
                  item.status === 'preparing' ? "text-primary" : "text-warning"
                )}>
                  {getElapsedTime(item.created_at, item.started_at)}
                </div>
                <Badge variant={item.status === 'preparing' ? 'default' : 'outline'} className={compact ? "text-xs" : ""}>
                  {item.status === 'preparing' ? 'Cooking' : 'Queue'}
                </Badge>
              </div>
            </div>

            {/* Action Buttons - Larger for touch */}
            <div className="flex gap-2 mt-2">
              {item.status === 'kitchen_queue' || item.status === 'pending' ? (
                <Button
                  onClick={() => onStart(item.id)}
                  className={cn("flex-1 font-semibold", compact ? "h-12" : "h-14")}
                  size="lg"
                >
                  <ChefHat className={cn("mr-2", compact ? "w-4 h-4" : "w-5 h-5")} />
                  Start
                </Button>
              ) : item.status === 'preparing' ? (
                <Button
                  onClick={() => onComplete(item.id)}
                  className={cn("flex-1 font-semibold", compact ? "h-12" : "h-14")}
                  variant="default"
                  size="lg"
                >
                  <CheckCircle className={cn("mr-2", compact ? "w-4 h-4" : "w-5 h-5")} />
                  Ready
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
