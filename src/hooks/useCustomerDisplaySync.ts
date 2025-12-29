import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore } from '@/lib/store/cart';

export type DisplayMode = 'ordering' | 'payment' | 'payment_pending' | 'idle' | 'complete';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifiers?: string[];
}

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
  // New fields for table payment flow
  orderItems?: OrderItem[];
  paymentMethod?: string;
  orderId?: string;
  // Static QR image from organization settings
  paymentQRImageUrl?: string;
}

export function useCustomerDisplaySync(displaySessionId: string) {
  const [displaySession, setDisplaySession] = useState<DisplaySession>({
    mode: 'idle',
    posSessionId: null,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Initialize session and fetch initial state
  useEffect(() => {
    if (!displaySessionId) {
      console.error('[CustomerDisplay] No display session ID provided');
      setError('No display session ID');
      return;
    }

    const initSession = async () => {
      console.log('[CustomerDisplay] Initializing session:', displaySessionId);
      
      // First, try to fetch existing session
      const { data: existing, error: fetchError } = await supabase
        .from('customer_display_sessions')
        .select('*')
        .eq('session_id', displaySessionId)
        .maybeSingle();
      
      if (fetchError) {
        console.error('[CustomerDisplay] Failed to fetch session:', fetchError);
        setError(`Fetch failed: ${fetchError.message}`);
        return;
      }

      if (existing) {
        console.log('[CustomerDisplay] Found existing session:', existing);
        setDisplaySession({
          mode: existing.mode as DisplayMode,
          posSessionId: existing.pos_session_id,
          nfcCardUid: existing.nfc_card_uid,
          tableLabel: existing.table_label,
          cartItems: Array.isArray(existing.cart_items) ? existing.cart_items : [],
          subtotal: existing.subtotal || 0,
          tax: existing.tax || 0,
          total: existing.total || 0,
          discount: existing.discount || 0,
          paymentQR: existing.payment_qr,
          change: existing.change,
          orderItems: Array.isArray(existing.order_items) ? (existing.order_items as unknown as OrderItem[]) : [],
          paymentMethod: existing.payment_method,
          orderId: existing.order_id,
        });
        setLastSync(new Date());
      } else {
        // Create new session if doesn't exist
        console.log('[CustomerDisplay] Creating new session');
        const { error: upsertError } = await supabase
          .from('customer_display_sessions')
          .upsert({
            session_id: displaySessionId,
            mode: 'idle',
            last_activity: new Date().toISOString(),
          }, { onConflict: 'session_id' });
        
        if (upsertError) {
          console.error('[CustomerDisplay] Failed to create session:', upsertError);
          setError(`Create failed: ${upsertError.message}`);
          return;
        }
      }
      
      setIsConnected(true);
      setError(null);
      console.log('[CustomerDisplay] ✅ Session initialized successfully');
    };

    initSession();
  }, [displaySessionId]);

  // Direct Supabase realtime subscription (bypassing RealtimeService for simpler public access)
  useEffect(() => {
    if (!displaySessionId || !isConnected) return;

    console.log('[CustomerDisplay] Setting up realtime subscription for:', displaySessionId);

    const channel = supabase
      .channel(`customer-display-${displaySessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_display_sessions',
          filter: `session_id=eq.${displaySessionId}`,
        },
        (payload) => {
          console.log('[CustomerDisplay] ✅ Realtime update received:', payload);
          const newData = payload.new as any;
          if (newData) {
            setDisplaySession({
              mode: newData.mode as DisplayMode,
              posSessionId: newData.pos_session_id,
              nfcCardUid: newData.nfc_card_uid,
              tableLabel: newData.table_label,
              cartItems: Array.isArray(newData.cart_items) ? newData.cart_items : [],
              subtotal: newData.subtotal || 0,
              tax: newData.tax || 0,
              total: newData.total || 0,
              discount: newData.discount || 0,
              paymentQR: newData.payment_qr,
              change: newData.change,
              orderItems: Array.isArray(newData.order_items) ? (newData.order_items as unknown as OrderItem[]) : [],
              paymentMethod: newData.payment_method,
              orderId: newData.order_id,
              paymentQRImageUrl: newData.payment_qr_image_url,
            });
            setLastSync(new Date());
          }
        }
      )
      .subscribe((status) => {
        console.log('[CustomerDisplay] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[CustomerDisplay] ✅ Realtime subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[CustomerDisplay] ❌ Realtime subscription failed');
          setError('Realtime connection failed');
        }
      });

    return () => {
      console.log('[CustomerDisplay] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [displaySessionId, isConnected]);

  return { displaySession, isConnected, error, lastSync };
}

// Hook for POS to broadcast to customer display
export function useBroadcastToCustomerDisplay() {
  const cart = useCartStore();
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Database write triggers postgres_changes subscription on Customer Display
  const broadcastUpdate = useCallback(async (displaySessionId: string, update: Partial<DisplaySession>) => {
    try {
      // Update customer display session - postgres_changes will propagate to Customer Display
      const updateData = {
        session_id: displaySessionId,
        pos_session_id: cart.sessionId,
        mode: update.mode || 'ordering',
        nfc_card_uid: update.nfcCardUid || null,
        table_label: update.tableLabel || null,
        cart_items: update.cartItems || [],
        subtotal: update.subtotal || 0,
        tax: update.tax || 0,
        total: update.total || 0,
        discount: update.discount || 0,
        payment_qr: update.paymentQR || null,
        change: update.change || null,
        order_items: update.orderItems || [],
        payment_method: update.paymentMethod || null,
        order_id: update.orderId || null,
        payment_qr_image_url: update.paymentQRImageUrl || null,
        last_activity: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('customer_display_sessions')
        .upsert(updateData as any, { onConflict: 'session_id' });

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
  const broadcastPayment = useCallback((displaySessionId: string, qrCodeUrl?: string, qrImageUrl?: string, paymentMethod?: string) => {
    broadcastUpdate(displaySessionId, {
      mode: 'payment',
      posSessionId: cart.sessionId,
      total: cart.getTotal(),
      paymentQR: qrCodeUrl,
      paymentQRImageUrl: qrImageUrl,
      paymentMethod,
    });
  }, [cart.sessionId, cart.getTotal, broadcastUpdate]);

  const broadcastComplete = useCallback((displaySessionId: string, change?: number, paymentMethod?: string, orderItems?: OrderItem[]) => {
    broadcastUpdate(displaySessionId, {
      mode: 'complete',
      posSessionId: cart.sessionId,
      change,
      paymentMethod,
      orderItems,
      total: cart.getTotal(),
    });
  }, [cart.sessionId, cart.getTotal, broadcastUpdate]);

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
      orderItems: [],
      paymentMethod: undefined,
      orderId: undefined,
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
