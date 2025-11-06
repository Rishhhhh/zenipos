import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore } from '@/lib/store/cart';
import { channelManager } from '@/lib/realtime/channelManager';

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
        }, { onConflict: 'session_id' });
      
      if (error) {
        console.error('Failed to init display session:', error);
      }
      
      setIsConnected(true);
    };

    initSession();

    const cleanup = channelManager.subscribe(
      `customer-display:${displaySessionId}`,
      (payload) => {
        console.log('✅ Display session updated:', payload);
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          setDisplaySession({
            mode: payload.new.mode,
            posSessionId: payload.new.pos_session_id,
            nfcCardUid: payload.new.nfc_card_uid,
            tableLabel: payload.new.table_label,
            cartItems: payload.new.cart_items || [],
            subtotal: payload.new.subtotal || 0,
            tax: payload.new.tax || 0,
            total: payload.new.total || 0,
            discount: payload.new.discount || 0,
            paymentQR: payload.new.payment_qr,
            change: payload.new.change,
          });
        }
      },
      {
        table: 'customer_display_sessions',
        filter: `session_id=eq.${displaySessionId}`
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

  // Database write triggers postgres_changes subscription on Customer Display
  const broadcastUpdate = useCallback(async (displaySessionId: string, update: Partial<DisplaySession>) => {
    try {
      // Update customer display session - postgres_changes will propagate to Customer Display
      const { error } = await supabase
        .from('customer_display_sessions')
        .upsert({
          session_id: displaySessionId,
          pos_session_id: cart.sessionId,
          mode: update.mode || 'ordering',
          nfc_card_uid: update.nfcCardUid || null,
          table_label: update.tableLabel || null,
          // Cart data fields
          cart_items: update.cartItems || [],
          subtotal: update.subtotal || 0,
          tax: update.tax || 0,
          total: update.total || 0,
          discount: update.discount || 0,
          payment_qr: update.paymentQR || null,
          change: update.change || null,
          last_activity: new Date().toISOString(),
        }, { onConflict: 'session_id' });

      if (error) {
        console.error('❌ Display update failed:', error);
        return;
      }

      // Update pos_displays last_activity for cleanup tracking
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('pos_displays')
          .update({ 
            last_activity: new Date().toISOString(),
            pos_session_id: cart.sessionId 
          })
          .eq('display_id', displaySessionId)
          .eq('linked_by_user_id', user.id)
          .eq('active', true);
      }

      console.log('📡 Display updated via DB:', { displaySessionId, mode: update.mode, total: update.total });
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
      nfcCardUid: undefined,
      tableLabel: undefined,
      cartItems: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      discount: 0,
      paymentQR: undefined,
      change: undefined,
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
