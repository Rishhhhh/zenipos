import { supabase } from '@/integrations/supabase/client';
import {
  SimulatedOrder,
  SimulationConfig,
  OrderStage,
  SimulationStats,
} from './types';
import {
  generateCustomerName,
  generateAvatar,
  getCookingTime,
  getDiningTime,
  weightedRandom,
  getArrivalRate,
  isPeakHour,
} from './distributions';
import { getVAREngine } from './varEngine';

export class SimulationEngine {
  private activeOrders: Map<string, SimulatedOrder> = new Map();
  private config: SimulationConfig;
  private isRunning = false;
  private isPaused = false;
  private timers: Set<NodeJS.Timeout> = new Set();
  private stats: SimulationStats = {
    activeOrders: 0,
    kitchenQueue: 0,
    customersDining: 0,
    revenue: 0,
    ordersPerHour: 0,
    averagePrepTime: 0,
    isPeakHour: false,
  };
  private orderCount = 0;
  private startTime = 0;
  private varEngine = getVAREngine();

  constructor(config: SimulationConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.orderCount = 0;

    // Start order generation loop
    this.scheduleNextOrder();
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  stop(): void {
    this.isRunning = false;
    this.isPaused = false;

    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Clear active orders
    this.activeOrders.clear();
  }

  private scheduleNextOrder(): void {
    if (!this.isRunning) return;

    const hour = new Date().getHours();
    const lambda = getArrivalRate(hour, this.config.arrivalRate) / 60; // Orders per minute
    const interval = (60 / lambda) * 1000; // Convert to milliseconds
    const adjustedInterval = interval / this.config.speed; // Speed adjustment

    const timer = setTimeout(() => {
      if (!this.isPaused) {
        this.generateOrder();
      }
      this.scheduleNextOrder();
    }, adjustedInterval);

    this.timers.add(timer);
  }

  private async generateOrder(): Promise<void> {
    try {
      // Check auto-stop conditions
      if (this.config.autoStop?.orderCount && this.orderCount >= this.config.autoStop.orderCount) {
        this.stop();
        return;
      }

      const orderId = crypto.randomUUID();
      const customer = {
        name: generateCustomerName(),
        avatar: generateAvatar(),
      };

      // Fetch available menu items
      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('id, name, price')
        .eq('in_stock', true)
        .limit(20);

      if (!menuItems || menuItems.length === 0) return;

      // Select 1-4 items with weighted probability
      const itemCount = weightedRandom([1, 2, 3, 4], [0.2, 0.4, 0.3, 0.1]);
      const selectedItems = [];
      const orderItems = [];

      for (let i = 0; i < itemCount; i++) {
        const item = menuItems[Math.floor(Math.random() * menuItems.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;

        selectedItems.push({
          name: item.name,
          quantity,
        });

        orderItems.push({
          menu_item_id: item.id,
          quantity,
          unit_price: item.price,
        });
      }

      const total = orderItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

      // Create simulated order object
      const simulatedOrder: SimulatedOrder = {
        id: orderId,
        stage: 'customer_arrival',
        startTime: Date.now(),
        customer,
        items: selectedItems,
        total,
        progress: 0,
        tableNumber: Math.floor(Math.random() * 20) + 1,
      };

      this.activeOrders.set(orderId, simulatedOrder);
      this.orderCount++;

      // Transition to order_placement stage
      this.scheduleStageTransition(orderId, 'order_placement', 2000 / this.config.speed);

      // Create actual order in database
      this.createDatabaseOrder(orderId, orderItems, total, simulatedOrder.tableNumber!);
    } catch (error) {
      console.error('Error generating order:', error);
    }
  }

  private async createDatabaseOrder(
    orderId: string,
    orderItems: Array<{ menu_item_id: string; quantity: number; unit_price: number }>,
    total: number,
    tableNumber: number
  ): Promise<void> {
    try {
      const { data: order } = await supabase
        .from('orders')
        .insert({
          session_id: orderId,
          order_type: 'dine_in',
          status: 'pending',
          total,
          subtotal: total,
          tax: 0,
          discount: 0,
          metadata: { simulated: true, table_number: tableNumber },
        })
        .select()
        .single();

      if (!order) return;

      // Update simulated order with database ID
      const simulatedOrder = this.activeOrders.get(orderId);
      if (simulatedOrder) {
        simulatedOrder.orderId = order.id;
      }

      // Insert order items
      const items = orderItems.map(item => ({
        order_id: order.id,
        ...item,
      }));

      await supabase.from('order_items').insert(items);
    } catch (error) {
      console.error('❌ SIMULATION DATABASE ERROR:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    }
  }

  private scheduleStageTransition(orderId: string, nextStage: OrderStage, delay: number): void {
    const timer = setTimeout(() => {
      if (!this.isRunning || this.isPaused) return;

      const order = this.activeOrders.get(orderId);
      if (!order) return;

      order.stage = nextStage;
      order.progress = 0;

      // Schedule next transition
      this.handleStageTransition(orderId, nextStage);
    }, delay);

    this.timers.add(timer);
  }

  private async handleStageTransition(orderId: string, stage: OrderStage): Promise<void> {
    const order = this.activeOrders.get(orderId);
    if (!order) return;

    const stageDelays: Record<OrderStage, number> = {
      customer_arrival: 2000,
      order_placement: 15000,
      kitchen_queue: 5000,
      cooking: getCookingTime(order.items.length),
      ready: 30000,
      serving: 45000,
      dining: getDiningTime(),
      drinks: 120000,
      hand_washing: 60000,
      clearing: 180000,
      payment: 120000,
      invoice: 10000,
    };

    const nextStages: Record<OrderStage, OrderStage | null> = {
      customer_arrival: 'order_placement',
      order_placement: 'kitchen_queue',
      kitchen_queue: 'cooking',
      cooking: 'ready',
      ready: 'serving',
      serving: 'dining',
      dining: 'drinks',
      drinks: 'hand_washing',
      hand_washing: 'clearing',
      clearing: 'payment',
      payment: 'invoice',
      invoice: null,
    };

    // Update order status in database
    if (order.orderId) {
      const statusMap: Record<OrderStage, 'pending' | 'preparing' | 'done' | 'cancelled' | 'completed'> = {
        customer_arrival: 'pending',
        order_placement: 'pending',
        kitchen_queue: 'pending',
        cooking: 'preparing',
        ready: 'done',
        serving: 'done',
        dining: 'done',
        drinks: 'done',
        hand_washing: 'done',
        clearing: 'done',
        payment: 'completed', // Changed to 'completed' for reports
        invoice: 'completed',
      };

      try {
        await supabase
          .from('orders')
          .update({ status: statusMap[stage] })
          .eq('id', order.orderId);

        // Create payment when reaching payment stage
        if (stage === 'payment') {
          const method = weightedRandom(['qr', 'cash', 'card'] as const, [0.6, 0.3, 0.1]);
          await supabase.from('payments').insert([{
            order_id: order.orderId,
            method,
            amount: order.total,
            status: 'completed' as const,
            provider: method === 'qr' ? 'duitnow' : null,
          }]);

          console.log('✅ Completed simulated order:', order.orderId, `RM ${order.total.toFixed(2)}`);
          this.stats.revenue += order.total;
        }
      } catch (error) {
        console.error('❌ Error updating order status:', error);
      }
    }

    const nextStage = nextStages[stage];
    if (nextStage) {
      const delay = stageDelays[stage] / this.config.speed;
      this.scheduleStageTransition(orderId, nextStage, delay);
    } else {
      // Order complete, remove from active orders
      this.activeOrders.delete(orderId);
    }

    this.updateStats();
  }

  private updateStats(): void {
    const orders = Array.from(this.activeOrders.values());

    this.stats.activeOrders = orders.length;
    this.stats.kitchenQueue = orders.filter(o =>
      ['kitchen_queue', 'cooking'].includes(o.stage)
    ).length;
    this.stats.customersDining = orders.filter(o => o.stage === 'dining').length;

    const elapsedHours = (Date.now() - this.startTime) / (1000 * 60 * 60);
    this.stats.ordersPerHour = elapsedHours > 0 ? this.orderCount / elapsedHours : 0;
    this.stats.isPeakHour = isPeakHour();
  }

  getActiveOrders(): SimulatedOrder[] {
    return Array.from(this.activeOrders.values());
  }

  getStats(): SimulationStats {
    return { ...this.stats };
  }
}
