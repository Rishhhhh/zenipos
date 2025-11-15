import { Database } from '@/integrations/supabase/types';

// Use the exact order_status enum from database
export type FlowStage = Database['public']['Enums']['order_status'];

// Subset of stages we want to display in the flow (active orders only)
export type ActiveFlowStage = 
  | 'kitchen_queue'   // In queue, waiting to start
  | 'preparing'       // Being cooked
  | 'ready'           // Ready for pickup/service
  | 'serving'         // Being delivered to table
  | 'dining'          // Customer eating
  | 'payment'         // Payment in progress
  | 'completed';      // Finished (show recent)

export interface StageDisplay {
  icon: string;
  label: string;
  color: string;        // Tailwind classes for bg/border
  description: string;  // Tooltip text
}

/**
 * Get display configuration for each order stage
 */
export function getStageDisplay(stage: FlowStage): StageDisplay {
  const displays: Record<FlowStage, StageDisplay> = {
    // Active flow stages (NEW system)
    kitchen_queue: {
      icon: '⏳',
      label: 'Kitchen Queue',
      color: 'bg-yellow-500/10 border-yellow-500/30',
      description: 'Order sent to kitchen, waiting to start cooking (auto-starts after 2 min)',
    },
    preparing: {
      icon: '🍳',
      label: 'Cooking',
      color: 'bg-orange-500/10 border-orange-500/30',
      description: 'Kitchen is preparing the order',
    },
    ready: {
      icon: '✅',
      label: 'Ready',
      color: 'bg-green-500/10 border-green-500/30',
      description: 'Order ready for pickup/service (auto-progresses immediately)',
    },
    serving: {
      icon: '🍽️',
      label: 'Serving',
      color: 'bg-teal-500/10 border-teal-500/30',
      description: 'Being delivered to customer (auto-progresses after 3 min)',
    },
    dining: {
      icon: '🍔',
      label: 'Dining',
      color: 'bg-purple-500/10 border-purple-500/30',
      description: 'Customer is eating',
    },
    payment: {
      icon: '💳',
      label: 'Payment',
      color: 'bg-indigo-500/10 border-indigo-500/30',
      description: 'Payment in progress (auto-completes after 2 min if stuck)',
    },
    completed: {
      icon: '✓',
      label: 'Completed',
      color: 'bg-muted/50 border-border',
      description: 'Order finished and paid',
    },

    // Legacy statuses (for backward compatibility)
    pending: {
      icon: '📝',
      label: 'Pending',
      color: 'bg-blue-500/10 border-blue-500/30',
      description: 'Order created but not sent to kitchen (legacy)',
    },
    done: {
      icon: '✓',
      label: 'Done',
      color: 'bg-muted/50 border-border',
      description: 'Completed (legacy status)',
    },
    paid: {
      icon: '💵',
      label: 'Paid',
      color: 'bg-muted/50 border-border',
      description: 'Paid (legacy status)',
    },
    delivered: {
      icon: '🚚',
      label: 'Delivered',
      color: 'bg-muted/50 border-border',
      description: 'Delivered (legacy status)',
    },
    cancelled: {
      icon: '❌',
      label: 'Cancelled',
      color: 'bg-destructive/10 border-destructive/30',
      description: 'Order was cancelled',
    },
  };

  return displays[stage];
}

/**
 * Get the display order for stages in the flow visualization
 */
export function getFlowStageOrder(): ActiveFlowStage[] {
  return [
    'kitchen_queue',
    'preparing',
    'ready',
    'serving',
    'dining',
    'payment',
    'completed',
  ];
}

/**
 * Check if a stage is part of the active flow
 */
export function isActiveStage(stage: FlowStage): stage is ActiveFlowStage {
  const activeStages: FlowStage[] = [
    'kitchen_queue',
    'preparing',
    'ready',
    'serving',
    'dining',
    'payment',
    'completed',
  ];
  return activeStages.includes(stage);
}
