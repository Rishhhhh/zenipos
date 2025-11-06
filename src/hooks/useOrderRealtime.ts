import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeTable } from '@/lib/realtime/RealtimeService';

/**
 * System-wide real-time synchronization for orders
 * Ensures all roles see order updates instantly
 * Now uses unified RealtimeService
 */
export function useOrderRealtime() {
  const queryClient = useQueryClient();

  console.log('📡 Setting up real-time order sync...');

  // Subscribe to order changes using unified service
  useRealtimeTable('orders', (payload) => {
    console.log('📥 Order change detected:', payload.eventType, payload);
    
    // Invalidate all order-related queries
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['active-orders'] });
    queryClient.invalidateQueries({ queryKey: ['kds-orders'] });
    
    // If specific order ID, invalidate that too
    const newData = payload.new as Record<string, any> | null;
    if (newData?.id) {
      queryClient.invalidateQueries({ queryKey: ['order', newData.id] });
    }
  });

  // Subscribe to order_items changes using unified service
  useRealtimeTable('order_items', (payload) => {
    console.log('📥 Order items change detected:', payload.eventType);
    
    // Invalidate order queries when items change
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['active-orders'] });
    queryClient.invalidateQueries({ queryKey: ['kds-orders'] });
    
    const newData = payload.new as Record<string, any> | null;
    if (newData?.order_id) {
      queryClient.invalidateQueries({ queryKey: ['order', newData.order_id] });
    }
  });
}
