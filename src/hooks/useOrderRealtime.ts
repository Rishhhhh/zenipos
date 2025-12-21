import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeTable } from '@/lib/realtime/RealtimeService';

/**
 * System-wide real-time synchronization for orders
 * OPTIMIZED: Throttled invalidation to prevent spam
 */
export function useOrderRealtime() {
  const queryClient = useQueryClient();
  const lastInvalidation = useRef(0);
  const THROTTLE_MS = 500; // Throttle invalidations to 500ms

  // Stable callback for order changes - throttled
  const handleOrderChange = useCallback((payload: any) => {
    const now = Date.now();
    if (now - lastInvalidation.current < THROTTLE_MS) return;
    lastInvalidation.current = now;

    // Single batch invalidation
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['active-orders'] });
    queryClient.invalidateQueries({ queryKey: ['kds-orders'] });
    
    const newData = payload.new as Record<string, any> | null;
    if (newData?.id) {
      queryClient.invalidateQueries({ queryKey: ['order', newData.id] });
    }
  }, [queryClient]);

  // Stable callback for order items changes - throttled
  const handleItemsChange = useCallback((payload: any) => {
    const now = Date.now();
    if (now - lastInvalidation.current < THROTTLE_MS) return;
    lastInvalidation.current = now;

    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['active-orders'] });
    queryClient.invalidateQueries({ queryKey: ['kds-orders'] });
    
    const newData = payload.new as Record<string, any> | null;
    if (newData?.order_id) {
      queryClient.invalidateQueries({ queryKey: ['order', newData.order_id] });
    }
  }, [queryClient]);

  // Subscribe with stable callbacks
  useRealtimeTable('orders', handleOrderChange);
  useRealtimeTable('order_items', handleItemsChange);
}
