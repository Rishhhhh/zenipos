import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Check, Clock } from "lucide-react";

interface Order {
  id: string;
  session_id: string;
  order_type: string;
  status: string;
  total: number;
  created_at: string;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    notes: string | null;
    menu_items: {
      name: string;
      sku: string;
    };
  }>;
}

export default function KDS() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(new Date());

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch pending orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (name, sku)
          )
        `)
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Order[];
    },
    refetchInterval: 5000, // Fallback polling every 5s
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('kds-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders', 'pending'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Bump order mutation
  const bumpOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'done', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Auto-decrement inventory
      const { error: inventoryError } = await supabase.rpc(
        'decrement_inventory_on_order',
        { order_id_param: orderId }
      );

      if (inventoryError) {
        console.error('Inventory decrement failed:', inventoryError);
        toast({
          variant: 'destructive',
          title: 'Inventory Warning',
          description: 'Order completed but inventory may not be updated. Check manually.',
        });
      }

      // Log to audit
      await supabase.from('audit_log').insert({
        actor: user.id,
        action: 'bump_order',
        entity: 'orders',
        entity_id: orderId,
        diff: { status: 'done', inventory_decremented: !inventoryError },
      });

      return orderId;
    },
    onSuccess: () => {
      toast({
        title: "Order completed",
        description: "Order moved to done, inventory updated",
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to bump order",
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="kiosk-layout p-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Kitchen Display</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-96" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-layout p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Kitchen Display</h1>
        <div className="text-lg font-medium text-muted-foreground">
          {orders?.length || 0} orders in queue
        </div>
      </div>

      {orders?.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-xl text-muted-foreground">No orders in queue</p>
          <p className="text-sm text-muted-foreground mt-2">
            New orders will appear here automatically
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders?.map(order => {
            const elapsedTime = formatDistanceToNow(new Date(order.created_at), {
              addSuffix: false,
            });
            
            return (
              <Card
                key={order.id}
                className={`p-6 ${
                  order.status === 'preparing' ? 'border-warning border-2' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {order.order_type.replace('_', ' ').toUpperCase()}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Order #{order.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-warning">
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">{elapsedTime}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {order.order_items.map(item => (
                    <div key={item.id} className="border-b pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-lg mr-2">{item.quantity}×</span>
                          <span className="font-medium text-foreground">
                            {item.menu_items.name}
                          </span>
                        </div>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-1 ml-8">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  variant="default"
                  onClick={() => bumpOrder.mutate(order.id)}
                  disabled={bumpOrder.isPending}
                >
                  <Check className="h-5 w-5 mr-2" />
                  Bump Order
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
