import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Flame, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ExpoStationView() {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: orders = [] } = useQuery({
    queryKey: ['expo-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          table:tables(label),
          items:order_items(
            *,
            menu_item:menu_items(name),
            station:stations(name, type)
          ),
          priority:order_priorities(priority_level, reason)
        `)
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    refetchInterval: 2000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('expo-station')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['expo-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const fireOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'preparing' })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expo-orders'] });
      toast.success('Order fired to kitchen!');
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expo-orders'] });
      toast.success('Order served!');
    },
  });

  const getOrderProgress = (items: any[]) => {
    const total = items.length;
    const ready = items.filter(i => i.status === 'ready').length;
    const preparing = items.filter(i => i.status === 'preparing').length;
    return { total, ready, preparing, pending: total - ready - preparing };
  };

  const canFireOrder = (items: any[]) => {
    return items.every(i => i.status === 'ready');
  };

  const getStationStatus = (items: any[], stationName: string) => {
    const stationItems = items.filter(i => i.station?.name === stationName);
    if (stationItems.length === 0) return null;
    
    const ready = stationItems.filter(i => i.status === 'ready').length;
    const total = stationItems.length;
    
    return { ready, total, isComplete: ready === total };
  };

  return (
    <div className="h-screen bg-background p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
          <Flame className="w-10 h-10 text-orange-500" />
          Expo Station
        </h1>
        <p className="text-muted-foreground text-lg mt-1">
          {orders.length} active orders
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map((order) => {
          const progress = getOrderProgress(order.items);
          const priority = order.priority?.[0]?.priority_level || 0;
          const allReady = canFireOrder(order.items);
          
          // Group items by station
          const stations = Array.from(new Set(order.items.map(i => i.station?.name).filter(Boolean)));

          return (
            <Card key={order.id} className={`p-6 ${allReady ? 'border-2 border-green-500' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {order.order_type === 'dine_in' && order.table
                      ? `Table ${(order.table as any).label || 'Unknown'}`
                      : `Order #${order.id.slice(0, 8)}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>
                {priority > 0 && (
                  <Badge variant="destructive">
                    {priority === 3 ? 'RUSH' : priority === 2 ? 'VIP' : 'HIGH'}
                  </Badge>
                )}
              </div>

              {/* Station Status */}
              <div className="mb-4 space-y-2">
                {stations.map((station) => {
                  const status = getStationStatus(order.items, station);
                  if (!status) return null;
                  
                  return (
                    <div key={station} className="flex items-center justify-between p-2 bg-card rounded">
                      <span className="text-sm font-medium">{station}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {status.ready}/{status.total}
                        </span>
                        {status.isComplete ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{progress.ready}/{progress.total} ready</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      allReady ? 'bg-green-500' : 'bg-primary'
                    }`}
                    style={{ width: `${(progress.ready / progress.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 mb-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2 rounded ${
                      item.status === 'ready'
                        ? 'bg-green-500/10 border border-green-500'
                        : item.status === 'preparing'
                        ? 'bg-orange-500/10 border border-orange-500'
                        : 'bg-card border border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.quantity}×</span>
                      <span className="text-sm">{item.menu_item.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.station?.name || 'N/A'}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              {allReady ? (
                <Button
                  onClick={() => completeOrderMutation.mutate(order.id)}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Serve Order
                </Button>
              ) : (
                <div className="text-center p-3 bg-muted rounded">
                  <p className="text-sm text-muted-foreground">
                    Waiting for {progress.total - progress.ready} items
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center h-96">
          <CheckCircle className="w-24 h-24 text-green-500 mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-2">All Clear!</h2>
          <p className="text-xl text-muted-foreground">No active orders</p>
        </div>
      )}
    </div>
  );
}
