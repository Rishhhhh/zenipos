import { getDB } from './indexedDB';

/**
 * Offline Order Management using IndexedDB
 * Handles storing and syncing orders when offline
 */

export interface OfflineOrder {
  id: string;
  tableId: string | null;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  type: string;
  createdAt: string;
  createdBy: string;
  synced: boolean;
  syncAttempts: number;
  lastSyncAttempt?: string;
  error?: string;
}

/**
 * Save an order to local storage (offline mode)
 */
export async function saveOrderOffline(order: Omit<OfflineOrder, 'synced' | 'syncAttempts'>): Promise<void> {
  const db = await getDB();
  
  const offlineOrder: OfflineOrder = {
    ...order,
    synced: false,
    syncAttempts: 0,
  };
  
  await db.put('orders', offlineOrder);
  console.log('[OfflineOrders] Order saved offline:', order.id);
}

/**
 * Get all unsynced orders
 */
export async function getUnsyncedOrders(): Promise<OfflineOrder[]> {
  const db = await getDB();
  const allOrders = await db.getAll('orders');
  return allOrders.filter((order: OfflineOrder) => !order.synced);
}

/**
 * Get a specific order by ID
 */
export async function getOrderById(orderId: string): Promise<OfflineOrder | undefined> {
  const db = await getDB();
  return await db.get('orders', orderId);
}

/**
 * Mark an order as synced
 */
export async function markOrderSynced(orderId: string): Promise<void> {
  const db = await getDB();
  const order = await db.get('orders', orderId);
  
  if (order) {
    order.synced = true;
    await db.put('orders', order);
    console.log('[OfflineOrders] Order marked as synced:', orderId);
  }
}

/**
 * Update sync attempt for an order (failed sync)
 */
export async function updateSyncAttempt(orderId: string, error?: string): Promise<void> {
  const db = await getDB();
  const order = await db.get('orders', orderId);
  
  if (order) {
    order.syncAttempts += 1;
    order.lastSyncAttempt = new Date().toISOString();
    order.error = error;
    await db.put('orders', order);
    console.log('[OfflineOrders] Sync attempt updated:', orderId, 'attempts:', order.syncAttempts);
  }
}

/**
 * Delete an order from local storage
 */
export async function deleteOfflineOrder(orderId: string): Promise<void> {
  const db = await getDB();
  await db.delete('orders', orderId);
  console.log('[OfflineOrders] Order deleted:', orderId);
}

/**
 * Get sync statistics
 */
export async function getSyncStats(): Promise<{
  total: number;
  synced: number;
  pending: number;
  failed: number;
}> {
  const db = await getDB();
  const allOrders = await db.getAll('orders');
  
  const synced = allOrders.filter(o => o.synced).length;
  const failed = allOrders.filter(o => o.syncAttempts > 3 && !o.synced).length;
  
  return {
    total: allOrders.length,
    synced,
    pending: allOrders.length - synced - failed,
    failed,
  };
}

/**
 * Clear all synced orders older than specified days
 */
export async function cleanupSyncedOrders(daysToKeep: number = 7): Promise<number> {
  const db = await getDB();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const allOrders = await db.getAll('orders');
  let deletedCount = 0;
  
  for (const order of allOrders) {
    if (order.synced && new Date(order.createdAt) < cutoffDate) {
      await db.delete('orders', order.id);
      deletedCount++;
    }
  }
  
  console.log('[OfflineOrders] Cleaned up', deletedCount, 'old synced orders');
  return deletedCount;
}
