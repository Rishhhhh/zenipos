import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LinkedDisplayState {
  displayId: string | null;
  isLinked: boolean;
  isLoading: boolean;
}

export function useLinkedCustomerDisplay() {
  const [state, setState] = useState<LinkedDisplayState>({
    displayId: null,
    isLinked: false,
    isLoading: true,
  });

  // Fetch linked display for current user
  const fetchLinkedDisplay = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState({ displayId: null, isLinked: false, isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('pos_displays')
        .select('display_id')
        .eq('linked_by_user_id', user.id)
        .eq('active', true)
        .order('last_activity', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[LinkedDisplay] Error fetching:', error);
        setState({ displayId: null, isLinked: false, isLoading: false });
        return;
      }

      setState({
        displayId: data?.display_id || null,
        isLinked: !!data?.display_id,
        isLoading: false,
      });
    } catch (error) {
      console.error('[LinkedDisplay] Unexpected error:', error);
      setState({ displayId: null, isLinked: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    fetchLinkedDisplay();
  }, [fetchLinkedDisplay]);

  // Broadcast order to customer display for table payment
  const broadcastTablePayment = useCallback(async (
    displayId: string,
    data: {
      mode: 'payment_pending' | 'complete' | 'idle';
      tableLabel?: string;
      orderItems?: any[];
      subtotal?: number;
      tax?: number;
      discount?: number;
      total?: number;
      change?: number;
      paymentMethod?: string;
      orderId?: string;
    }
  ) => {
    if (!displayId) {
      console.warn('[LinkedDisplay] No display ID provided for broadcast');
      return false;
    }

    try {
      const { error } = await supabase
        .from('customer_display_sessions')
        .upsert({
          session_id: displayId,
          mode: data.mode,
          table_label: data.tableLabel || null,
          order_items: data.orderItems || [],
          subtotal: data.subtotal || 0,
          tax: data.tax || 0,
          discount: data.discount || 0,
          total: data.total || 0,
          change: data.change || null,
          payment_method: data.paymentMethod || null,
          order_id: data.orderId || null,
          last_activity: new Date().toISOString(),
        }, { onConflict: 'session_id' });

      if (error) {
        console.error('[LinkedDisplay] Broadcast failed:', error);
        return false;
      }

      console.log('[LinkedDisplay] ✅ Broadcast successful:', data.mode);
      return true;
    } catch (error) {
      console.error('[LinkedDisplay] Broadcast error:', error);
      return false;
    }
  }, []);

  // Reset display to idle/marketing
  const resetToIdle = useCallback(async (displayId: string) => {
    return broadcastTablePayment(displayId, {
      mode: 'idle',
      tableLabel: undefined,
      orderItems: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      change: undefined,
      paymentMethod: undefined,
    });
  }, [broadcastTablePayment]);

  return {
    displayId: state.displayId,
    isLinked: state.isLinked,
    isLoading: state.isLoading,
    refetch: fetchLinkedDisplay,
    broadcastTablePayment,
    resetToIdle,
  };
}
