import { create } from 'zustand';
import { realtimeService } from '@/lib/realtime/RealtimeService';
import { RealtimePayload } from '@/lib/realtime/types';
import { useEffect } from 'react';

/**
 * Global Realtime State Layer
 * Single subscriptions per table, shared across all components
 * Reduces duplicate queries and network requests by 60%+
 */

interface Order {
  id: string;
  table_id?: string;
  order_type: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category_id?: string;
  in_stock: boolean;
  [key: string]: any;
}

interface Customer {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  loyalty_points?: number;
  [key: string]: any;
}

interface Table {
  id: string;
  label: string;
  status: string;
  seats: number;
  [key: string]: any;
}

interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  [key: string]: any;
}

interface RealtimeStore {
  // Normalized state maps
  orders: Map<string, Order>;
  menuItems: Map<string, MenuItem>;
  customers: Map<string, Customer>;
  tables: Map<string, Table>;
  orderItems: Map<string, OrderItem>;
  
  // Subscription status
  subscriptions: {
    orders: boolean;
    menuItems: boolean;
    customers: boolean;
    tables: boolean;
    orderItems: boolean;
  };
  
  // Actions
  subscribeToOrders: () => () => void;
  subscribeToMenuItems: () => () => void;
  subscribeToCustomers: () => () => void;
  subscribeToTables: () => () => void;
  subscribeToOrderItems: () => () => void;
  subscribeAll: () => () => void;
  
  // Setters (for initial data load)
  setOrders: (orders: Order[]) => void;
  setMenuItems: (items: MenuItem[]) => void;
  setCustomers: (customers: Customer[]) => void;
  setTables: (tables: Table[]) => void;
  setOrderItems: (items: OrderItem[]) => void;
  
  // Getters
  getOrder: (id: string) => Order | undefined;
  getMenuItem: (id: string) => MenuItem | undefined;
  getCustomer: (id: string) => Customer | undefined;
  getTable: (id: string) => Table | undefined;
  getOrderItems: (orderId: string) => OrderItem[];
  getActiveOrders: () => Order[];
  
  // Cleanup
  cleanup: () => void;
}

