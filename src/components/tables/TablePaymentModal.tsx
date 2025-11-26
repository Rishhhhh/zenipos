import { useState } from 'react';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { PrintPreviewModal } from '@/components/pos/PrintPreviewModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface TablePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  table: any;
  onSuccess: () => void;
}

export function TablePaymentModal({ open, onOpenChange, order, table, onSuccess }: TablePaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [previewOrderData, setPreviewOrderData] = useState<any>(null);

  const handlePaymentSuccess = async (orderId?: string) => {
    try {
      console.log('💰 Table Payment Success:', { orderId, table });
      
      // Get ALL orders for this table
      const orderIds = table?.current_orders?.map((o: any) => o.id) || [order.id];
      
      // Update ALL orders to completed
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString(),
        })
        .in('id', orderIds);

      if (updateError) throw updateError;

      // Free up the table (only if table exists - takeaway orders won't have a table)
      if (table?.id) {
        await supabase
          .from('tables')
          .update({
            status: 'available',
            current_order_id: null,
            seated_at: null,
          })
          .eq('id', table.id);
      }

      // Fetch order data and organization settings for customer receipt
      if (orderId) {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            tables!table_id(label),
            order_items(
              *,
              menu_items(id, name, station_id)
            )
          `)
          .eq('id', orderId)
          .single();
        
        if (!orderError && orderData) {
          // Fetch organization details
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name, address, phone')
            .eq('id', orderData.organization_id)
            .single();
          
          // Prepare 80mm customer receipt data
          const receiptData = {
            restaurantName: orgData?.name || 'Restaurant',
            address: orgData?.address || '',
            phone: orgData?.phone || '',
            orderNumber: orderId.substring(0, 8).toUpperCase(),
            tableLabel: orderData.tables?.label || undefined,
            orderType: orderData.order_type?.replace('_', ' ').toUpperCase() || 'DINE IN',
            timestamp: new Date(orderData.paid_at || new Date()),
            items: (orderData.order_items || []).map((item: any) => ({
              name: item.menu_items?.name || 'Unknown Item',
              quantity: item.quantity,
              price: item.price * item.quantity,
              modifiers: item.modifiers ? Object.keys(item.modifiers) : []
            })),
            subtotal: orderData.subtotal || 0,
            tax: orderData.tax || 0,
            total: orderData.total || 0,
            paymentMethod: 'Cash', // TODO: get from payment modal
            cashReceived: undefined, // TODO: get from payment modal
            changeGiven: undefined, // TODO: get from payment modal
            cashier: 'Cashier' // TODO: get from employee session
          };
          
          // Print customer receipt (browser fallback)
          const { BrowserPrintService } = await import('@/lib/print/BrowserPrintService');
          await BrowserPrintService.print80mmReceipt(receiptData);
          
          // Also set preview data for modal
          console.log('✅ Setting preview data for table payment:', orderData);
          setPreviewOrderData({
            orderId: orderId,
            orderNumber: orderId.substring(0, 8),
            items: orderData.order_items || [],
            subtotal: orderData.subtotal,
            tax: orderData.tax,
            total: orderData.total,
            timestamp: orderData.paid_at,
          });
          setShowPrintPreview(true);
        } else {
          console.error('❌ Failed to fetch order for receipt:', orderError);
        }
      }

      const orderCount = table?.current_orders?.length || 1;
      toast({
        title: 'Payment Complete',
        description: table?.label 
          ? `Table ${table.label} is now available${orderCount > 1 ? ` (${orderCount} orders paid)` : ''}`
          : `Order paid successfully${orderCount > 1 ? ` (${orderCount} orders)` : ''}`,
      });

      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['today-metrics'] });
      onSuccess();
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to complete payment',
        description: error.message,
      });
    }
  };

  // Calculate combined total if multiple orders
  const combinedTotal = table?.current_orders?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || order.total;

  return (
    <>
      <PaymentModal
        open={open}
        onOpenChange={onOpenChange}
        orderId={order.id}
        orderNumber={order.id.slice(0, 8)}
        total={combinedTotal}
        onPaymentSuccess={handlePaymentSuccess}
      />
      
      {previewOrderData && (
        <PrintPreviewModal
          open={showPrintPreview}
          onOpenChange={setShowPrintPreview}
          mode="customer"
          orderData={previewOrderData}
          onSendToPrinter={() => {
            setShowPrintPreview(false);
          }}
        />
      )}
    </>
  );
}
