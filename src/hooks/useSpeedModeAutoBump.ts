import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSpeedMode } from './useSpeedMode';
import { useRealtimeTable } from '@/lib/realtime/RealtimeService';

interface PendingOrder {
  id: string;
  status?: string;
  created_at: string;
}

const BUMPABLE_STATUSES = ['pending', 'kitchen_queue', 'preparing'] as const;

/**
 * Background service hook that auto-bumps KDS orders immediately in Speed Mode.
 * Runs app-wide (does not require KDS page to be open).
 */
export function useSpeedModeAutoBump() {
  const { speedMode } = useSpeedMode();
  const queryClient = useQueryClient();

  // Track orders being bumped to prevent duplicates
  const processingRef = useRef<Set<string>>(new Set());

  const bumpOrder = useCallback(
    async (orderId: string) => {
      if (processingRef.current.has(orderId)) return;
      processingRef.current.add(orderId);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        // Update order status to delivered (only if still in a bumpable state)
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'delivered',
            delivered_at: new Date().toISOString(),
            delivered_by: employee?.id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .in('status', [...BUMPABLE_STATUSES]);

        if (updateError) {
          console.error('[AutoBump] Failed to bump order:', updateError);
          return;
        }

        // Keep parity with KDS bump: decrement inventory
        const { error: inventoryError } = await supabase.rpc('decrement_inventory_on_order', {
          order_id_param: orderId,
        });
        if (inventoryError) {
          console.error('[AutoBump] Inventory decrement failed:', inventoryError);
        }

        await supabase.from('audit_log').insert({
          actor: user.id,
          action: 'order_delivered',
          entity: 'orders',
          entity_id: orderId,
          diff: {
            status: 'delivered',
            auto: true,
            speed_mode: true,
            inventory_decremented: !inventoryError,
          },
        });

        console.log(`[AutoBump] ⚡ Order ${orderId.slice(0, 8)} auto-bumped (immediate)`);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      } catch (err) {
        console.error('[AutoBump] Error:', err);
      } finally {
        processingRef.current.delete(orderId);
      }
    },
    [queryClient]
  );

  const maybeBump = useCallback(
    (order: PendingOrder) => {
      if (!speedMode) return;
      if (!order?.id) return;
      if (!order?.status || !BUMPABLE_STATUSES.includes(order.status as any)) return;
      bumpOrder(order.id);
    },
    [bumpOrder, speedMode]
  );

  const checkPendingOrders = useCallback(async () => {
    if (!speedMode) return;

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, status, created_at')
      .in('status', [...BUMPABLE_STATUSES])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[AutoBump] Failed to fetch orders:', error);
      return;
    }

    orders?.forEach((o: PendingOrder) => maybeBump(o));
  }, [maybeBump, speedMode]);

  // Realtime: bump when order is inserted or transitions into kitchen_queue/preparing
  useRealtimeTable(
    'orders',
    (payload) => {
      if (!speedMode) return;

      if (payload.eventType === 'INSERT' && payload.new) {
        maybeBump(payload.new as PendingOrder);
      }

      if (payload.eventType === 'UPDATE' && payload.new) {
        maybeBump(payload.new as PendingOrder);
      }
    },
    { enabled: speedMode }
  );

  useEffect(() => {
    if (!speedMode) return;
    // Fallback poll (in case realtime is interrupted)
    checkPendingOrders();
    const interval = setInterval(checkPendingOrders, 3000);
    return () => clearInterval(interval);
  }, [checkPendingOrders, speedMode]);

  return { speedMode };
}
