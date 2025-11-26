import { supabase } from '@/integrations/supabase/client';

export async function getTablesWithOrders() {
  console.log('🔍 [getTablesWithOrders] Starting...');
  
  // Step 1: Fetch all tables
  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('*')
    .order('label', { ascending: true });

  console.log('🔍 [getTablesWithOrders] Step 1 - Tables:', { 
    count: tables?.length, 
    error: tablesError,
  });

  if (tablesError) {
    console.error('❌ [getTablesWithOrders] Tables error:', tablesError);
    throw tablesError;
  }
  if (!tables || tables.length === 0) {
    console.warn('⚠️ [getTablesWithOrders] No tables found');
    return [];
  }

  // Step 2: Fetch ALL active orders for all tables (not just current_order_id)
  const tableIds = tables.map(t => t.id);
  
  console.log('🔍 [getTablesWithOrders] Step 2 - Fetching all active orders for tables');
  
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      table_id,
      status,
      total,
      subtotal,
      tax,
      created_at,
      delivered_at,
      paid_at,
      nfc_card_id,
      order_type,
      nfc_cards!orders_nfc_card_id_fkey (card_uid),
      order_items (
        id,
        quantity,
        unit_price,
        menu_items (name)
      )
    `)
    .in('table_id', tableIds)
    .in('status', ['kitchen_queue', 'pending', 'preparing', 'delivered', 'dining', 'serving'])
    .order('created_at', { ascending: true });

  console.log('🔍 [getTablesWithOrders] Step 2 - Orders result:', { 
    count: orders?.length, 
    error: ordersError,
  });

  if (ordersError) {
    console.error('❌ [getTablesWithOrders] Orders error:', ordersError);
    throw ordersError;
  }

  // Step 3: Group orders by table_id
  const ordersByTable = new Map<string, any[]>();
  orders?.forEach(order => {
    if (!order.table_id) return;
    const existing = ordersByTable.get(order.table_id) || [];
    ordersByTable.set(order.table_id, [...existing, order]);
  });

  // Step 4: Attach all orders to each table
  const result = tables.map(table => ({
    ...table,
    current_orders: ordersByTable.get(table.id) || [],
    // Keep current_order for backwards compatibility (most recent order)
    current_order: ordersByTable.get(table.id)?.[ordersByTable.get(table.id)!.length - 1] || null
  }));
  
  console.log('✅ [getTablesWithOrders] Final result:', { 
    totalTables: result.length,
    tablesWithOrders: result.filter(t => t.current_orders.length > 0).length,
    totalActiveOrders: orders?.length || 0
  });
  
  return result;
}

export async function getRecentCompletedOrders(limit = 10) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      total,
      paid_at,
      tables (
        label
      )
    `)
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getTodayMetrics(branchId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get completed orders with timestamps
  const { data: completedOrders, error: completedError } = await supabase
    .from('orders')
    .select('total, created_at, paid_at, table_id')
    .eq('branch_id', branchId)
    .gte('created_at', today.toISOString())
    .in('status', ['completed', 'done'])
    .not('paid_at', 'is', null);

  if (completedError) throw completedError;

  const totalRevenue = completedOrders?.reduce((sum, o) => sum + o.total, 0) || 0;

  // Awaiting payment (delivered but not paid)
  const { data: deliveredOrders, error: deliveredError } = await supabase
    .from('orders')
    .select('id')
    .eq('branch_id', branchId)
    .eq('status', 'delivered');

  if (deliveredError) throw deliveredError;

  const awaitingPayment = deliveredOrders?.length || 0;

  // Average turnover time (creation to payment)
  const avgTurnoverMinutes = completedOrders && completedOrders.length > 0
    ? completedOrders.reduce((sum, o) => {
        const diff = new Date(o.paid_at!).getTime() - new Date(o.created_at).getTime();
        return sum + (diff / 60000);
      }, 0) / completedOrders.length
    : 0;

  return {
    totalRevenue,
    ordersDelivered: completedOrders?.length || 0,
    awaitingPayment,
    avgTurnoverMinutes: Math.round(avgTurnoverMinutes),
  };
}
