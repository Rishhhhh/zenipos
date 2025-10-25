import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect } from 'react';

type ChannelConfig = {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: (payload: any) => void;
};

export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to a table's changes
   */
  subscribeToTable(channelName: string, config: ChannelConfig): RealtimeChannel {
    // Cleanup existing channel
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: config.event,
          schema: 'public',
          table: config.table,
          filter: config.filter,
        },
        config.callback
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to session-based cart sync
   */
  subscribeToSession(sessionId: string, callback: (payload: any) => void): RealtimeChannel {
    return this.subscribeToTable(`session:${sessionId}`, {
      table: 'orders',
      event: '*',
      filter: `session_id=eq.${sessionId}`,
      callback,
    });
  }

  /**
   * Subscribe to KDS order updates
   */
  subscribeToKDS(callback: (payload: any) => void): RealtimeChannel {
    return this.subscribeToTable('kds-orders', {
      table: 'orders',
      event: '*',
      callback,
    });
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Cleanup all channels
   */
  cleanup(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

// Singleton instance
export const realtimeManager = new RealtimeManager();

// React hook for easy usage
export function useRealtimeSubscription(
  channelName: string,
  config: ChannelConfig,
  dependencies: any[] = []
) {
  useEffect(() => {
    const channel = realtimeManager.subscribeToTable(channelName, config);
    
    return () => {
      realtimeManager.unsubscribe(channelName);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
