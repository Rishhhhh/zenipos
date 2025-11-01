// Offline queue management for PWA with IndexedDB integration
import { getDB, OfflineOrder } from './indexedDB';
import { getUnsyncedOrders, markOrderSynced } from './offlineOrders';
import { RetryStrategy } from './retryStrategy';

interface QueuedAction {
  id: string;
  type: 'order' | 'payment' | 'update' | 'analytics' | 'audit';
  priority: 'critical' | 'high' | 'low';
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

  addToQueue(type: QueuedAction['type'], data: any, priority: QueuedAction['priority'] = 'high') {
    const action: QueuedAction = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      priority,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(action);
    this.saveQueue();
    
    console.log(`[Queue] Added ${priority} priority ${type}:`, action.id);
    
    // Process critical actions immediately
    if (priority === 'critical' && navigator.onLine) {
      this.processAction(action).then(() => {
        this.queue = this.queue.filter(a => a.id !== action.id);
        this.saveQueue();
      }).catch(err => {
        console.error('[Queue] Failed to process critical action:', err);
      });
    }
  }

  async processQueue() {
    if (!navigator.onLine) {
      console.log('[Queue] Still offline, skipping queue processing');
      return;
    }

    // Sort by priority: critical > high > low
    const priorityOrder = { critical: 0, high: 1, low: 2 };
    const sortedQueue = [...this.queue].sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    // Process critical and high priority immediately
    const criticalAndHigh = sortedQueue.filter(a => a.priority !== 'low');
    const lowPriority = sortedQueue.filter(a => a.priority === 'low');

    // Process IndexedDB orders first (critical)
    const unsyncedOrders = await getUnsyncedOrders();
    console.log(`[Queue] Found ${unsyncedOrders.length} unsynced orders in IndexedDB`);

    for (const order of unsyncedOrders) {
      try {
        await this.retryStrategy.retryWithBackoff(async () => {
          await this.syncOrderToSupabase(order);
          await markOrderSynced(order.id);
        });
      } catch (error) {
        console.error('[Queue] Failed to sync order:', order.id, error);
      }
    }

    // Process critical/high priority synchronously
    const failed: QueuedAction[] = [];
    for (const action of criticalAndHigh) {
      try {
        await this.retryStrategy.retryWithBackoff(async () => {
          await this.processAction(action);
        });
        console.log('[Queue] Processed:', action.type, action.id);
        this.queue = this.queue.filter(a => a.id !== action.id);
      } catch (error) {
        console.error('[Queue] Failed to process:', action.type, error);
        action.retries++;
        
        if (action.retries >= MAX_RETRIES) {
          console.error('[Queue] Max retries reached:', action.id);
          this.queue = this.queue.filter(a => a.id !== action.id);
        } else {
          failed.push(action);
        }
      }
    }

    // Process low priority in background (non-blocking)
    if (lowPriority.length > 0) {
      this.processLowPriorityBackground(lowPriority);
    }

    this.queue = [...failed, ...lowPriority];
    this.saveQueue();

    return {
      processed: criticalAndHigh.length + unsyncedOrders.length - failed.length,
      failed: failed.length,
      background: lowPriority.length,
    };
  }

  private processLowPriorityBackground(actions: QueuedAction[]) {
    console.log(`[Queue] Processing ${actions.length} low-priority items in background`);
    
    const processBatch = async () => {
      for (const action of actions) {
        try {
          await this.processAction(action);
          this.queue = this.queue.filter(a => a.id !== action.id);
          this.saveQueue();
          console.log('[Queue] Background processed:', action.type, action.id);
        } catch (error) {
          console.error('[Queue] Background process failed:', action.type, error);
          action.retries++;
          if (action.retries >= MAX_RETRIES) {
            this.queue = this.queue.filter(a => a.id !== action.id);
            this.saveQueue();
          }
        }
        
        // Yield to main thread between actions
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => processBatch(), { timeout: 5000 });
    } else {
      setTimeout(() => processBatch(), 100);
    }
  }

  private async syncOrderToSupabase(order: OfflineOrder) {
    console.log('[Queue] Syncing order to Supabase:', order.id);
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Insert order - using any cast to bypass strict type checking
    const insertedOrder = await (supabase.from('orders') as any).insert({
      order_type: order.type,
      status: order.status,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
    }).select().single();
    
    if (insertedOrder.error) throw insertedOrder.error;
    
    // Insert order items
    if (order.items && order.items.length > 0 && insertedOrder.data) {
      const itemsResult = await (supabase.from('order_items') as any).insert(
        order.items.map((item: any) => ({
          order_id: insertedOrder.data.id,
          menu_item_id: item.menuItemId || item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.price,
          notes: item.notes,
        }))
      );
      
      if (itemsResult.error) throw itemsResult.error;
    }
  }

  private async processAction(action: QueuedAction) {
    const { supabase } = await import('@/integrations/supabase/client');
    
    switch (action.type) {
      case 'order':
        // Sync order to Supabase
        const { error: orderError } = await supabase
          .from('orders')
          .insert(action.data);
        if (orderError) throw orderError;
        break;
        
      case 'payment':
        // Sync payment to Supabase
        const { error: paymentError } = await supabase
          .from('payments')
          .insert(action.data);
        if (paymentError) throw paymentError;
        break;
        
      case 'update':
        // Sync update to Supabase
        const { error: updateError } = await supabase
          .from(action.data.table)
          .update(action.data.values)
          .eq('id', action.data.id);
        if (updateError) throw updateError;
        break;
        
      case 'analytics':
      case 'audit':
        // Low-priority background sync
        const { error: logError } = await supabase
          .from('audit_log')
          .insert({
            action: action.type,
            entity: action.data.entity,
            entity_id: action.data.entity_id,
            diff: action.data.diff,
          });
        if (logError) throw logError;
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
