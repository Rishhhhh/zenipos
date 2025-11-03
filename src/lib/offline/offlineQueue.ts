// Offline queue management for PWA with IndexedDB integration
import { getDB, OfflineOrder } from './indexedDB';
import { getUnsyncedOrders, markOrderSynced } from './offlineOrders';
import { RetryStrategy } from './retryStrategy';

interface QueuedAction {
  id: string;
  type: 'order' | 'payment' | 'update';
  data: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'zenipos_offline_queue';
const MAX_RETRIES = 3;

export class OfflineQueue {
  private queue: QueuedAction[] = [];
  private retryStrategy = new RetryStrategy();

  constructor() {
    this.loadQueue();
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  addToQueue(type: QueuedAction['type'], data: any) {
    const action: QueuedAction = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(action);
    this.saveQueue();
    
    console.log('Added to offline queue:', action);
  }

  async processQueue() {
    if (!navigator.onLine) {
      console.log('Still offline, skipping queue processing');
      return;
    }

    // Process IndexedDB orders first
    const unsyncedOrders = await getUnsyncedOrders();
    console.log(`[Queue] Found ${unsyncedOrders.length} unsynced orders in IndexedDB`);

    for (const order of unsyncedOrders) {
      try {
        await this.retryStrategy.retryWithBackoff(async () => {
          // Sync order to Supabase
          await this.syncOrderToSupabase(order);
          await markOrderSynced(order.id);
        });
      } catch (error) {
        console.error('[Queue] Failed to sync order:', order.id, error);
      }
    }

    // Process localStorage queue
    const toProcess = [...this.queue];
    const failed: QueuedAction[] = [];

    for (const action of toProcess) {
      try {
        await this.retryStrategy.retryWithBackoff(async () => {
          await this.processAction(action);
        });
        console.log('Successfully processed:', action);
        this.queue = this.queue.filter(a => a.id !== action.id);
      } catch (error) {
        console.error('Failed to process action:', action, error);
        action.retries++;
        
        if (action.retries >= MAX_RETRIES) {
          console.error('Max retries reached for action:', action);
          this.queue = this.queue.filter(a => a.id !== action.id);
        } else {
          failed.push(action);
        }
      }
    }

    this.queue = failed;
    this.saveQueue();

    return {
      processed: toProcess.length + unsyncedOrders.length - failed.length,
      failed: failed.length,
    };
  }

  private async syncOrderToSupabase(order: OfflineOrder) {
    console.log('[Queue] Syncing order to Supabase:', order.id);
    // Implementation will be done when integrating with actual Supabase sync
  }

  private async processAction(action: QueuedAction) {
    // This would integrate with your actual sync logic
    // For now, just a placeholder
    switch (action.type) {
      case 'order':
        // Sync order to Supabase
        console.log('Syncing order:', action.data);
        break;
      case 'payment':
        // Sync payment to Supabase
        console.log('Syncing payment:', action.data);
        break;
      case 'update':
        // Sync update to Supabase
        console.log('Syncing update:', action.data);
        break;
    }
  }

  getQueueStatus() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(a => a.retries === 0).length,
      retrying: this.queue.filter(a => a.retries > 0).length,
    };
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();

// Auto-process queue when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online! Processing queue...');
    offlineQueue.processQueue().then(result => {
      if (result) {
        console.log('Queue processing complete:', result);
      }
    });
  });
}
