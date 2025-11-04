import { supabase } from '@/integrations/supabase/client';

export async function getTablesWithOrders() {
  // Fetch all tables first
  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('*')
    .order('label', { ascending: true });

  if (tablesError) throw tablesError;

  // Get table IDs that have current orders
  const tableIds = tables?.map(t => t.current_order_id).filter(Boolean) || [];
  
  if (tableIds.length === 0) {
    return tables?.map(t => ({ ...t, current_order: null })) || [];
  }

  // Fetch current orders separately
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
    .in('id', tableIds)
    .in('status', ['pending', 'preparing', 'delivered']);

  if (ordersError) throw ordersError;

  // Match orders to tables
  return tables?.map(table => ({
    ...table,
    current_order: orders?.find(o => o.id === table.current_order_id) || null
  })) || [];
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

  const { data: orders, error } = await supabase
    .from('orders')
    .select('status, total, created_at, delivered_at, paid_at')
    .gte('created_at', today.toISOString());

  if (error) throw error;

  const paidOrders = orders?.filter(o => o.status === 'paid') || [];
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  
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
    ordersDelivered: orders?.filter(o => o.status === 'delivered' || o.status === 'paid').length || 0,
    awaitingPayment: orders?.filter(o => o.status === 'delivered').length || 0,
    avgTurnoverMinutes: Math.round(avgTurnover),
  };
}
