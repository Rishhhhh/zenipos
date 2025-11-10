import { useEffect } from 'react';
import { useOrderRealtime } from '@/hooks/useOrderRealtime';
import { usePromotions } from '@/lib/hooks/usePromotions';
import { useBroadcastToCustomerDisplay } from '@/hooks/useCustomerDisplaySync';
import { useCartStore } from '@/lib/store/cart';

/**
 * Real-time synchronization for POS
 * Handles order updates, customer display broadcasting, and promotions
 */
export function usePOSRealtime(customerDisplayId: string | null) {
  const { items } = useCartStore();
  
  // Enable system-wide real-time order sync
  useOrderRealtime();
  
  // Auto-evaluate promotions
  usePromotions();
  
  // Customer display broadcast functions
  const { broadcastOrderUpdate, broadcastPayment, broadcastComplete, broadcastIdle } = 
    useBroadcastToCustomerDisplay();

  // Broadcast cart updates to customer display
  useEffect(() => {
    if (customerDisplayId && items.length > 0) {
      broadcastOrderUpdate(customerDisplayId);
    } else if (customerDisplayId && items.length === 0) {
      broadcastIdle(customerDisplayId);
    }
  }, [items, customerDisplayId, broadcastOrderUpdate, broadcastIdle]);

  // Debug logging
  useEffect(() => {
    const { table_id, order_type, tableLabelShort, nfc_card_id, sessionId } = useCartStore.getState();
    console.log('🟢 POS Component State:', {
      itemsCount: items.length,
      table_id,
      order_type,
      tableLabelShort,
      nfc_card_id,
      sessionId,
    });
  }, [items.length]);

  return {
    broadcastOrderUpdate,
    broadcastPayment,
    broadcastComplete,
    broadcastIdle,
  };
}
