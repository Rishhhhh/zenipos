import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * IndexedDB Schema for ZeniPOS offline storage
 * Provides local storage for orders, menu items, and other data
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

// Simplified IndexedDB schema
export interface ZeniPOSDB {
  orders: any;
  menuItems: any;
  categories: any;
  payments: any;
  queuedActions: any;
}

let dbInstance: IDBPDatabase<ZeniPOSDB> | null = null;

/**
 * Initialize and open the IndexedDB database
 */
export async function initDB(): Promise<IDBPDatabase<ZeniPOSDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<ZeniPOSDB>('zenipos', 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log('[IndexedDB] Upgrading from version', oldVersion, 'to', newVersion);
      
      // Orders store
      if (!db.objectStoreNames.contains('orders')) {
        const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
        orderStore.createIndex('by-sync-status', 'synced');
        orderStore.createIndex('by-created-at', 'createdAt');
      }
      
      // Menu items store
      if (!db.objectStoreNames.contains('menuItems')) {
        const menuStore = db.createObjectStore('menuItems', { keyPath: 'id' });
        menuStore.createIndex('by-category', 'category_id');
        menuStore.createIndex('by-in-stock', 'in_stock');
      }
      
      // Categories store
      if (!db.objectStoreNames.contains('categories')) {
        const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
        categoryStore.createIndex('by-sort-order', 'sort_order');
      }
      
      // Payments store
      if (!db.objectStoreNames.contains('payments')) {
        const paymentStore = db.createObjectStore('payments', { keyPath: 'id' });
        paymentStore.createIndex('by-sync-status', 'synced');
        paymentStore.createIndex('by-order', 'orderId');
      }
      
      // Queued actions store
      if (!db.objectStoreNames.contains('queuedActions')) {
        const queueStore = db.createObjectStore('queuedActions', { keyPath: 'id' });
        queueStore.createIndex('by-created-at', 'createdAt');
      }
    },
  });

  console.log('[IndexedDB] Database initialized successfully');
  return dbInstance;
}

/**
 * Get the database instance, initializing if necessary
 */
export async function getDB(): Promise<IDBPDatabase<ZeniPOSDB>> {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
}

/**
 * Close the database connection
 */
export async function closeDB() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('[IndexedDB] Database closed');
  }
}

/**
 * Clear all data from the database (useful for logout/reset)
 */
export async function clearAllData() {
  const db = await getDB();
  const stores = ['orders', 'menuItems', 'categories', 'payments', 'queuedActions'];
  
  for (const storeName of stores) {
    await db.clear(storeName as any);
  }
  
  console.log('[IndexedDB] All data cleared');
}
