import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

class ChannelManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptionCounts: Map<string, number> = new Map();

  subscribe(channelName: string, callback: (payload: any) => void) {
    let channel = this.channels.get(channelName);
    
    if (!channel) {
      channel = supabase.channel(channelName);
      this.channels.set(channelName, channel);
      this.subscriptionCounts.set(channelName, 0);
    }
    
    const count = this.subscriptionCounts.get(channelName)! + 1;
    this.subscriptionCounts.set(channelName, count);
    
    channel
      .on('postgres_changes', { event: '*', schema: 'public' }, callback)
      .subscribe();
    
    return () => {
      this.unsubscribe(channelName);
    };
  }

  private unsubscribe(channelName: string) {
    const count = this.subscriptionCounts.get(channelName) || 0;
    const newCount = Math.max(0, count - 1);
    this.subscriptionCounts.set(channelName, newCount);
    
    if (newCount === 0) {
      const channel = this.channels.get(channelName);
      if (channel) {
        supabase.removeChannel(channel);
        this.channels.delete(channelName);
        this.subscriptionCounts.delete(channelName);
      }
    }
  }

  startHeartbeat() {
    setInterval(() => {
      this.channels.forEach((channel, name) => {
        if (channel.state === 'closed') {
          console.warn(`Dead channel detected: ${name}`);
          this.channels.delete(name);
          this.subscriptionCounts.delete(name);
        }
      });
    }, 30000);
  }
}

export const channelManager = new ChannelManager();
channelManager.startHeartbeat();
