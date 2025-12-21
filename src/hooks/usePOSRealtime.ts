import { useEffect, useRef, useCallback } from 'react';
import { useOrderRealtime } from '@/hooks/useOrderRealtime';
import { usePromotions } from '@/lib/hooks/usePromotions';
import { useBroadcastToCustomerDisplay } from '@/hooks/useCustomerDisplaySync';
import { useCartStore } from '@/lib/store/cart';

/**
 * Real-time synchronization for POS
 * OPTIMIZED: Minimal re-renders, throttled broadcasts
 */
export function usePOSRealtime(customerDisplayId: string | null) {
  const itemsLength = useCartStore((s) => s.items.length);
  const broadcastTimeout = useRef<NodeJS.Timeout>();
  
  // Enable system-wide real-time order sync
  useOrderRealtime();
  
  // Auto-evaluate promotions
  usePromotions();
  
  // Customer display broadcast functions
  const { broadcastOrderUpdate, broadcastPayment, broadcastComplete, broadcastIdle } = 
    useBroadcastToCustomerDisplay();

  // Throttled broadcast - only once per 400ms max
  useEffect(() => {
    if (!customerDisplayId) return;
    
    clearTimeout(broadcastTimeout.current);
    broadcastTimeout.current = setTimeout(() => {
      if (itemsLength > 0) {
        broadcastOrderUpdate(customerDisplayId);
      } else {
        broadcastIdle(customerDisplayId);
      }
    }, 400);

    return () => clearTimeout(broadcastTimeout.current);
  }, [itemsLength, customerDisplayId, broadcastOrderUpdate, broadcastIdle]);

  return {
    broadcastOrderUpdate,
    broadcastPayment,
    broadcastComplete,
    broadcastIdle,
  };
}
