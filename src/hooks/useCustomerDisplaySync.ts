import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore } from '@/lib/store/cart';
import { channelManager } from '@/lib/realtime/channelManager';
import { enqueue } from '@/lib/perf/broadcastQueue';

export type DisplayMode = 'ordering' | 'payment' | 'idle' | 'complete';

interface DisplaySession {
  mode: DisplayMode;
  posSessionId: string | null;
  nfcCardUid?: string;
  tableLabel?: string;
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
      
      setIsConnected(true);
    };

    initSession();

    const cleanup = channelManager.subscribe(
      `customer-display:${displaySessionId}`,
      (payload) => {
        console.log('Display session updated:', payload);
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          setDisplaySession(payload.new as DisplaySession);
        }
      }
    );

    return () => {
      cleanup();
      setIsConnected(false);
    };
  }, [displaySessionId]);

  return { displaySession, isConnected };
}

// Hook for POS to broadcast to customer display
export function useBroadcastToCustomerDisplay() {
  const cart = useCartStore();
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Use throttled broadcast queue for performance
  const broadcastUpdate = useCallback(async (displaySessionId: string, update: Partial<DisplaySession>) => {
    try {
      // Update DB for persistence with all data
      await supabase
        .from('customer_display_sessions')
        .upsert({
          session_id: displaySessionId,
          pos_session_id: cart.sessionId,
          mode: update.mode || 'ordering',
          nfc_card_uid: update.nfcCardUid || null,
          table_label: update.tableLabel || null,
          last_activity: new Date().toISOString(),
        });

      // Use throttled broadcast queue for real-time updates
      enqueue(`customer-display:${displaySessionId}`, update);
      
      console.log('📡 Broadcast to customer display:', { displaySessionId, mode: update.mode });
    } catch (error) {
      console.error('❌ Broadcast update failed:', error);
    }
  }, [cart.sessionId]);

  // Debounced version of broadcastOrderUpdate (300ms)
  const broadcastOrderUpdate = useCallback((displaySessionId: string) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Wait 300ms before broadcasting
    debounceTimerRef.current = setTimeout(() => {
      broadcastUpdate(displaySessionId, {
        mode: 'ordering',
        posSessionId: cart.sessionId,
        nfcCardUid: cart.nfcCardUid || undefined,
        tableLabel: cart.tableLabelShort || undefined,
        cartItems: cart.items,
        subtotal: cart.getSubtotal(),
        tax: cart.getTax(),
        total: cart.getTotal(),
        discount: cart.getDiscount(),
      });
    }, 300);
  }, [cart.sessionId, cart.nfcCardUid, cart.tableLabelShort, cart.items, cart.getSubtotal, cart.getTax, cart.getTotal, cart.getDiscount, broadcastUpdate]);

  // Immediate broadcasts (not debounced - one-time actions)
  const broadcastPayment = useCallback((displaySessionId: string, qrCodeUrl?: string) => {
    broadcastUpdate(displaySessionId, {
      mode: 'payment',
      posSessionId: cart.sessionId,
      total: cart.getTotal(),
      paymentQR: qrCodeUrl,
    });
  }, [cart.sessionId, cart.getTotal, broadcastUpdate]);

  const broadcastComplete = useCallback((displaySessionId: string, change?: number) => {
    broadcastUpdate(displaySessionId, {
      mode: 'complete',
      posSessionId: cart.sessionId,
      change,
    });
  }, [cart.sessionId, broadcastUpdate]);

  const broadcastIdle = useCallback((displaySessionId: string) => {
    broadcastUpdate(displaySessionId, {
      mode: 'idle',
      posSessionId: null,
    });
  }, [broadcastUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    broadcastOrderUpdate,
    broadcastPayment,
    broadcastComplete,
    broadcastIdle,
  };
}
