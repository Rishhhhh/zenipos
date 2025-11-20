export interface TableStatus {
  status: 'available' | 'occupied' | 'reserved';
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  canAssignOrder: boolean;
  order?: any;
}

export function getTableStatus(table: any): TableStatus {
  // Reserved takes precedence (manual override)
  if (table.status === 'reserved' && !table.current_order) {
    return {
      status: 'reserved',
      label: 'Reserved',
      color: 'warning',
      bgColor: 'bg-warning/10',
      textColor: 'text-warning',
      borderColor: 'border-warning/30',
      canAssignOrder: false,
    };
  }
  
  // Check for active order (source of truth)
  const hasActiveOrder = table.current_order && 
    ['pending', 'preparing', 'delivered'].includes(table.current_order.status);
  
  if (hasActiveOrder) {
    return {
      status: 'occupied',
      label: table.current_order.status === 'delivered' ? 'Ready to Pay' : 'Occupied',
      color: 'danger',
      bgColor: 'bg-danger/10',
      textColor: 'text-danger',
      borderColor: 'border-danger/30',
      canAssignOrder: false,
      order: table.current_order,
    };
  }
  
  // Default: Available
  return {
    status: 'available',
    label: 'Available',
    color: 'success',
    bgColor: 'bg-success/10',
    textColor: 'text-success',
    borderColor: 'border-success/30',
    canAssignOrder: true,
  };
}

export function getStatusColorClasses(status: 'available' | 'occupied' | 'reserved'): string {
  const statusObj = getTableStatus({ status, current_order: null });
  return `${statusObj.bgColor} ${statusObj.textColor} ${statusObj.borderColor}`;
}

export function getTableStatusColor(table: any): string {
  if (!table.current_order) {
    return 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-700 dark:text-emerald-400';
  }

  const status = table.current_order.status;

  switch (status) {
    case 'pending':
    case 'kitchen_queue':
      return 'bg-blue-500/20 border-blue-500 text-blue-700 dark:bg-blue-950/20 dark:border-blue-700 dark:text-blue-400';
    
    case 'preparing':
    case 'cooking':
      return 'bg-amber-500/20 border-amber-500 text-amber-700 dark:bg-amber-950/20 dark:border-amber-700 dark:text-amber-400';
    
    case 'ready':
    case 'delivered':
      return 'bg-red-500/20 border-red-500 text-red-700 dark:bg-red-950/20 dark:border-red-700 dark:text-red-400';
    
    case 'completed':
    case 'paid':
      return 'bg-violet-500/20 border-violet-500 text-violet-700 dark:bg-violet-950/20 dark:border-violet-700 dark:text-violet-400';
    
    default:
      return 'bg-muted border-border text-muted-foreground';
  }
}

export function getTableStatusLabel(table: any): string {
  if (!table.current_order) return 'Available';
  
  const status = table.current_order.status;
  const statusMap: Record<string, string> = {
    'pending': 'Ordered',
    'kitchen_queue': 'In Queue',
    'preparing': 'Cooking',
    'cooking': 'Cooking',
    'ready': 'Ready to Pay',
    'delivered': 'Ready to Pay',
    'completed': 'Completed',
    'paid': 'Paid',
  };
  
  return statusMap[status] || status;
}
