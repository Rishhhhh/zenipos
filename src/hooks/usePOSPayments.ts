import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/lib/store/cart';
import { supabase } from '@/integrations/supabase/client';
import { useTillSession } from '@/contexts/TillSessionContext';

/**
 * Payment flow management for POS
 * Handles NFC scanning, payment modal, and post-payment cleanup
 */
export function usePOSPayments(
  broadcastIdle: (displayId: string) => void, 
  customerDisplayId: string | null,
  setPreviewOrderData?: (data: any) => void,
  setShowPrintPreview?: (show: boolean) => void
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { clearCart } = useCartStore();
  const { recordCashTransaction } = useTillSession();
  
  const [showPaymentNFCScanner, setShowPaymentNFCScanner] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<any>(null);

  const handlePaymentSuccess = async (orderId?: string, paymentMethod?: string, totalAmount?: number, changeGiven?: number): Promise<void> => {
    console.log('💰 Payment Success Handler Called:', {
      orderId,
      paymentMethod,
      totalAmount,
      changeGiven,
      hasSetPreviewOrderData: !!setPreviewOrderData,
      hasSetShowPrintPreview: !!setShowPrintPreview
    });
    
    // Record cash transactions in till_ledger if payment was cash
    if (paymentMethod === 'cash' && orderId && totalAmount) {
      try {
        // Get payment record to link
        const { data: payment } = await supabase
          .from('payments')
          .select('id')
          .eq('order_id', orderId)
          .single();

        // Record cash sale
        await recordCashTransaction(totalAmount, 'sale', orderId, payment?.id);

        // Record change given if any
        if (changeGiven && changeGiven > 0) {
          await recordCashTransaction(changeGiven, 'change_given', orderId, payment?.id);
        }
      } catch (error) {
        console.error('Failed to record cash transaction in till:', error);
        // Don't block payment success, just log the error
      }
    }

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['pending-orders-nfc'] });
    queryClient.invalidateQueries({ queryKey: ['tables'] });
    queryClient.invalidateQueries({ queryKey: ['active-till-session'] });
    
    // Fetch order data with station assignments for print preview (after payment)
    console.log('🔍 Checking preview conditions:', {
      hasOrderId: !!orderId,
      hasSetPreviewOrderData: !!setPreviewOrderData,
      hasSetShowPrintPreview: !!setShowPrintPreview,
      willShowPreview: !!(orderId && setPreviewOrderData && setShowPrintPreview)
    });
    
    if (orderId && setPreviewOrderData && setShowPrintPreview) {
      console.log('📄 Fetching order data for preview...');
      
      try {
        const { data: order, error } = await supabase
          .from('orders')
          .select(`
            *,
            tables!table_id(label),
            order_items(
              *,
              menu_items(
                id,
                name,
                station_id
              ),
              stations(
                id,
                name,
                color
              )
            )
          `)
          .eq('id', orderId)
          .single();
        
        console.log('📄 Order fetch result:', { order, error });
        
        if (!error && order) {
          console.log('✅ Setting preview data and showing modal');
          setPreviewOrderData({
            orderId: orderId,
            orderNumber: orderId.substring(0, 8),
            items: order.order_items || [],
            subtotal: order.subtotal,
            tax: order.tax,
            total: order.total,
            timestamp: order.paid_at,
          });
          setShowPrintPreview(true);
          console.log('✅ Preview modal should now be visible');
        } else {
          console.error('❌ Failed to fetch order:', error);
        }
      } catch (error) {
        console.error('❌ Exception fetching order for preview:', error);
      }
    } else {
      console.warn('⚠️ Preview conditions not met, skipping preview');
    }
    
    // Clear pending payment order (payment modal state will be closed by PaymentModal itself after await)
    setPendingPaymentOrder(null);
    setShowPaymentNFCScanner(false);
    
    // Clear ALL cart data including NFC card
    clearCart();
    
    // Broadcast cart clear to customer display
    if (customerDisplayId) {
      broadcastIdle(customerDisplayId);
    }
    
    // Show success toast
    toast({
      title: 'Payment Complete',
      description: 'Review receipt below. Ready for next customer.',
    });
  };

  const handleOrderFound = (order: any) => {
    setPendingPaymentOrder(order);
    setShowPaymentNFCScanner(false);
    setShowPaymentModal(true);
  };

  return {
    showPaymentNFCScanner,
    setShowPaymentNFCScanner,
    showPaymentModal,
    setShowPaymentModal,
    pendingPaymentOrder,
    setPendingPaymentOrder,
    handlePaymentSuccess,
    handleOrderFound,
  };
}
