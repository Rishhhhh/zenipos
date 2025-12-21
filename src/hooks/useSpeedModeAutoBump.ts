import { useEffect, useRef, useCallback } from 'react';
import { useSpeedMode } from './useSpeedMode';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeTable } from '@/lib/realtime/RealtimeService';

const AUTO_BUMP_DELAY_MS = 5000; // 5 seconds

interface PendingOrder {
  id: string;
  created_at: string;
}

/**
 * Background service hook that auto-bumps KDS orders after 5 seconds in Speed Mode.
 * This runs at the app level, independent of whether KDS page is open.
 */
export function useSpeedModeAutoBump() {
  const { speedMode } = useSpeedMode();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Track orders being auto-bumped to prevent duplicates
  const processingRef = useRef<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Bump a single order
  const bumpOrder = useCallback(async (orderId: string) => {
    if (processingRef.current.has(orderId)) return;
    processingRef.current.add(orderId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[AutoBump] No authenticated user, skipping');
        return;
      }

      // Get employee ID
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      // Update order status to 'delivered'
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId)
        .in('status', ['pending', 'preparing']); // Only bump if still pending/preparing

      if (updateError) {
        console.error('[AutoBump] Failed to bump order:', updateError);
        return;
      }

      // Log to audit
      await supabase.from('audit_log').insert({
        action: 'auto_bump',
        entity: 'orders',
        entity_id: orderId,
        actor: employee?.id || user.id,
        diff: { from: 'pending/preparing', to: 'delivered', auto: true, speed_mode: true }
      });

      console.log(`[AutoBump] ⚡ Order ${orderId.slice(0, 8)} auto-bumped`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (err) {
      console.error('[AutoBump] Error:', err);
    } finally {
      processingRef.current.delete(orderId);
      timeoutsRef.current.delete(orderId);
    }
  }, [queryClient]);

  // Schedule auto-bump for an order
  const scheduleAutoBump = useCallback((orderId: string, createdAt: string) => {
    // Don't schedule if already scheduled or processing
    if (timeoutsRef.current.has(orderId) || processingRef.current.has(orderId)) {
      return;
    }

    const orderAge = Date.now() - new Date(createdAt).getTime();
    const delay = Math.max(0, AUTO_BUMP_DELAY_MS - orderAge);

    console.log(`[AutoBump] Scheduling order ${orderId.slice(0, 8)} in ${delay}ms`);

    const timeout = setTimeout(() => {
      bumpOrder(orderId);
    }, delay);

    timeoutsRef.current.set(orderId, timeout);
  }, [bumpOrder]);

  // Cancel scheduled auto-bump
  const cancelAutoBump = useCallback((orderId: string) => {
    const timeout = timeoutsRef.current.get(orderId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(orderId);
    }
  }, []);

  // Fetch and process pending orders
  const checkPendingOrders = useCallback(async () => {
    if (!speedMode) return;

    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, created_at')
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[AutoBump] Failed to fetch orders:', error);
        return;
      }

      if (!orders || orders.length === 0) return;

      // Schedule auto-bump for each order
      orders.forEach((order: PendingOrder) => {
        scheduleAutoBump(order.id, order.created_at);
      });

      // Clean up timeouts for orders that no longer exist
      const orderIds = new Set(orders.map((o: PendingOrder) => o.id));
      timeoutsRef.current.forEach((_, orderId) => {
        if (!orderIds.has(orderId)) {
          cancelAutoBump(orderId);
        }
      });
    } catch (err) {
      console.error('[AutoBump] Error checking orders:', err);
    }
  }, [speedMode, scheduleAutoBump, cancelAutoBump]);

  // Listen for new orders via realtime
  useRealtimeTable('orders', (payload) => {
    if (!speedMode) return;

    if (payload.eventType === 'INSERT' && payload.new) {
      const newOrder = payload.new as PendingOrder;
      if (newOrder.id && newOrder.created_at) {
        scheduleAutoBump(newOrder.id, newOrder.created_at);
      }
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      const updatedOrder = payload.new as any;
      // Cancel if order is no longer pending/preparing
      if (!['pending', 'preparing'].includes(updatedOrder.status)) {
        cancelAutoBump(updatedOrder.id);
      }
    } else if (payload.eventType === 'DELETE' && payload.old) {
      cancelAutoBump((payload.old as any).id);
    }
  }, { enabled: speedMode });

  // Initial check and periodic refresh
  useEffect(() => {
    if (!speedMode) {
      // Clear all timeouts when speed mode is disabled
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
      return;
    }

    // Initial check
    checkPendingOrders();

    // Periodic check every 10 seconds as fallback
    const interval = setInterval(checkPendingOrders, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [speedMode, checkPendingOrders]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  return { speedMode };
}
