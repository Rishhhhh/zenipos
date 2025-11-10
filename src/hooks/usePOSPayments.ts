import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/lib/store/cart';

/**
 * Payment flow management for POS
 * Handles NFC scanning, payment modal, and post-payment cleanup
 */
export function usePOSPayments(broadcastIdle: (displayId: string) => void, customerDisplayId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { clearCart } = useCartStore();
  
  const [showPaymentNFCScanner, setShowPaymentNFCScanner] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<any>(null);

  const handlePaymentSuccess = () => {
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['pending-orders-nfc'] });
    queryClient.invalidateQueries({ queryKey: ['tables'] });
    
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
      description: 'Order paid successfully. Ready for next customer.',
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
