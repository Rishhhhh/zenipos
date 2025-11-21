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
      // Update order to completed
      await supabase
        .from('orders')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // Free up the table
      await supabase
        .from('tables')
        .update({
          status: 'available',
          current_order_id: null,
          seated_at: null,
        })
        .eq('id', table.id);

      // Fetch order data for print preview
      if (orderId) {
        const { data: orderData, error } = await supabase
          .from('orders')
          .select(`
            *,
            tables!table_id(label),
            order_items(
              *,
              menu_items(id, name, station_id),
              stations(id, name, color)
            )
          `)
          .eq('id', orderId)
          .single();
        
        if (!error && orderData) {
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
          console.log('✅ Print preview modal should now open');
        } else {
          console.error('❌ Failed to fetch order for preview:', error);
        }
      }

      toast({
        title: 'Payment Complete',
        description: `Table ${table.label} is now available`,
      });

      queryClient.invalidateQueries({ queryKey: ['tables'] });
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to complete payment',
        description: error.message,
      });
    }
  };

  return (
    <>
      <PaymentModal
        open={open}
        onOpenChange={onOpenChange}
        orderId={order.id}
        orderNumber={order.id.slice(0, 8)}
        total={order.total}
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
