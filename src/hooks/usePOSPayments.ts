import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/lib/store/cart';
import { supabase } from '@/integrations/supabase/client';

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
  
  const [showPaymentNFCScanner, setShowPaymentNFCScanner] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<any>(null);

  const handlePaymentSuccess = async (orderId?: string) => {
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['pending-orders-nfc'] });
    queryClient.invalidateQueries({ queryKey: ['tables'] });
    
    // Fetch order data and show customer receipt preview (after payment) - if setters provided
    if (orderId && setPreviewOrderData && setShowPrintPreview) {
      try {
        const { data: order, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', orderId)
          .single();
        
        if (!error && order) {
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
        }
      } catch (error) {
        console.error('Failed to fetch order for preview:', error);
      }
    }
    
    // Clear payment modal state
    setPendingPaymentOrder(null);
    setShowPaymentModal(false);
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
