import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * System-wide real-time synchronization for orders
 * Ensures all roles see order updates instantly
 */
export function useOrderRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('📡 Setting up real-time order sync...');

    // Subscribe to order changes
    const orderChannel = supabase
      .channel('order-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
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
        }
      )
      .subscribe((status) => {
        console.log('📡 Order realtime status:', status);
      });

    // Subscribe to order_items changes
    const itemsChannel = supabase
      .channel('order-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        (payload) => {
          console.log('📥 Order items change detected:', payload.eventType);
          
          // Invalidate order queries when items change
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['active-orders'] });
          queryClient.invalidateQueries({ queryKey: ['kds-orders'] });
          
          const newData = payload.new as Record<string, any> | null;
          if (newData?.order_id) {
            queryClient.invalidateQueries({ queryKey: ['order', newData.order_id] });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Order items realtime status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up real-time order sync');
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [queryClient]);
}
