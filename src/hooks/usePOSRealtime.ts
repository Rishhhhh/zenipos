import { useEffect, useMemo, useCallback } from 'react';
import { useOrderRealtime } from '@/hooks/useOrderRealtime';
import { usePromotions } from '@/lib/hooks/usePromotions';
import { useBroadcastToCustomerDisplay } from '@/hooks/useCustomerDisplaySync';
import { useCartStore } from '@/lib/store/cart';

/**
 * Real-time synchronization for POS
 * Handles order updates, customer display broadcasting, and promotions
 * OPTIMIZED: Debounced cart broadcast to reduce updates
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

  // DEBOUNCE: Broadcast cart updates (avoid spam on rapid add/remove)
  const debouncedBroadcast = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (callback: () => void) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, 300); // 300ms debounce
    };
  }, []);

  // Broadcast cart updates to customer display with debouncing
  useEffect(() => {
    if (customerDisplayId && items.length > 0) {
      debouncedBroadcast(() => broadcastOrderUpdate(customerDisplayId));
    } else if (customerDisplayId && items.length === 0) {
      debouncedBroadcast(() => broadcastIdle(customerDisplayId));
    }
  }, [items, customerDisplayId, broadcastOrderUpdate, broadcastIdle, debouncedBroadcast]);

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
