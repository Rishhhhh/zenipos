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
    tables: tables?.map(t => ({ label: t.label, current_order_id: t.current_order_id }))
  });

  if (tablesError) {
    console.error('❌ [getTablesWithOrders] Tables error:', tablesError);
    throw tablesError;
  }
  if (!tables || tables.length === 0) {
    console.warn('⚠️ [getTablesWithOrders] No tables found');
    return [];
  }

  // Step 2: Extract current order IDs from tables
  const currentOrderIds = tables
    .map(t => t.current_order_id)
    .filter((id): id is string => id !== null && id !== undefined);

  // If no tables have current orders, return tables with null orders
  if (currentOrderIds.length === 0) {
    return tables.map(table => ({
      ...table,
      current_order: null
    }));
  }

  // Step 3: Fetch orders for these IDs (including all pending payment statuses)
  console.log('🔍 [getTablesWithOrders] Step 3 - Fetching orders for IDs:', currentOrderIds);
  
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      total,
      created_at,
      delivered_at,
      paid_at,
      nfc_card_id,
      nfc_cards!orders_nfc_card_id_fkey (card_uid),
      order_items (
        id,
        quantity,
        unit_price,
        menu_items (name)
      )
    `)
    .in('id', currentOrderIds)
    .in('status', ['kitchen_queue', 'pending', 'preparing', 'delivered']);

  console.log('🔍 [getTablesWithOrders] Step 3 - Orders result:', { 
    count: orders?.length, 
    error: ordersError,
    orders: orders?.map(o => ({ id: o.id, status: o.status, nfc_card_id: o.nfc_card_id }))
  });

  if (ordersError) {
    console.error('❌ [getTablesWithOrders] Orders error:', ordersError);
    throw ordersError;
  }

  // Step 4: Join orders to tables client-side
  const result = tables.map(table => ({
    ...table,
    current_order: orders?.find(order => order.id === table.current_order_id) || null
  }));
  
  console.log('✅ [getTablesWithOrders] Final result:', { 
    totalTables: result.length,
    tablesWithOrders: result.filter(t => t.current_order).length
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
