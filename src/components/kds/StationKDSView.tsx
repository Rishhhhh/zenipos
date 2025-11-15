import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Clock, ChefHat, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeTable } from '@/lib/realtime/RealtimeService';
import { trackPerformance } from '@/lib/monitoring/sentry';

interface StationKDSViewProps {
  stationId: string;
  stationName: string;
}

export function StationKDSView({ stationId, stationName }: StationKDSViewProps) {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(new Date());

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: stationItems = [] } = useQuery({
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
            table:tables(label),
            priority:order_priorities(priority_level, reason)
          ),
          menu_item:menu_items(name, description)
        `)
        .eq('station_id', stationId)
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
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
          <div className="text-5xl font-bold text-foreground">
            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {Object.values(groupedOrders).map(({ order, items }) => {
            const priority = order.priority?.[0]?.priority_level || 0;
            const priorityReason = order.priority?.[0]?.reason;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={`p-6 border-2 ${priority > 0 ? 'border-primary' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-3xl font-bold text-foreground">
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
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        {priorityReason}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border-2 ${
                          item.status === 'preparing'
                            ? 'bg-primary/10 border-primary'
                            : 'bg-card border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl font-bold text-primary">
                                {item.quantity}×
                              </span>
                              <span className="text-xl font-semibold text-foreground">
                                {item.menu_item.name}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-sm text-muted-foreground italic">
                                Note: {item.notes}
                              </p>
                            )}
                            {item.dietary_alerts && item.dietary_alerts.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {item.dietary_alerts.map((alert, i) => (
                                  <Badge key={i} variant="destructive" className="text-xs">
                                    {alert}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {item.modifiers.map((mod: any, i: number) => (
                                  <p key={i} className="text-sm text-muted-foreground">
                                    + {mod.name}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2 text-xl font-mono text-foreground">
                              <Clock className="w-5 h-5" />
                              {getElapsedTime(item.created_at, item.started_at)}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          {item.status === 'pending' && (
                            <Button
                              onClick={() => startItemMutation.mutate(item.id)}
                              className="flex-1"
                              size="lg"
                            >
                              <ChefHat className="w-4 h-4 mr-2" />
                              Start
                            </Button>
                          )}
                          {item.status === 'preparing' && (
                            <Button
                              onClick={() => completeItemMutation.mutate(item.id)}
                              className="flex-1"
                              variant="default"
                              size="lg"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Ready
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
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
