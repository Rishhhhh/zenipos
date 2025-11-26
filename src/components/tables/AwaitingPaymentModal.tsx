import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBranch } from '@/contexts/BranchContext';
import { queryClient } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { useState } from 'react';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AwaitingPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AwaitingPaymentModal({ open, onOpenChange }: AwaitingPaymentModalProps) {
  const { currentBranch } = useBranch();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: deliveredOrders, isLoading, error } = useQuery({
    queryKey: ['delivered-orders', currentBranch?.id],
    queryFn: async () => {
      console.log('🔍 [AwaitingPaymentModal] Fetching delivered orders, branch:', currentBranch?.id);
      
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_type,
          total,
          table_id,
          delivered_at,
          branch_id,
          tables!table_id(label),
          order_items(
            id,
            quantity,
            unit_price,
            menu_items(name)
          )
        `)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: true });

      // Only filter by branch if one is selected
      if (currentBranch?.id) {
        query = query.eq('branch_id', currentBranch.id);
      }

      const { data, error } = await query;
      
      console.log('🔍 [AwaitingPaymentModal] Query result:', { 
        count: data?.length, 
        error,
        branchFilter: currentBranch?.id || 'none (org-wide)'
      });

      if (error) throw error;
      return data || [];
    },
    enabled: open,
    refetchInterval: 5000,
  });

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setSelectedOrder(null);
    // Invalidate to refresh the list
    queryClient.invalidateQueries({ queryKey: ['delivered-orders'] });
    queryClient.invalidateQueries({ queryKey: ['today-metrics'] });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Orders Awaiting Payment
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            {error && (
              <div className="p-4 mb-4 text-sm text-destructive bg-destructive/10 rounded-md">
                Error loading orders: {(error as Error).message}
              </div>
            )}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading orders...</p>
              </div>
            ) : deliveredOrders && deliveredOrders.length > 0 ? (
              <div className="space-y-3">
                {deliveredOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="cursor-pointer hover:border-warning/50 transition-colors"
                    onClick={() => handleOrderClick(order)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={order.order_type === 'takeaway' ? 'secondary' : 'default'}
                              className="flex items-center gap-1"
                            >
                              {order.order_type === 'takeaway' ? (
                                <>
                                  <ShoppingBag className="h-3 w-3" />
                                  Takeaway
                                </>
                              ) : (
                                <>
                                  <UtensilsCrossed className="h-3 w-3" />
                                  Dine-in
                                </>
                              )}
                            </Badge>
                            
                            {order.tables && (
                              <Badge variant="outline">
                                Table {order.tables.label}
                              </Badge>
                            )}
                            
                            <span className="text-xs text-muted-foreground">
                              #{order.id.slice(0, 8)}
                            </span>
                          </div>

                          <div className="space-y-1">
                            {order.order_items?.slice(0, 3).map((item: any) => (
                              <p key={item.id} className="text-sm text-muted-foreground">
                                {item.quantity}x {item.menu_items?.name || 'Unknown Item'}
                              </p>
                            ))}
                            {order.order_items?.length > 3 && (
                              <p className="text-xs text-muted-foreground italic">
                                +{order.order_items.length - 3} more items
                              </p>
                            )}
                          </div>

                          {order.delivered_at && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Delivered {formatDistance(new Date(order.delivered_at), new Date(), { addSuffix: true })}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            RM {order.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground">No orders awaiting payment</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  All delivered orders have been paid
                </p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedOrder && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          orderId={selectedOrder.id}
          orderNumber={selectedOrder.id.slice(0, 8)}
          total={selectedOrder.total}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
