import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore } from '@/lib/store/cart';

export type DisplayMode = 'ordering' | 'payment' | 'idle' | 'complete';

interface DisplaySession {
  mode: DisplayMode;
  posSessionId: string | null;
  cartItems?: any[];
  subtotal?: number;
  tax?: number;
  total?: number;
  discount?: number;
  paymentQR?: string;
  change?: number;
}

export function useCustomerDisplaySync(displaySessionId: string) {
  const [displaySession, setDisplaySession] = useState<DisplaySession>({
    mode: 'idle',
    posSessionId: null,
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to display session updates
    const channel = supabase
      .channel(`customer-display:${displaySessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_display_sessions',
          filter: `session_id=eq.${displaySessionId}`,
        },
        (payload) => {
          console.log('Display session updated:', payload);
        }
      )
      .on('broadcast', { event: 'display-update' }, ({ payload }) => {
        console.log('Display update received:', payload);
        setDisplaySession(payload);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        console.log('Customer display subscription status:', status);
      });

    // Create or update display session in DB
    const initSession = async () => {
      const { error } = await supabase
        .from('customer_display_sessions')
        .upsert({
          session_id: displaySessionId,
          mode: 'idle',
          last_activity: new Date().toISOString(),
        });
      
      if (error) {
        console.error('Failed to init display session:', error);
      }
    };

    initSession();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [displaySessionId]);

  return { displaySession, isConnected };
}

// Hook for POS to broadcast to customer display
export function useBroadcastToCustomerDisplay() {
  const cart = useCartStore();

  const broadcastUpdate = async (displaySessionId: string, update: Partial<DisplaySession>) => {
    const channel = supabase.channel(`customer-display:${displaySessionId}`);
    
    await channel.subscribe();
    
    await channel.send({
      type: 'broadcast',
      event: 'display-update',
      payload: update,
    });

    // Also update DB for persistence
    await supabase
      .from('customer_display_sessions')
      .upsert({
        session_id: displaySessionId,
        pos_session_id: cart.sessionId,
        mode: update.mode || 'ordering',
        last_activity: new Date().toISOString(),
      });
  };

  const broadcastOrderUpdate = (displaySessionId: string) => {
    broadcastUpdate(displaySessionId, {
      mode: 'ordering',
      posSessionId: cart.sessionId,
      cartItems: cart.items,
      subtotal: cart.getSubtotal(),
      tax: cart.getTax(),
      total: cart.getTotal(),
      discount: cart.getDiscount(),
    });
  };

  const broadcastPayment = (displaySessionId: string, qrCodeUrl?: string) => {
    broadcastUpdate(displaySessionId, {
      mode: 'payment',
      posSessionId: cart.sessionId,
      total: cart.getTotal(),
      paymentQR: qrCodeUrl,
    });
  };

  const broadcastComplete = (displaySessionId: string, change?: number) => {
    broadcastUpdate(displaySessionId, {
      mode: 'complete',
      posSessionId: cart.sessionId,
      change,
    });
  };

  const broadcastIdle = (displaySessionId: string) => {
    broadcastUpdate(displaySessionId, {
      mode: 'idle',
      posSessionId: null,
    });
  };

  return {
    broadcastOrderUpdate,
    broadcastPayment,
    broadcastComplete,
    broadcastIdle,
  };
}