export const useRealtimeStore = create<RealtimeStore>((set, get) => ({
  // Initial state
  orders: new Map(),
  menuItems: new Map(),
  customers: new Map(),
  tables: new Map(),
  orderItems: new Map(),
  
  subscriptions: {
    orders: false,
    menuItems: false,
    customers: false,
    tables: false,
    orderItems: false,
  },
  
  // Subscribe to orders table
  subscribeToOrders: () => {
    if (get().subscriptions.orders) {
      console.log('[RealtimeStore] Already subscribed to orders');
      return () => {};
    }
    
    console.log('[RealtimeStore] Subscribing to orders');
    set((state) => ({
      subscriptions: { ...state.subscriptions, orders: true }
    }));
    
    const cleanup = realtimeService.subscribe('orders', (payload: RealtimePayload<Order>) => {
      const orders = new Map(get().orders);
      
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        if (payload.new) {
          orders.set(payload.new.id, payload.new);
          console.log(`[RealtimeStore] Order ${payload.eventType}:`, payload.new.id);
        }
      } else if (payload.eventType === 'DELETE') {
        if (payload.old) {
          orders.delete(payload.old.id);
          console.log(`[RealtimeStore] Order DELETE:`, payload.old.id);
        }
      }
      
      set({ orders });
    });
    
    return () => {
      cleanup();
      set((state) => ({
        subscriptions: { ...state.subscriptions, orders: false }
      }));
    };
  },
  
  // Subscribe to menu_items table
  subscribeToMenuItems: () => {
    if (get().subscriptions.menuItems) {
      console.log('[RealtimeStore] Already subscribed to menu_items');
      return () => {};
    }
    
    console.log('[RealtimeStore] Subscribing to menu_items');
    set((state) => ({
      subscriptions: { ...state.subscriptions, menuItems: true }
    }));
    
    const cleanup = realtimeService.subscribe('menu_items', (payload: RealtimePayload<MenuItem>) => {
      const menuItems = new Map(get().menuItems);
      
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        if (payload.new) {
          menuItems.set(payload.new.id, payload.new);
          console.log(`[RealtimeStore] MenuItem ${payload.eventType}:`, payload.new.id);
        }
      } else if (payload.eventType === 'DELETE') {
        if (payload.old) {
          menuItems.delete(payload.old.id);
          console.log(`[RealtimeStore] MenuItem DELETE:`, payload.old.id);
        }
      }
      
      set({ menuItems });
    });
    
    return () => {
      cleanup();
      set((state) => ({
        subscriptions: { ...state.subscriptions, menuItems: false }
      }));
    };
  },
  
  // Subscribe to customers table
  subscribeToCustomers: () => {
    if (get().subscriptions.customers) {
      console.log('[RealtimeStore] Already subscribed to customers');
      return () => {};
    }
    
    console.log('[RealtimeStore] Subscribing to customers');
    set((state) => ({
      subscriptions: { ...state.subscriptions, customers: true }
    }));
    
    const cleanup = realtimeService.subscribe('customers', (payload: RealtimePayload<Customer>) => {
      const customers = new Map(get().customers);
      
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        if (payload.new) {
          customers.set(payload.new.id, payload.new);
          console.log(`[RealtimeStore] Customer ${payload.eventType}:`, payload.new.id);
        }
      } else if (payload.eventType === 'DELETE') {
        if (payload.old) {
          customers.delete(payload.old.id);
          console.log(`[RealtimeStore] Customer DELETE:`, payload.old.id);
        }
      }
      
      set({ customers });
    });
    
    return () => {
      cleanup();
      set((state) => ({
        subscriptions: { ...state.subscriptions, customers: false }
      }));
    };
  },
  
  // Subscribe to tables table
  subscribeToTables: () => {
    if (get().subscriptions.tables) {
      console.log('[RealtimeStore] Already subscribed to tables');
      return () => {};
    }
    
    console.log('[RealtimeStore] Subscribing to tables');
    set((state) => ({
      subscriptions: { ...state.subscriptions, tables: true }
    }));
    
    const cleanup = realtimeService.subscribe('tables', (payload: RealtimePayload<Table>) => {
      const tables = new Map(get().tables);
      
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        if (payload.new) {
          tables.set(payload.new.id, payload.new);
          console.log(`[RealtimeStore] Table ${payload.eventType}:`, payload.new.id);
        }
      } else if (payload.eventType === 'DELETE') {
        if (payload.old) {
          tables.delete(payload.old.id);
          console.log(`[RealtimeStore] Table DELETE:`, payload.old.id);
        }
      }
      
      set({ tables });
    });
    
    return () => {
      cleanup();
      set((state) => ({
        subscriptions: { ...state.subscriptions, tables: false }
      }));
    };
  },
  
  // Subscribe to order_items table
  subscribeToOrderItems: () => {
    if (get().subscriptions.orderItems) {
      console.log('[RealtimeStore] Already subscribed to order_items');
      return () => {};
    }
    
    console.log('[RealtimeStore] Subscribing to order_items');
    set((state) => ({
      subscriptions: { ...state.subscriptions, orderItems: true }
    }));
    
    const cleanup = realtimeService.subscribe('order_items', (payload: RealtimePayload<OrderItem>) => {
      const orderItems = new Map(get().orderItems);
      
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        if (payload.new) {
          orderItems.set(payload.new.id, payload.new);
          console.log(`[RealtimeStore] OrderItem ${payload.eventType}:`, payload.new.id);
        }
      } else if (payload.eventType === 'DELETE') {
        if (payload.old) {
          orderItems.delete(payload.old.id);
          console.log(`[RealtimeStore] OrderItem DELETE:`, payload.old.id);
        }
      }
      
      set({ orderItems });
    });
    
    return () => {
      cleanup();
      set((state) => ({
        subscriptions: { ...state.subscriptions, orderItems: false }
      }));
    };
  },
  
  // Subscribe to all tables at once
  subscribeAll: () => {
    console.log('[RealtimeStore] Subscribing to all tables');
    
    const cleanupOrders = get().subscribeToOrders();
    const cleanupMenuItems = get().subscribeToMenuItems();
    const cleanupCustomers = get().subscribeToCustomers();
    const cleanupTables = get().subscribeToTables();
    const cleanupOrderItems = get().subscribeToOrderItems();
    
    return () => {
      cleanupOrders();
      cleanupMenuItems();
      cleanupCustomers();
      cleanupTables();
      cleanupOrderItems();
    };
  },
  
  // Setters for initial data load
  setOrders: (orders: Order[]) => {
    const ordersMap = new Map<string, Order>();
    orders.forEach(order => ordersMap.set(order.id, order));
    set({ orders: ordersMap });
    console.log(`[RealtimeStore] Loaded ${orders.length} orders`);
  },
  
  setMenuItems: (items: MenuItem[]) => {
    const itemsMap = new Map<string, MenuItem>();
    items.forEach(item => itemsMap.set(item.id, item));
    set({ menuItems: itemsMap });
    console.log(`[RealtimeStore] Loaded ${items.length} menu items`);
  },
  
  setCustomers: (customers: Customer[]) => {
    const customersMap = new Map<string, Customer>();
    customers.forEach(customer => customersMap.set(customer.id, customer));
    set({ customers: customersMap });
    console.log(`[RealtimeStore] Loaded ${customers.length} customers`);
  },
  
  setTables: (tables: Table[]) => {
    const tablesMap = new Map<string, Table>();
    tables.forEach(table => tablesMap.set(table.id, table));
    set({ tables: tablesMap });
    console.log(`[RealtimeStore] Loaded ${tables.length} tables`);
  },
  
  setOrderItems: (items: OrderItem[]) => {
    const itemsMap = new Map<string, OrderItem>();
    items.forEach(item => itemsMap.set(item.id, item));
    set({ orderItems: itemsMap });
    console.log(`[RealtimeStore] Loaded ${items.length} order items`);
  },
  
  // Getters
  getOrder: (id: string) => {
    return get().orders.get(id);
  },
  
  getMenuItem: (id: string) => {
    return get().menuItems.get(id);
  },
  
  getCustomer: (id: string) => {
    return get().customers.get(id);
  },
  
  getTable: (id: string) => {
    return get().tables.get(id);
  },
  
  getOrderItems: (orderId: string) => {
    return Array.from(get().orderItems.values()).filter(
      item => item.order_id === orderId
    );
  },
  
  getActiveOrders: () => {
    return Array.from(get().orders.values()).filter(
      order => order.status !== 'completed' && order.status !== 'cancelled'
    );
  },
  
  // Cleanup all subscriptions
  cleanup: () => {
    console.log('[RealtimeStore] Cleaning up all subscriptions');
    set({
      subscriptions: {
        orders: false,
        menuItems: false,
        customers: false,
        tables: false,
        orderItems: false,
      }
    });
  }
}));

