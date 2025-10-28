export type SimulationSpeed = 1 | 2 | 5 | 10;

export type OrderStage =
  | 'customer_arrival'
  | 'order_placement'
  | 'kitchen_queue'
  | 'cooking'
  | 'ready'
  | 'serving'
  | 'dining'
  | 'drinks'
  | 'hand_washing'
  | 'clearing'
  | 'payment'
  | 'invoice';

export type ArrivalRate = 'low' | 'medium' | 'high' | 'rush';

export interface SimulatedOrder {
  id: string;
  orderId?: string;
  stage: OrderStage;
  startTime: number;
  customer: {
    name: string;
    avatar: string;
  };
  items: Array<{
    name: string;
    quantity: number;
  }>;
  total: number;
  progress: number;
  tableNumber?: number;
}

export interface SimulationConfig {
  speed: SimulationSpeed;
  arrivalRate: ArrivalRate;
  autoStop?: {
    orderCount?: number;
    durationMinutes?: number;
  };
}

export interface SimulationStats {
  activeOrders: number;
  kitchenQueue: number;
  customersDining: number;
  revenue: number;
  ordersPerHour: number;
  averagePrepTime: number;
  isPeakHour: boolean;
}

export interface StageConfig {
  name: string;
  icon: string;
  duration: number; // milliseconds
  color: string;
  description: string;
}
