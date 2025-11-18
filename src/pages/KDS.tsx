import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRealtimeTable } from "@/lib/realtime/RealtimeService";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Check, Clock, RotateCcw, Edit } from "lucide-react";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { RecallOrderModal } from "@/components/pos/RecallOrderModal";
import { ModifyOrderModal } from "@/components/pos/ModifyOrderModal";
import { Badge } from "@/components/ui/badge";
import { useOrderRealtime } from "@/hooks/useOrderRealtime";

interface Order {
  id: string;
  session_id: string;
  order_type: string;
  status: string;
  total: number;
  created_at: string;
  recall_requested?: boolean;
  table_id?: string;
  tables?: {
    label: string;
  } | null;
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
  usePerformanceMonitor('KDS');
  useOrderRealtime(); // Enable real-time sync
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ticks, setTicks] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(Date.now());
  const [selectedOrderForRecall, setSelectedOrderForRecall] = useState<string | null>(null);
  const [selectedOrderForModify, setSelectedOrderForModify] = useState<string | null>(null);

  // Optimized RAF timer (updates every 500ms)
  useEffect(() => {
    const loop = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current >= 500) {
        setTicks(t => t + 1);
        lastUpdateRef.current = now;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, []);

  // Fetch pending orders using SECURITY DEFINER function to bypass RLS
  const { data: orders, isLoading, error: queryError } = useQuery({
    queryKey: ['orders', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_kds_orders');
      
      if (error) {
        console.error('❌ KDS RPC ERROR:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast({
          title: "KDS Error",
          description: `Failed to load orders: ${error.message}`,
          variant: "destructive"
        });
        throw error;
      }
      
      // Transform the RPC result to match the expected Order interface
      const transformedData = data?.map((order: any) => ({
        ...order,
        tables: order.table_label ? { label: order.table_label } : null,
        order_items: order.order_items || []
      })) as Order[];
      
      console.log('✅ KDS loaded orders:', transformedData?.length || 0);
      return transformedData;
    },
    refetchInterval: 5000, // Fallback polling every 5s
  });

  // Real-time subscription using unified service
  useRealtimeTable('orders', () => {
    queryClient.invalidateQueries({ queryKey: ['orders', 'pending'] });
  });

  // Bump order mutation
  const bumpOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get employee ID from user
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      // Update order status to 'delivered'
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          delivered_by: employee?.id || null,
          updated_at: new Date().toISOString() 
        })
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
          description: 'Order delivered but inventory may not be updated.',
        });
      }

      // Log to audit
      await supabase.from('audit_log').insert({
        actor: user.id,
        action: 'order_delivered',
        entity: 'orders',
        entity_id: orderId,
        diff: { 
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          inventory_decremented: !inventoryError 
        },
      });

      return orderId;
    },
    onSuccess: () => {
      toast({
        title: "Order delivered!",
        description: "Food delivered to customer. Ready for payment.",
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to deliver order",
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

  if (queryError) {
    return (
      <div className="kiosk-layout p-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Kitchen Display</h1>
        <Card className="p-6 border-destructive bg-destructive/10">
          <h2 className="text-2xl font-bold text-destructive mb-4">⚠️ KDS Loading Error</h2>
          <div className="space-y-2 mb-4">
            <p className="text-sm"><strong>Message:</strong> {(queryError as any)?.message || 'Unknown error'}</p>
            <p className="text-sm"><strong>Details:</strong> {(queryError as any)?.details || 'No details'}</p>
            <p className="text-sm"><strong>Hint:</strong> {(queryError as any)?.hint || 'No hint'}</p>
            <p className="text-sm"><strong>Code:</strong> {(queryError as any)?.code || 'No code'}</p>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">Raw Error (Debug)</summary>
            <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(queryError, null, 2)}
            </pre>
          </details>
        </Card>
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
            const elapsedTime = formatDistanceToNow(new Date(order.created_at), { addSuffix: false });
            
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
                      {order.order_type === 'dine_in' && order.tables?.label
                        ? `Table ${order.tables.label}`
                        : order.order_type.replace('_', ' ').toUpperCase()}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Order #{order.id.slice(0, 8)}
                      {order.tables?.label && ` • Table ${order.tables.label}`}
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

                {order.recall_requested && (
                  <Badge variant="destructive" className="w-full mb-2">
                    Recall Requested - Awaiting Approval
                  </Badge>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedOrderForRecall(order.id)}
                    disabled={order.recall_requested}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedOrderForModify(order.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    className="col-span-1"
                    variant="default"
                    onClick={() => bumpOrder.mutate(order.id)}
                    disabled={bumpOrder.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <RecallOrderModal
        open={!!selectedOrderForRecall}
        onOpenChange={(open) => !open && setSelectedOrderForRecall(null)}
        orderId={selectedOrderForRecall || ''}
        orderNumber={selectedOrderForRecall?.substring(0, 8) || ''}
        onSuccess={() => setSelectedOrderForRecall(null)}
      />

      <ModifyOrderModal
        open={!!selectedOrderForModify}
        onOpenChange={(open) => !open && setSelectedOrderForModify(null)}
        orderId={selectedOrderForModify || ''}
        orderNumber={selectedOrderForModify?.substring(0, 8) || ''}
      />
    </div>
  );
}
