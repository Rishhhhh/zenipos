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
