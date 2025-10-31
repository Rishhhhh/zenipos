/**
 * Conflict Resolution for Offline Sync
 * Handles conflicts when local and server data diverge
 */

export type ConflictStrategy = 'local-wins' | 'server-wins' | 'merge' | 'manual';

export interface Conflict<T> {
  id: string;
  localVersion: T;
  serverVersion: T;
  type: string;
  detectedAt: Date;
}

export interface ConflictResolution<T> {
  strategy: ConflictStrategy;
  resolver: (local: T, server: T) => T;
}

/**
 * Conflict Resolver Manager
 */
export class ConflictResolver {
  private strategies: Map<string, ConflictResolution<any>> = new Map();

  constructor() {
    // Register default strategies
    this.registerDefaultStrategies();
  }

  /**
   * Register default conflict resolution strategies
   */
  private registerDefaultStrategies() {
    // Orders: Local wins (client is source of truth for new orders)
    this.registerStrategy('order', {
      strategy: 'local-wins',
      resolver: (local, server) => local,
    });

    // Payments: Server wins (never overwrite successful payments)
    this.registerStrategy('payment', {
      strategy: 'server-wins',
      resolver: (local, server) => server,
    });

    // Inventory: Server wins (centralized inventory)
    this.registerStrategy('inventory', {
      strategy: 'server-wins',
      resolver: (local, server) => server,
    });

    // Order Status: Server wins (KDS updates status)
    this.registerStrategy('order-status', {
      strategy: 'server-wins',
      resolver: (local, server) => server,
    });

    // Menu items: Server wins (menu managed centrally)
    this.registerStrategy('menu-item', {
      strategy: 'server-wins',
      resolver: (local, server) => server,
    });
  }

  /**
   * Register a custom conflict resolution strategy
   */
  registerStrategy<T>(type: string, resolution: ConflictResolution<T>) {
    this.strategies.set(type, resolution);
  }

  /**
   * Resolve a conflict between local and server versions
   */
  resolve<T>(conflict: Conflict<T>): T {
    const strategy = this.strategies.get(conflict.type);

    if (!strategy) {
      console.warn(`[ConflictResolver] No strategy found for type: ${conflict.type}, defaulting to server-wins`);
      return conflict.serverVersion;
    }

    console.log(
      `[ConflictResolver] Resolving conflict for ${conflict.type} using strategy: ${strategy.strategy}`
    );

    return strategy.resolver(conflict.localVersion, conflict.serverVersion);
  }

  /**
   * Detect conflicts between local and server data
   */
  detectConflicts<T extends { id: string; updated_at?: string }>(
    localItems: T[],
    serverItems: T[]
  ): Conflict<T>[] {
    const conflicts: Conflict<T>[] = [];
    const serverMap = new Map(serverItems.map(item => [item.id, item]));

    for (const localItem of localItems) {
      const serverItem = serverMap.get(localItem.id);

      if (!serverItem) {
        // Item doesn't exist on server (likely new local item)
        continue;
      }

      // Check if timestamps differ (indicating concurrent modifications)
      if (localItem.updated_at && serverItem.updated_at) {
        const localTime = new Date(localItem.updated_at).getTime();
        const serverTime = new Date(serverItem.updated_at).getTime();

        if (localTime !== serverTime) {
          conflicts.push({
            id: localItem.id,
            localVersion: localItem,
            serverVersion: serverItem,
            type: this.inferType(localItem),
            detectedAt: new Date(),
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Merge two objects (simple shallow merge)
   */
  private merge<T extends object>(local: T, server: T): T {
    return { ...server, ...local };
  }

  /**
   * Infer the type of an object for conflict resolution
   */
  private inferType(obj: any): string {
    if ('order_id' in obj || 'table_id' in obj) return 'order';
    if ('payment_method' in obj) return 'payment';
    if ('current_qty' in obj) return 'inventory';
    if ('price' in obj && 'category_id' in obj) return 'menu-item';
    return 'unknown';
  }

  /**
   * Resolve all conflicts in a batch
   */
  resolveAll<T>(conflicts: Conflict<T>[]): T[] {
    return conflicts.map(conflict => this.resolve(conflict));
  }
}

export const conflictResolver = new ConflictResolver();

/**
 * Manual conflict resolution UI data
 */
export interface ManualConflictData {
  conflicts: Conflict<any>[];
  onResolve: (resolved: any[]) => void;
  onCancel: () => void;
}
