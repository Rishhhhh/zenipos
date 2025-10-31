// Offline queue management for PWA
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

    const toProcess = [...this.queue];
    const failed: QueuedAction[] = [];

    for (const action of toProcess) {
      try {
        await this.processAction(action);
        console.log('Successfully processed:', action);
        // Remove from queue
        this.queue = this.queue.filter(a => a.id !== action.id);
      } catch (error) {
        console.error('Failed to process action:', action, error);
        action.retries++;
        
        if (action.retries >= MAX_RETRIES) {
          console.error('Max retries reached for action:', action);
          // Remove from queue after max retries
          this.queue = this.queue.filter(a => a.id !== action.id);
        } else {
          failed.push(action);
        }
      }
    }

    // Update queue with failed actions
    this.queue = failed;
    this.saveQueue();

    return {
      processed: toProcess.length - failed.length,
      failed: failed.length,
    };
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
