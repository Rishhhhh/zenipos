import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { useState } from 'react';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PrintPreviewModal } from '@/components/pos/PrintPreviewModal';
import { useToast } from '@/hooks/use-toast';
import { qzPrintReceiptEscpos, getConfiguredPrinterName } from '@/lib/print/qzEscposReceipt';
import { buildReceiptText80mm } from '@/lib/print/receiptText80mm';
import { BrowserPrintService } from '@/lib/print/BrowserPrintService';
import { getCashDrawerSettings } from '@/lib/hardware/cashDrawer';

interface AwaitingPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AwaitingPaymentModal({ open, onOpenChange }: AwaitingPaymentModalProps) {
  const { currentBranch } = useBranch();
  const { organization } = useAuth();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [previewOrderData, setPreviewOrderData] = useState<any>(null);

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

  const handlePaymentSuccess = async (orderId?: string, paymentMethod?: string, totalAmount?: number, changeGiven?: number) => {
    const cashReceived = totalAmount ? (totalAmount + (changeGiven || 0)) : undefined;
    
    console.log('💰 [AwaitingPaymentModal] Payment success:', { orderId, paymentMethod, totalAmount, changeGiven });
    
    // Fetch order with full details for receipt
    if (orderId) {
      try {
        const { data: order, error } = await supabase
          .from('orders')
          .select(`
            *,
            tables!table_id(label),
            order_items(
              id,
              quantity,
              unit_price,
              notes,
              modifiers,
              menu_items(id, name, station_id)
            )
          `)
          .eq('id', orderId)
          .single();

        if (!error && order) {
          // Build items for receipt
          const receiptItems = (order.order_items || []).map((item: any) => ({
            name: item.menu_items?.name || 'Unknown',
            quantity: item.quantity,
            price: item.unit_price,
            total: item.quantity * item.unit_price,
          }));

          const subtotal = order.subtotal || order.total;
          const tax = order.tax || 0;
          const total = order.total;

          // Try QZ Tray printing first
          const printerName = getConfiguredPrinterName();
          const drawerSettings = getCashDrawerSettings();
          
          if (printerName) {
            try {
              const receiptText = buildReceiptText80mm({
                orgName: organization?.name || 'Restaurant',
                branchName: currentBranch?.name,
                branchAddress: currentBranch?.address,
                order: {
                  id: orderId,
                  order_number: orderId.substring(0, 8),
                  tables: order.tables,
                  order_items: receiptItems.map((it: any) => ({
                    name: it.name,
                    quantity: it.quantity,
                    total: it.total,
                  })),
                  subtotal,
                  tax,
                  total,
                  paid_at: new Date().toISOString(),
                },
                paymentMethod: paymentMethod?.toUpperCase() || 'CASH',
                cashReceived,
                changeGiven: changeGiven || 0,
              });

              await qzPrintReceiptEscpos({
                printerName,
                receiptText,
                cut: true,
                openDrawer: paymentMethod === 'cash' && drawerSettings.enabled,
              });
              
              console.log('✅ [AwaitingPaymentModal] Receipt printed via QZ Tray');
            } catch (printError) {
              console.warn('⚠️ QZ Tray print failed, falling back to browser:', printError);
              // Fallback to browser print
              await BrowserPrintService.print80mmReceipt({
                restaurantName: organization?.name || 'Restaurant',
                address: currentBranch?.address,
                phone: currentBranch?.phone,
                orderNumber: orderId.substring(0, 8),
                tableLabel: order.tables?.label,
                orderType: order.order_type || 'takeaway',
                timestamp: new Date(),
                items: receiptItems,
                subtotal,
                tax,
                total,
                paymentMethod: paymentMethod?.toUpperCase() || 'CASH',
                cashReceived,
                changeGiven: changeGiven || 0,
              });
            }
          }

          // Set preview data for print preview modal
          setPreviewOrderData({
            orderId,
            orderNumber: orderId.substring(0, 8),
            items: order.order_items || [],
            subtotal,
            tax,
            total,
            timestamp: new Date().toISOString(),
            paymentMethod: paymentMethod?.toUpperCase() || 'CASH',
            cashReceived,
            changeGiven: changeGiven || 0,
          });
          setShowPrintPreview(true);
        }
      } catch (err) {
        console.error('❌ [AwaitingPaymentModal] Error fetching order for receipt:', err);
      }
    }

    setShowPaymentModal(false);
    setSelectedOrder(null);
    
    // Invalidate to refresh the list
    queryClient.invalidateQueries({ queryKey: ['delivered-orders'] });
    queryClient.invalidateQueries({ queryKey: ['today-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    
    toast({
      title: 'Payment Complete',
      description: 'Receipt printed. Ready for next order.',
    });
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

      {previewOrderData && (
        <PrintPreviewModal
          open={showPrintPreview}
          onOpenChange={setShowPrintPreview}
          mode="customer"
          orderData={previewOrderData}
          orgName={organization?.name}
          branchName={currentBranch?.name}
          onSendToPrinter={() => setShowPrintPreview(false)}
        />
      )}
    </>
  );
}
