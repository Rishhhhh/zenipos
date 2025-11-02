import { supabase } from '@/integrations/supabase/client';

/**
 * Performance optimization: Throttled broadcast queue
 * Coalesces rapid channel publishes into 150-250ms windows to reduce overhead
 * 
 * Usage: enqueue('topic-name', payload) instead of channel.send()
 */

const THROTTLE_WINDOW_MS = 200; // Adjust between 100-500ms as needed

interface QueuedBroadcast {
  payload: any;
  timestamp: number;
}

const queue = new Map<string, QueuedBroadcast>();
let rafId: number | null = null;
let lastFlush = Date.now();
const channels = new Map<string, ReturnType<typeof supabase.channel>>();

/**
 * Enqueue a broadcast to be sent after throttle window
 * Multiple calls for the same topic will keep only the last payload
 */
export function enqueue(topic: string, payload: any): void {
  queue.set(topic, { payload, timestamp: Date.now() });
  
  if (!rafId) {
    rafId = requestAnimationFrame(() => {
      const now = Date.now();
      if (now - lastFlush >= THROTTLE_WINDOW_MS) {
        flush();
        lastFlush = now;
      } else {
        // Schedule another check
        rafId = null;
        enqueue(topic, payload); // Re-schedule
      }
    });
  }
}

/**
 * Immediately flush all queued broadcasts
 */
async function flush(): Promise<void> {
  if (queue.size === 0) {
    rafId = null;
    return;
  }

  const batchToSend = Array.from(queue.entries());
  queue.clear();
  rafId = null;

  // Send all broadcasts in parallel
  await Promise.all(
    batchToSend.map(async ([topic, { payload }]) => {
      try {
        // Get or create channel for this topic
        let channel = channels.get(topic);
        if (!channel) {
          channel = supabase.channel(topic);
          await channel.subscribe();
          channels.set(topic, channel);
        }

        // Send the broadcast
        await channel.send({
          type: 'broadcast',
          event: 'update',
          payload,
        });
      } catch (error) {
        console.error(`[BroadcastQueue] Failed to send to ${topic}:`, error);
      }
    })
  );
}

/**
 * Cleanup: unsubscribe from all channels
 */
export async function cleanup(): Promise<void> {
  for (const [topic, channel] of channels.entries()) {
    await supabase.removeChannel(channel);
  }
  channels.clear();
  queue.clear();
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flush(); // Final flush before unload
  });
}