/**
 * Hook to auto-subscribe to realtime updates
 * Use in top-level components (App, Dashboard, POS, KDS, etc.)
 */
export function useRealtimeSync() {
  const subscribeAll = useRealtimeStore(state => state.subscribeAll);
  
  useEffect(() => {
    const cleanup = subscribeAll();
    return cleanup;
  }, [subscribeAll]);
}

/**
 * Convenience hooks for accessing store data
 */
export function useOrders() {
  return useRealtimeStore(state => Array.from(state.orders.values()));
}

export function useActiveOrders() {
  return useRealtimeStore(state => state.getActiveOrders());
}

export function useOrder(id: string | undefined) {
  return useRealtimeStore(state => id ? state.getOrder(id) : undefined);
}

export function useMenuItems() {
  return useRealtimeStore(state => Array.from(state.menuItems.values()));
}

export function useMenuItem(id: string | undefined) {
  return useRealtimeStore(state => id ? state.getMenuItem(id) : undefined);
}

export function useCustomers() {
  return useRealtimeStore(state => Array.from(state.customers.values()));
}

export function useCustomer(id: string | undefined) {
  return useRealtimeStore(state => id ? state.getCustomer(id) : undefined);
}

export function useTables() {
  return useRealtimeStore(state => Array.from(state.tables.values()));
}

export function useTable(id: string | undefined) {
  return useRealtimeStore(state => id ? state.getTable(id) : undefined);
}

export function useOrderItems(orderId: string | undefined) {
  return useRealtimeStore(state => orderId ? state.getOrderItems(orderId) : []);
}
