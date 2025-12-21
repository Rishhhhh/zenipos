import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import React, { useEffect } from 'react';

/**
 * Unified Realtime Service
 * Manages all Supabase realtime subscriptions with automatic cleanup
 * Prevents duplicate subscriptions and memory leaks
 */

interface SubscriptionCallback {
  (payload: any): void;
}

class RealtimeService {
  private channels = new Map<string, RealtimeChannel>();
  private subscribers = new Map<string, Set<SubscriptionCallback>>();
  private stats = {
    channelsCreated: 0,
    channelsRemoved: 0,
    totalSubscribers: 0,
  };

  /**
   * Subscribe to table changes with automatic channel reuse
   */
  subscribe(
    table: string,
    callback: SubscriptionCallback,
    filter?: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
  ): () => void {
    const channelKey = this.getChannelKey(table, filter, event);

    // Create channel if it doesn't exist
    if (!this.channels.has(channelKey)) {
      this.createChannel(channelKey, table, filter, event);
    }

    // Add callback to subscribers
    if (!this.subscribers.has(channelKey)) {
      this.subscribers.set(channelKey, new Set());
    }
    this.subscribers.get(channelKey)!.add(callback);
    this.stats.totalSubscribers++;

    console.log(`[RealtimeService] Subscribed to ${channelKey} (${this.subscribers.get(channelKey)!.size} subscribers)`);

    // Return cleanup function
    return () => this.unsubscribe(channelKey, callback);
  }

  /**
   * Unsubscribe from table changes
   */
  private unsubscribe(channelKey: string, callback: SubscriptionCallback): void {
    const subs = this.subscribers.get(channelKey);
    if (!subs) return;

    subs.delete(callback);
    this.stats.totalSubscribers--;

    // Remove channel if no more subscribers
    if (subs.size === 0) {
      this.removeChannel(channelKey);
    }

    console.log(`[RealtimeService] Unsubscribed from ${channelKey} (${subs.size} subscribers remaining)`);
  }

  /**
   * Create a new realtime channel
   */
  private createChannel(
    channelKey: string,
    table: string,
    filter?: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
  ): void {
    const config: any = {
      event,
      schema: 'public',
      table,
    };

    if (filter) {
      config.filter = filter;
    }

    const channel = supabase
      .channel(channelKey)
      .on('postgres_changes', config, (payload) => {
        // Notify all subscribers
        this.subscribers.get(channelKey)?.forEach((cb) => cb(payload));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[RealtimeService] Channel ${channelKey} subscribed`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[RealtimeService] Channel ${channelKey} error`);
        }
      });

    this.channels.set(channelKey, channel);
    this.stats.channelsCreated++;
  }

  /**
   * Remove a channel and cleanup
   */
  private removeChannel(channelKey: string): void {
    const channel = this.channels.get(channelKey);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelKey);
      this.subscribers.delete(channelKey);
      this.stats.channelsRemoved++;
      console.log(`[RealtimeService] Removed channel ${channelKey}`);
    }
  }

  /**
   * Generate unique channel key
   */
  private getChannelKey(table: string, filter?: string, event?: string): string {
    return `${table}:${filter || 'all'}:${event || '*'}`;
  }

  /**
   * Get subscription statistics for monitoring
   */
  getStats() {
    return {
      activeChannels: this.channels.size,
      totalSubscribers: this.stats.totalSubscribers,
      channelsCreated: this.stats.channelsCreated,
      channelsRemoved: this.stats.channelsRemoved,
      channels: Array.from(this.channels.entries()).map(([key, channel]) => ({
        key,
        state: channel.state,
        subscribers: this.subscribers.get(key)?.size || 0,
      })),
    };
  }

  /**
   * Cleanup all channels (for testing/debugging)
   */
  cleanup(): void {
    console.log('[RealtimeService] Cleaning up all channels');
    this.channels.forEach((channel) => supabase.removeChannel(channel));
    this.channels.clear();
    this.subscribers.clear();
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();

/**
 * React hook for subscribing to table changes
 * Automatically handles cleanup on unmount
 * OPTIMIZED: Uses ref for callback to prevent resubscription on callback change
 */
export function useRealtimeTable(
  table: string,
  callback: (payload: any) => void,
  options?: {
    filter?: string;
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    enabled?: boolean;
  }
) {
  const { filter, event = '*', enabled = true } = options || {};
  const callbackRef = React.useRef(callback);
  
  // Update ref on each render (no resubscription)
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    // Stable wrapper that calls the latest callback
    const stableCallback = (payload: any) => callbackRef.current(payload);
    return realtimeService.subscribe(table, stableCallback, filter, event);
  }, [table, filter, event, enabled]);
}
