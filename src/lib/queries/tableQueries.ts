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
      nfc_cards (card_uid),
      order_items (
        id,
        quantity,
        unit_price,
        menu_items (name)
      )
    `)
    .in('id', currentOrderIds)
    .in('status', ['pending', 'preparing', 'delivered']);

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

export async function getTodayMetrics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, status, total, created_at, delivered_at, paid_at, table_id')
    .gte('created_at', today.toISOString());

  if (ordersError) throw ordersError;

  // Get current table assignments to validate awaiting payment
  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('current_order_id')
    .not('current_order_id', 'is', null);

  if (tablesError) throw tablesError;

  const currentOrderIds = new Set(tables?.map(t => t.current_order_id) || []);

  const paidOrders = orders?.filter(o => o.status === 'paid') || [];
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  
  // Only count delivered orders that are currently on tables
  const awaitingPayment = orders?.filter(o => 
    o.status === 'delivered' && currentOrderIds.has(o.id)
  ).length || 0;
  
  const turnovers = paidOrders
    .filter(o => o.created_at && o.paid_at)
    .map(o => {
      const created = new Date(o.created_at!).getTime();
      const paid = new Date(o.paid_at!).getTime();
      return (paid - created) / 1000 / 60; // minutes
    });

  const avgTurnover = turnovers.length > 0
    ? turnovers.reduce((sum, t) => sum + t, 0) / turnovers.length
    : 0;

  return {
    totalRevenue,
    ordersDelivered: orders?.filter(o => ['delivered', 'paid'].includes(o.status)).length || 0,
    awaitingPayment,
    avgTurnoverMinutes: Math.round(avgTurnover),
  };
}
