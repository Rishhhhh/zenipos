/**
 * Business Context Helper
 * Provides real-time system metrics to JARVIS for situational awareness
 */

export async function getBusinessContext(supabase: any) {
  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const [sales, allInventory, activeOrders, employees] = await Promise.all([
      // Today's sales
      supabase.from('orders')
        .select('total, status, created_at')
        .gte('created_at', today),
      
      // All inventory items (filter in code)
      supabase.from('inventory_items')
        .select('id, name, current_qty, reorder_point'),
      
      // Active orders
      supabase.from('orders')
        .select('id, status, created_at')
        .in('status', ['pending', 'preparing', 'ready']),
      
      // Active employees (currently clocked in)
      supabase.from('shifts')
        .select('employee_id')
        .is('clock_out_at', null)
    ]);

    const todayRevenue = sales.data?.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0) || 0;
    const todayOrders = sales.data?.filter((o: any) => o.status === 'completed').length || 0;

    // Filter low stock items in code
    const lowStock = allInventory.data?.filter((item: any) => 
      item.current_qty <= item.reorder_point
    ) || [];

    // Calculate critical stock (< 2 days supply)
    const criticalStock = lowStock.filter((item: any) => {
      const daysUntilStockout = item.current_qty / Math.max(1, item.reorder_point / 7);
      return daysUntilStockout < 2;
    }).length;

    return {
      today_revenue: todayRevenue,
      today_orders: todayOrders,
      avg_ticket: todayOrders > 0 ? todayRevenue / todayOrders : 0,
      low_stock_count: lowStock.length,
      critical_stock: criticalStock,
      active_orders: activeOrders.data?.length || 0,
      active_employees: employees.data?.length || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching business context:', error);
    return {
      today_revenue: 0,
      today_orders: 0,
      avg_ticket: 0,
      low_stock_count: 0,
      critical_stock: 0,
      active_orders: 0,
      active_employees: 0,
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch complete context'
    };
  }
}
