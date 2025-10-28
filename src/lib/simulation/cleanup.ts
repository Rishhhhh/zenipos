import { supabase } from '@/integrations/supabase/client';

export async function clearSimulatedData(): Promise<{
  success: boolean;
  ordersDeleted: number;
  error?: string;
}> {
  try {
    // Find all simulated orders
    const { data: simulatedOrders } = await supabase
      .from('orders')
      .select('id')
      .not('metadata', 'is', null)
      .contains('metadata', { simulated: true });

    if (!simulatedOrders || simulatedOrders.length === 0) {
      return { success: true, ordersDeleted: 0 };
    }

    const orderIds = simulatedOrders.map(o => o.id);

    // Delete order items first (foreign key constraint)
    await supabase
      .from('order_items')
      .delete()
      .in('order_id', orderIds);

    // Delete payments
    await supabase
      .from('payments')
      .delete()
      .in('order_id', orderIds);

    // Delete orders
    const { error } = await supabase
      .from('orders')
      .delete()
      .in('id', orderIds);

    if (error) throw error;

    return {
      success: true,
      ordersDeleted: orderIds.length,
    };
  } catch (error) {
    console.error('Error clearing simulated data:', error);
    return {
      success: false,
      ordersDeleted: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
