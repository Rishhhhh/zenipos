/**
 * Business Context Helper
 * Provides real-time system metrics to JARVIS for situational awareness
 */

export async function getBusinessContext(supabase: any) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Get branch timezone (default to Asia/Kuala_Lumpur)
  const { data: branch } = await supabase
    .from('branches')
    .select('timezone, business_hours')
    .limit(1)
    .single();
  
  const timezone = branch?.timezone || 'Asia/Kuala_Lumpur';
  const businessHours = branch?.business_hours || {
    monday: { open: '09:00', close: '22:00' },
    tuesday: { open: '09:00', close: '22:00' },
    wednesday: { open: '09:00', close: '22:00' },
    thursday: { open: '09:00', close: '22:00' },
    friday: { open: '09:00', close: '22:00' },
    saturday: { open: '09:00', close: '22:00' },
    sunday: { open: '09:00', close: '22:00' }
  };
  
  // Calculate current time in business timezone
  const currentTime = now.toLocaleTimeString('en-US', { 
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const currentDayOfWeek = now.toLocaleDateString('en-US', { 
    timeZone: timezone,
    weekday: 'long' 
  }).toLowerCase();
  
  const todayHours = businessHours[currentDayOfWeek] || businessHours.monday;
  const isOpen = currentTime >= todayHours.open && currentTime <= todayHours.close;

  try {
    const [sales, yesterdaySales, allInventory, activeOrders, employees] = await Promise.all([
      // Today's sales
      supabase.from('orders')
        .select('total, status, created_at')
        .gte('created_at', today),
      
      // Yesterday's sales for comparison
      supabase.from('orders')
        .select('total, status')
        .gte('created_at', yesterday)
        .lt('created_at', today),
      
      // All inventory items (filter in code)
      supabase.from('inventory_items')
        .select('id, name, current_qty, reorder_point'),
      
      // Active orders
      supabase.from('orders')
        .select('id, status, created_at')
        .in('status', ['pending', 'preparing', 'ready']),
      
      // Active employees (currently clocked in) with names
      supabase.from('shifts')
        .select('employee_id, employees(name)')
        .is('clock_out_at', null)
    ]);

    const todayRevenue = sales.data?.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0) || 0;
    const todayOrders = sales.data?.filter((o: any) => o.status === 'completed').length || 0;

    // Yesterday's comparison data
    const yesterdayRevenue = yesterdaySales.data?.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0) || 0;
    const yesterdayOrders = yesterdaySales.data?.filter((o: any) => o.status === 'completed').length || 0;

    // Current hour sales
    const currentHour = now.getHours();
    const currentHourSales = sales.data?.filter((o: any) => {
      const orderHour = new Date(o.created_at).getHours();
      return orderHour === currentHour && o.status === 'completed';
    }).reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0) || 0;

    // Filter low stock items in code
    const lowStock = allInventory.data?.filter((item: any) => 
      item.current_qty <= item.reorder_point
    ) || [];

    // Calculate critical stock (< 2 days supply)
    const criticalStock = lowStock.filter((item: any) => {
      const daysUntilStockout = item.current_qty / Math.max(1, item.reorder_point / 7);
      return daysUntilStockout < 2;
    }).length;

    // Active employee names
    const activeEmployeeNames = employees.data?.map((e: any) => e.employees?.name).filter(Boolean) || [];

    return {
      // NEW: Temporal context
      temporal_context: {
        current_date: today,
        current_time: currentTime,
        current_datetime_iso: now.toISOString(),
        timezone: timezone,
        day_of_week: currentDayOfWeek,
        is_business_open: isOpen,
        business_hours: todayHours,
        readable_date: now.toLocaleDateString('en-MY', { 
          timeZone: timezone,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      },
      
      // Enhanced sales metrics
      today_revenue: todayRevenue,
      today_orders: todayOrders,
      avg_ticket: todayOrders > 0 ? todayRevenue / todayOrders : 0,
      current_hour_sales: currentHourSales,
      
      // Comparison data
      comparison: {
        yesterday_revenue: yesterdayRevenue,
        yesterday_orders: yesterdayOrders,
        revenue_change_percent: yesterdayRevenue > 0 
          ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
          : '0',
        orders_change_percent: yesterdayOrders > 0
          ? ((todayOrders - yesterdayOrders) / yesterdayOrders * 100).toFixed(1)
          : '0'
      },
      
      // Inventory metrics
      low_stock_count: lowStock.length,
      critical_stock: criticalStock,
      
      // Operations metrics
      active_orders: activeOrders.data?.length || 0,
      active_employees: employees.data?.length || 0,
      active_employee_names: activeEmployeeNames,
      
      timestamp: now.toISOString()
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
